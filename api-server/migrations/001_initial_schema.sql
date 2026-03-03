-- 001_initial_schema.sql
-- Миграция схемы из SQLite в PostgreSQL

-- Категории услуг
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT '',
    color VARCHAR(20) DEFAULT '#ec4899'
);

-- Услуги
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "categoryId" INTEGER REFERENCES service_categories(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 60,
    description TEXT DEFAULT '',
    "requiredMaterials" JSONB DEFAULT '[]'::jsonb,
    "isActive" BOOLEAN DEFAULT true,
    "sortOrder" INTEGER DEFAULT 0
);

-- Сотрудники
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(100) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    specialization JSONB DEFAULT '[]'::jsonb,
    salary DECIMAL(10, 2) DEFAULT 0,
    commission DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'working',
    "skillLevel" VARCHAR(20) DEFAULT 'middle',
    photo TEXT DEFAULT '',
    "hireDate" DATE DEFAULT NULL
);

-- Клиенты
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    birthdate DATE DEFAULT NULL,
    "registrationDate" DATE DEFAULT NULL,
    notes TEXT DEFAULT '',
    "totalVisits" INTEGER DEFAULT 0,
    "totalSpent" DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(5, 2) DEFAULT 0,
    "lastVisit" DATE DEFAULT NULL
);

-- Записи на приём
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    "clientId" INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    "employeeId" INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    "serviceId" INTEGER REFERENCES services(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    duration INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT DEFAULT '',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_date_employee ON appointments(date, "employeeId");
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments("clientId");
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- Платежи
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    "appointmentId" INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    method VARCHAR(30) DEFAULT 'cash',
    date DATE DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Складские позиции
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    quantity DECIMAL(10, 2) DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'шт',
    "minQuantity" DECIMAL(10, 2) DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0,
    supplier VARCHAR(255) DEFAULT '',
    "lastRestockDate" DATE DEFAULT NULL,
    sku VARCHAR(50) DEFAULT '',
    "categoryId" INTEGER,
    "currentStock" DECIMAL(10, 2) DEFAULT 0,
    "minStock" DECIMAL(10, 2) DEFAULT 0,
    "purchasePrice" DECIMAL(10, 2) DEFAULT 0,
    "supplierId" INTEGER,
    "expiryDate" DATE DEFAULT NULL,
    barcode VARCHAR(100) DEFAULT ''
);

-- Категории склада
CREATE TABLE IF NOT EXISTS inventory_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT '',
    color VARCHAR(20) DEFAULT '#ec4899'
);

-- Поставщики
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    "deliveryDays" INTEGER DEFAULT 3
);

-- Расписание сотрудников
CREATE TABLE IF NOT EXISTS schedule (
    id SERIAL PRIMARY KEY,
    "employeeId" INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" VARCHAR(10) DEFAULT '09:00',
    "endTime" VARCHAR(10) DEFAULT '18:00',
    "isWorkingDay" BOOLEAN DEFAULT true
);

-- Матрица компетенций
CREATE TABLE IF NOT EXISTS competency_matrix (
    id SERIAL PRIMARY KEY,
    "employeeId" INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    "serviceId" INTEGER REFERENCES services(id) ON DELETE CASCADE,
    "skillLevel" VARCHAR(20) DEFAULT 'middle',
    "customDuration" INTEGER DEFAULT 60,
    "canPerform" BOOLEAN DEFAULT true
);

-- Отпуска
CREATE TABLE IF NOT EXISTS vacations (
    id SERIAL PRIMARY KEY,
    "employeeId" INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    type VARCHAR(30) DEFAULT 'vacation',
    reason TEXT DEFAULT '',
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- История цен
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    "serviceId" INTEGER REFERENCES services(id) ON DELETE CASCADE,
    "oldPrice" DECIMAL(10, 2),
    "newPrice" DECIMAL(10, 2),
    "changeDate" DATE DEFAULT NULL,
    reason TEXT DEFAULT '',
    "changedBy" VARCHAR(100) DEFAULT 'admin'
);

-- Транзакции склада
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    "inventoryId" INTEGER,
    type VARCHAR(20) DEFAULT 'in',
    quantity DECIMAL(10, 2) DEFAULT 0,
    date DATE DEFAULT NULL,
    notes TEXT DEFAULT '',
    "itemId" INTEGER,
    reason TEXT DEFAULT '',
    "employeeId" INTEGER,
    "supplierId" INTEGER,
    price DECIMAL(10, 2)
);

-- Заказы поставщикам
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    "supplierId" INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    "totalAmount" DECIMAL(10, 2) DEFAULT 0,
    "orderDate" DATE DEFAULT NULL,
    "deliveryDate" DATE DEFAULT NULL,
    notes TEXT DEFAULT '',
    date DATE DEFAULT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    "createdBy" INTEGER
);

-- Материалы услуг
CREATE TABLE IF NOT EXISTS service_materials (
    id SERIAL PRIMARY KEY,
    "serviceId" INTEGER REFERENCES services(id) ON DELETE CASCADE,
    "inventoryId" INTEGER,
    quantity DECIMAL(10, 2) DEFAULT 1,
    "itemId" INTEGER,
    unit VARCHAR(20) DEFAULT ''
);
