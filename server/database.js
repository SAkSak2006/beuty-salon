const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'salon.db');

let db = null;

// Save database to disk
function saveDb() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Auto-save every 5 seconds if there were changes
let dirty = false;
function markDirty() { dirty = true; }
setInterval(() => {
    if (dirty) { saveDb(); dirty = false; }
}, 5000);

// Save on process exit
process.on('exit', saveDb);
process.on('SIGINT', () => { saveDb(); process.exit(); });
process.on('SIGTERM', () => { saveDb(); process.exit(); });

async function initDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
        console.log('Database loaded from file');
    } else {
        db = new SQL.Database();
        console.log('New database created');
    }

    // Create all tables
    db.run(`
        CREATE TABLE IF NOT EXISTS service_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT DEFAULT '',
            color TEXT DEFAULT '#ec4899'
        );

        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            categoryId INTEGER,
            price REAL NOT NULL DEFAULT 0,
            duration INTEGER NOT NULL DEFAULT 60,
            description TEXT DEFAULT '',
            requiredMaterials TEXT DEFAULT '[]',
            isActive INTEGER DEFAULT 1,
            sortOrder INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            position TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            email TEXT DEFAULT '',
            specialization TEXT DEFAULT '[]',
            salary REAL DEFAULT 0,
            commission REAL DEFAULT 0,
            status TEXT DEFAULT 'working',
            skillLevel TEXT DEFAULT 'middle',
            photo TEXT DEFAULT '',
            hireDate TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT DEFAULT '',
            email TEXT DEFAULT '',
            birthdate TEXT DEFAULT '',
            registrationDate TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            totalVisits INTEGER DEFAULT 0,
            totalSpent REAL DEFAULT 0,
            discount REAL DEFAULT 0,
            lastVisit TEXT DEFAULT '',
            source TEXT DEFAULT '',
            telegramId TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientId INTEGER,
            employeeId INTEGER,
            serviceId INTEGER,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            duration INTEGER DEFAULT 60,
            status TEXT DEFAULT 'pending',
            notes TEXT DEFAULT '',
            createdAt TEXT DEFAULT '',
            updatedAt TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appointmentId INTEGER,
            amount REAL NOT NULL DEFAULT 0,
            method TEXT DEFAULT 'cash',
            date TEXT DEFAULT '',
            status TEXT DEFAULT 'completed',
            createdAt TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT DEFAULT '',
            quantity REAL DEFAULT 0,
            unit TEXT DEFAULT 'шт',
            minQuantity REAL DEFAULT 0,
            price REAL DEFAULT 0,
            supplier TEXT DEFAULT '',
            lastRestockDate TEXT DEFAULT '',
            sku TEXT DEFAULT '',
            categoryId INTEGER,
            currentStock REAL DEFAULT 0,
            minStock REAL DEFAULT 0,
            purchasePrice REAL DEFAULT 0,
            supplierId INTEGER,
            expiryDate TEXT DEFAULT '',
            barcode TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS inventory_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT DEFAULT '',
            color TEXT DEFAULT '#ec4899'
        );

        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT DEFAULT '',
            email TEXT DEFAULT '',
            deliveryDays INTEGER DEFAULT 3,
            contactPerson TEXT DEFAULT '',
            address TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId INTEGER,
            dayOfWeek INTEGER NOT NULL,
            startTime TEXT DEFAULT '09:00',
            endTime TEXT DEFAULT '18:00',
            isWorkingDay INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS competency_matrix (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId INTEGER,
            serviceId INTEGER,
            skillLevel TEXT DEFAULT 'middle',
            customDuration INTEGER DEFAULT 60,
            canPerform INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS vacations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId INTEGER,
            startDate TEXT NOT NULL,
            endDate TEXT NOT NULL,
            type TEXT DEFAULT 'vacation',
            reason TEXT DEFAULT '',
            createdAt TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            serviceId INTEGER,
            oldPrice REAL,
            newPrice REAL,
            changeDate TEXT DEFAULT '',
            reason TEXT DEFAULT '',
            changedBy TEXT DEFAULT 'admin'
        );

        CREATE TABLE IF NOT EXISTS inventory_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inventoryId INTEGER,
            type TEXT DEFAULT 'in',
            quantity REAL DEFAULT 0,
            date TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            itemId INTEGER,
            reason TEXT DEFAULT '',
            employeeId INTEGER,
            supplierId INTEGER,
            price REAL
        );

        CREATE TABLE IF NOT EXISTS purchase_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplierId INTEGER,
            status TEXT DEFAULT 'pending',
            totalAmount REAL DEFAULT 0,
            orderDate TEXT DEFAULT '',
            deliveryDate TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            date TEXT DEFAULT '',
            items TEXT DEFAULT '[]',
            createdBy INTEGER
        );

        CREATE TABLE IF NOT EXISTS service_materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            serviceId INTEGER,
            inventoryId INTEGER,
            quantity REAL DEFAULT 1,
            itemId INTEGER,
            unit TEXT DEFAULT ''
        );
    `);

    // Add missing columns if upgrading existing DB
    const addColumnIfMissing = (table, column, definition) => {
        try {
            db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        } catch { /* column already exists */ }
    };
    addColumnIfMissing('clients', 'source', "TEXT DEFAULT ''");
    addColumnIfMissing('clients', 'telegramId', "TEXT DEFAULT ''");
    addColumnIfMissing('suppliers', 'contactPerson', "TEXT DEFAULT ''");
    addColumnIfMissing('suppliers', 'address', "TEXT DEFAULT ''");

    saveDb();
    console.log('Database tables initialized');
    return db;
}

// Helper: execute query and return results as array of objects
function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

// Helper: execute query and return single row
function queryOne(sql, params = []) {
    const results = queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
}

// Helper: execute INSERT/UPDATE/DELETE
function execute(sql, params = []) {
    db.run(sql, params);
    markDirty();
    return { lastInsertRowid: queryOne('SELECT last_insert_rowid() as id').id, changes: db.getRowsModified() };
}

module.exports = { initDatabase, queryAll, queryOne, execute, saveDb };
