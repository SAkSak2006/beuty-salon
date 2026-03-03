/**
 * Data migration script: SQLite (salon.db) → PostgreSQL
 * Usage: node src/migrate-data.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { pool, runMigrations } = require('./config/database');

const DB_PATH = path.join(__dirname, '../../server/salon.db');

const TABLES = [
  { sqlite: 'service_categories', pg: 'service_categories' },
  { sqlite: 'services', pg: 'services' },
  { sqlite: 'employees', pg: 'employees' },
  { sqlite: 'clients', pg: 'clients' },
  { sqlite: 'appointments', pg: 'appointments' },
  { sqlite: 'payments', pg: 'payments' },
  { sqlite: 'inventory', pg: 'inventory' },
  { sqlite: 'inventory_categories', pg: 'inventory_categories' },
  { sqlite: 'suppliers', pg: 'suppliers' },
  { sqlite: 'schedule', pg: 'schedule' },
  { sqlite: 'competency_matrix', pg: 'competency_matrix' },
  { sqlite: 'vacations', pg: 'vacations' },
  { sqlite: 'price_history', pg: 'price_history' },
  { sqlite: 'inventory_transactions', pg: 'inventory_transactions' },
  { sqlite: 'purchase_orders', pg: 'purchase_orders' },
  { sqlite: 'service_materials', pg: 'service_materials' },
];

// Fields that need JSON parsing (stored as TEXT in SQLite, JSONB in PG)
const JSON_FIELDS = {
  services: ['requiredMaterials'],
  employees: ['specialization'],
  purchase_orders: ['items'],
};

// Fields that need boolean conversion (INTEGER 0/1 in SQLite → BOOLEAN in PG)
const BOOLEAN_FIELDS = {
  services: ['isActive'],
  schedule: ['isWorkingDay'],
  competency_matrix: ['canPerform'],
};

// Fields that are dates (TEXT '' in SQLite → NULL in PG)
const DATE_FIELDS = {
  employees: ['hireDate'],
  clients: ['birthdate', 'registrationDate', 'lastVisit'],
  appointments: ['date'],
  payments: ['date'],
  inventory: ['lastRestockDate', 'expiryDate'],
  vacations: ['startDate', 'endDate'],
  price_history: ['changeDate'],
  inventory_transactions: ['date'],
  purchase_orders: ['orderDate', 'deliveryDate', 'date'],
};

function readSqliteRows(db, table) {
  const stmt = db.prepare(`SELECT * FROM ${table}`);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function transformRow(row, tableName) {
  const result = { ...row };

  // Convert JSON text fields
  const jsonFields = JSON_FIELDS[tableName] || [];
  for (const field of jsonFields) {
    if (result[field] && typeof result[field] === 'string') {
      try { result[field] = JSON.parse(result[field]); } catch { result[field] = []; }
    } else {
      result[field] = [];
    }
  }

  // Convert boolean fields
  const boolFields = BOOLEAN_FIELDS[tableName] || [];
  for (const field of boolFields) {
    result[field] = !!result[field];
  }

  // Convert empty date strings to null
  const dateFields = DATE_FIELDS[tableName] || [];
  for (const field of dateFields) {
    if (result[field] === '' || result[field] === null || result[field] === undefined) {
      result[field] = null;
    }
  }

  // Convert all empty strings to null for date-like fields
  for (const [key, val] of Object.entries(result)) {
    if (val === '' && (key.toLowerCase().includes('date') || key.toLowerCase().includes('at'))) {
      result[key] = null;
    }
  }

  return result;
}

async function migrateTable(sqliteDb, tableName) {
  const rows = readSqliteRows(sqliteDb, tableName);
  if (rows.length === 0) {
    console.log(`  ${tableName}: 0 rows (skipped)`);
    return 0;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear existing data
    await client.query(`DELETE FROM ${tableName}`);

    for (const row of rows) {
      const transformed = transformRow(row, tableName);
      const columns = Object.keys(transformed);
      const values = columns.map(col => transformed[col] === undefined ? null : transformed[col]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const quotedColumns = columns.map(col => `"${col}"`).join(', ');

      await client.query(
        `INSERT INTO ${tableName} (${quotedColumns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        values
      );
    }

    // Reset sequence to max id
    const maxId = await client.query(`SELECT COALESCE(MAX(id), 0) as max_id FROM ${tableName}`);
    if (maxId.rows[0].max_id > 0) {
      await client.query(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), $1)`, [maxId.rows[0].max_id]);
    }

    await client.query('COMMIT');
    console.log(`  ${tableName}: ${rows.length} rows migrated`);
    return rows.length;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`  ${tableName}: ERROR -`, err.message);
    return 0;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('=== SQLite → PostgreSQL Data Migration ===\n');

  if (!fs.existsSync(DB_PATH)) {
    console.error(`SQLite database not found: ${DB_PATH}`);
    process.exit(1);
  }

  // Run migrations first
  console.log('Running PostgreSQL migrations...');
  await runMigrations();
  console.log();

  // Open SQLite
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const sqliteDb = new SQL.Database(fileBuffer);
  console.log('SQLite database opened\n');

  // Migrate each table
  console.log('Migrating tables:');
  let totalRows = 0;
  for (const { sqlite, pg } of TABLES) {
    totalRows += await migrateTable(sqliteDb, pg);
  }

  console.log(`\nMigration complete! Total rows: ${totalRows}`);

  sqliteDb.close();
  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
