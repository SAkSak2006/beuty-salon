const { Pool, types } = require('pg');

// Return DATE (OID 1082) as 'YYYY-MM-DD' string, not JS Date
types.setTypeParser(1082, (val) => val);
// Return TIMESTAMP (OID 1114) as string
types.setTypeParser(1114, (val) => val);
// Return TIMESTAMPTZ (OID 1184) as string
types.setTypeParser(1184, (val) => val);
// Return NUMERIC/DECIMAL (OID 1700) as number
types.setTypeParser(1700, (val) => parseFloat(val));

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'beauty_salon',
      user: process.env.POSTGRES_USER || 'salon_user',
      password: process.env.POSTGRES_PASSWORD || 'salon_secret_2024',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Execute query and return all rows
 */
async function queryAll(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

/**
 * Execute query and return single row
 */
async function queryOne(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute INSERT/UPDATE/DELETE and return result
 */
async function execute(sql, params = []) {
  const result = await pool.query(sql, params);
  return result;
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('PostgreSQL connection error:', err.message);
    return false;
  }
}

/**
 * Run migrations from file
 */
async function runMigrations() {
  const fs = require('fs');
  const path = require('path');
  const migrationsDir = path.join(__dirname, '../../migrations');

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    try {
      await pool.query(sql);
      console.log(`Migration applied: ${file}`);
    } catch (err) {
      // Ignore "already exists" errors for idempotent migrations
      if (err.code !== '42P07' && err.code !== '42710') {
        console.error(`Migration error in ${file}:`, err.message);
      } else {
        console.log(`Migration already applied: ${file}`);
      }
    }
  }
}

module.exports = { pool, queryAll, queryOne, execute, testConnection, runMigrations };
