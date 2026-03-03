const express = require('express');
const { queryAll, queryOne } = require('../database');
const router = express.Router();

// Dashboard KPI data
router.get('/dashboard', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const revenueRow = queryOne(`
      SELECT COALESCE(SUM(amount), 0) as totalRevenue, COUNT(*) as paymentCount
      FROM payments WHERE status = 'completed' AND date >= ? AND date <= ?
    `, [startDate, today]) || { totalRevenue: 0, paymentCount: 0 };

    const clientCount = (queryOne('SELECT COUNT(*) as count FROM clients') || { count: 0 }).count;
    const newClients = (queryOne('SELECT COUNT(*) as count FROM clients WHERE registrationDate >= ?', [startDate]) || { count: 0 }).count;
    const todayAppointments = (queryOne(`SELECT COUNT(*) as count FROM appointments WHERE date = ? AND (status = 'confirmed' OR status = 'pending')`, [today]) || { count: 0 }).count;
    const completedCount = (queryOne(`SELECT COUNT(*) as count FROM appointments WHERE status = 'completed' AND date >= ? AND date <= ?`, [startDate, today]) || { count: 0 }).count;

    const avgCheck = completedCount > 0 ? Math.round(revenueRow.totalRevenue / completedCount) : 0;
    const employees = (queryOne("SELECT COUNT(*) as count FROM employees WHERE status = 'working'") || { count: 0 }).count;
    const todayBooked = (queryOne(`SELECT COALESCE(SUM(duration), 0) as totalMinutes FROM appointments WHERE date = ? AND (status = 'confirmed' OR status = 'pending')`, [today]) || { totalMinutes: 0 }).totalMinutes;
    const loadPercent = employees > 0 ? Math.min(100, Math.round((todayBooked / (employees * 540)) * 100)) : 0;

    res.json({ totalRevenue: revenueRow.totalRevenue, clientCount, newClients, todayAppointments, avgCheck, loadPercent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revenue by period
router.get('/revenue', (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    let groupExpr;
    if (groupBy === 'month') groupExpr = "substr(date, 1, 7)";
    else if (groupBy === 'week') groupExpr = "date";
    else groupExpr = 'date';

    const rows = queryAll(`
      SELECT ${groupExpr} as date, SUM(amount) as revenue, COUNT(*) as count
      FROM payments WHERE status = 'completed' AND date >= ? AND date <= ?
      GROUP BY ${groupExpr} ORDER BY date
    `, [startDate, endDate]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Client metrics
router.get('/client-metrics', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const totalClients = (queryOne('SELECT COUNT(*) as count FROM clients') || { count: 0 }).count;
    const newClients = (queryOne('SELECT COUNT(*) as count FROM clients WHERE registrationDate >= ? AND registrationDate <= ?', [startDate, endDate]) || { count: 0 }).count;

    const activeClientRows = queryAll(`SELECT DISTINCT clientId FROM appointments WHERE status = 'completed' AND date >= ? AND date <= ?`, [startDate, endDate]);
    const activeClients = activeClientRows.length;

    const repeatClients = activeClientRows.filter(row => {
      const count = (queryOne("SELECT COUNT(*) as count FROM appointments WHERE clientId = ? AND status = 'completed'", [row.clientId]) || { count: 0 }).count;
      return count > 1;
    }).length;

    const totalRevenue = (queryOne(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND date >= ? AND date <= ?`, [startDate, endDate]) || { total: 0 }).total;
    const avgCheck = activeClients > 0 ? Math.round(totalRevenue / activeClients) : 0;

    const allClientsSpent = queryOne('SELECT COALESCE(SUM(totalSpent), 0) as total, COUNT(*) as count FROM clients') || { total: 0, count: 0 };
    const avgLTV = allClientsSpent.count > 0 ? Math.round(allClientsSpent.total / allClientsSpent.count) : 0;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

    const activeTotal = (queryOne("SELECT COUNT(*) as count FROM clients WHERE totalVisits > 0") || { count: 0 }).count;
    const churned = (queryOne("SELECT COUNT(*) as count FROM clients WHERE totalVisits > 0 AND lastVisit != '' AND lastVisit < ?", [ninetyDaysAgoStr]) || { count: 0 }).count;
    const churnRate = activeTotal > 0 ? Math.round((churned / activeTotal) * 100) : 0;

    res.json({ totalClients, newClients, activeClients, repeatClients, repeatRate: activeClients > 0 ? Math.round((repeatClients / activeClients) * 100) : 0, avgCheck, avgLTV, churnRate, totalRevenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Employee efficiency
router.get('/employee-efficiency', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const employees = queryAll('SELECT * FROM employees');
    const efficiency = employees.map(employee => {
      const appointments = queryAll(`SELECT * FROM appointments WHERE employeeId = ? AND status = 'completed' AND date >= ? AND date <= ?`, [employee.id, startDate, endDate]);
      let revenue = 0;
      appointments.forEach(apt => {
        const payment = queryOne("SELECT amount FROM payments WHERE appointmentId = ? AND status = 'completed'", [apt.id]);
        if (payment) revenue += payment.amount;
      });

      const totalMinutes = appointments.reduce((sum, a) => sum + a.duration, 0);
      const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

      return {
        employeeId: employee.id, employeeName: employee.name, position: employee.position,
        appointmentsCount: appointments.length, revenue, totalHours,
        revenuePerHour: totalHours > 0 ? Math.round(revenue / totalHours) : 0,
        avgCheck: appointments.length > 0 ? Math.round(revenue / appointments.length) : 0
      };
    }).filter(e => e.appointmentsCount > 0);

    res.json(efficiency.sort((a, b) => b.revenue - a.revenue));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top services
router.get('/top-services', (req, res) => {
  try {
    const { limit = 5, startDate, endDate } = req.query;
    let sql = `SELECT s.id, s.name, COUNT(a.id) as count, COUNT(a.id) * s.price as revenue FROM services s JOIN appointments a ON a.serviceId = s.id AND a.status = 'completed'`;
    const params = [];
    if (startDate && endDate) {
      sql += ' WHERE a.date >= ? AND a.date <= ?';
      params.push(startDate, endDate);
    }
    sql += ' GROUP BY s.id ORDER BY revenue DESC LIMIT ?';
    params.push(Number(limit));

    res.json(queryAll(sql, params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Today employee load
router.get('/today-load', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const employees = queryAll("SELECT * FROM employees WHERE status = 'working'");

    const load = employees.map(emp => {
      const appointments = queryAll(`SELECT * FROM appointments WHERE employeeId = ? AND date = ? AND (status = 'confirmed' OR status = 'pending')`, [emp.id, today]);
      const totalMinutes = appointments.reduce((sum, a) => sum + a.duration, 0);
      return {
        employeeId: emp.id, employeeName: emp.name,
        appointmentsCount: appointments.length, totalMinutes,
        loadPercentage: Math.min(100, Math.round((totalMinutes / 540) * 100))
      };
    }).sort((a, b) => b.loadPercentage - a.loadPercentage);

    res.json(load);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upcoming appointments
router.get('/upcoming-appointments', (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);

    const rows = queryAll(`
      SELECT a.*, c.name as clientName, e.name as employeeName, s.name as serviceName, s.price
      FROM appointments a
      LEFT JOIN clients c ON c.id = a.clientId
      LEFT JOIN employees e ON e.id = a.employeeId
      LEFT JOIN services s ON s.id = a.serviceId
      WHERE (a.date > ? OR (a.date = ? AND a.time >= ?))
        AND (a.status = 'confirmed' OR a.status = 'pending')
      ORDER BY a.date, a.time LIMIT ?
    `, [today, today, currentTime, Number(limit)]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Birthdays this week
router.get('/birthdays', (req, res) => {
  try {
    const clients = queryAll("SELECT * FROM clients WHERE birthdate != '' AND birthdate IS NOT NULL");
    const today = new Date();

    const birthdays = clients.filter(client => {
      const birthdate = new Date(client.birthdate);
      const birthdayThisYear = new Date(today.getFullYear(), birthdate.getMonth(), birthdate.getDate());
      const daysUntil = Math.ceil((birthdayThisYear - today) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    }).map(client => {
      const birthdate = new Date(client.birthdate);
      const birthdayThisYear = new Date(today.getFullYear(), birthdate.getMonth(), birthdate.getDate());
      return { ...client, daysUntilBirthday: Math.ceil((birthdayThisYear - today) / (1000 * 60 * 60 * 24)), age: today.getFullYear() - birthdate.getFullYear() };
    }).sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

    res.json(birthdays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
