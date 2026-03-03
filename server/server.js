const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, saveDb } = require('./database');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the parent directory (frontend)
app.use(express.static(path.join(__dirname, '..')));

async function start() {
    // Initialize database first
    await initDatabase();

    // Auth routes
    app.use('/api/auth', require('./routes/auth'));

    // Reset endpoint (drops and recreates all data)
    app.post('/api/reset', async (req, res) => {
      try {
        const fs = require('fs');
        const dbPath = require('path').join(__dirname, 'salon.db');
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        await initDatabase();
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // API Routes
    app.use('/api/service-categories', require('./routes/service-categories'));
    app.use('/api/services', require('./routes/services'));
    app.use('/api/employees', require('./routes/employees'));
    app.use('/api/clients', require('./routes/clients'));
    app.use('/api/appointments', require('./routes/appointments'));
    app.use('/api/payments', require('./routes/payments'));
    app.use('/api/inventory', require('./routes/inventory'));
    app.use('/api/schedule', require('./routes/schedule'));
    app.use('/api/reports', require('./routes/reports'));
    app.use('/api/competency-matrix', require('./routes/competency-matrix'));
    app.use('/api/vacations', require('./routes/vacations'));
    app.use('/api/price-history', require('./routes/price-history'));
    app.use('/api/suppliers', require('./routes/suppliers'));
    app.use('/api/inventory-categories', require('./routes/inventory-categories'));
    app.use('/api/inventory-transactions', require('./routes/inventory-transactions'));
    app.use('/api/purchase-orders', require('./routes/purchase-orders'));
    app.use('/api/service-materials', require('./routes/service-materials'));

    // Serve index.html for all non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    });

    app.listen(PORT, () => {
        console.log(`Beauty Salon server running at http://localhost:${PORT}`);
    });
}

start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
