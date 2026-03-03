require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { testConnection, runMigrations } = require('./config/database');
const authenticate = require('./middleware/auth');
const requireRole = require('./middleware/roles');
const auditLog = require('./middleware/audit');
const { seedAdmin } = require('./seed');
const { getRedisClient } = require('./config/redis');
const { startBookingConsumer } = require('./consumers/booking-consumer');
const { startNotificationCron } = require('./services/notification-service');

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// Serve CRM frontend static files
app.use(express.static(path.join(__dirname, '../../crm-frontend')));

async function start() {
  // Test database connection
  const connected = await testConnection();
  if (!connected) {
    console.error('Cannot connect to PostgreSQL. Make sure docker-compose is running.');
    process.exit(1);
  }

  // Run migrations
  await runMigrations();

  // Seed admin user
  await seedAdmin();

  // ==============================
  // === PUBLIC ROUTES (no auth) ===
  // ==============================
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/booking', require('./routes/booking'));

  // =========================================
  // === PROTECTED ROUTES (require auth)   ===
  // =========================================
  app.use('/api', authenticate);

  // --- Доступно всем авторизованным (master/admin/owner) ---
  // master: read-only (writeRoles в crud-factory), admin/owner: full
  app.use('/api/service-categories', auditLog('service_category'), require('./routes/service-categories'));
  app.use('/api/services',           auditLog('service'),          require('./routes/services'));
  app.use('/api/clients',            auditLog('client'),           require('./routes/clients'));
  app.use('/api/appointments',       auditLog('appointment'),      require('./routes/appointments'));
  app.use('/api/schedule',           auditLog('schedule'),         require('./routes/schedule'));
  app.use('/api/competency-matrix',  auditLog('competency'),       require('./routes/competency-matrix'));
  app.use('/api/vacations',          auditLog('vacation'),         require('./routes/vacations'));

  // --- Только admin + owner ---
  app.use('/api/payments',                requireRole('admin', 'owner'), auditLog('payment'),              require('./routes/payments'));
  app.use('/api/reports',                 requireRole('admin', 'owner'), require('./routes/reports'));
  app.use('/api/inventory',               requireRole('admin', 'owner'), auditLog('inventory'),            require('./routes/inventory'));
  app.use('/api/price-history',           requireRole('admin', 'owner'), auditLog('price_history'),        require('./routes/price-history'));
  app.use('/api/suppliers',               requireRole('admin', 'owner'), auditLog('supplier'),             require('./routes/suppliers'));
  app.use('/api/inventory-categories',    requireRole('admin', 'owner'), auditLog('inventory_category'),   require('./routes/inventory-categories'));
  app.use('/api/inventory-transactions',  requireRole('admin', 'owner'), auditLog('inventory_transaction'),require('./routes/inventory-transactions'));
  app.use('/api/purchase-orders',         requireRole('admin', 'owner'), auditLog('purchase_order'),       require('./routes/purchase-orders'));
  app.use('/api/service-materials',       requireRole('admin', 'owner'), auditLog('service_material'),     require('./routes/service-materials'));

  // --- Employees: read — все авторизованные (нужно для записей), write — только owner (через writeRoles в crud-factory) ---
  app.use('/api/employees', auditLog('employee'), require('./routes/employees'));

  // Serve login.html for /login route
  app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../crm-frontend/login.html'));
  });

  // Serve index.html for all non-API routes (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../crm-frontend/index.html'));
  });

  // Initialize Redis (non-blocking, graceful fallback)
  getRedisClient().catch(() => console.log('Redis unavailable, using in-memory cache'));

  // Start RabbitMQ consumer (non-blocking)
  startBookingConsumer().catch(() => console.log('RabbitMQ unavailable, using direct booking'));

  // Start notification cron
  startNotificationCron();

  app.listen(PORT, () => {
    console.log(`Beauty Salon API server running at http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
