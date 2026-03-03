const express = require('express');
const { queryAll, queryOne } = require('../config/database');
const router = express.Router();

// Dashboard KPI data
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const revenueRow = await queryOne(`
      SELECT COALESCE(SUM(amount), 0) as "totalRevenue", COUNT(*) as "paymentCount"
      FROM payments WHERE status = 'completed' AND date >= $1 AND date <= $2
    `, [startDate, today]) || { totalRevenue: 0, paymentCount: 0 };

    const clientCount = ((await queryOne('SELECT COUNT(*) as count FROM clients')) || { count: 0 }).count;
    const newClients = ((await queryOne('SELECT COUNT(*) as count FROM clients WHERE "registrationDate" >= $1', [startDate])) || { count: 0 }).count;
    const todayAppointments = ((await queryOne(`SELECT COUNT(*) as count FROM appointments WHERE date = $1 AND (status = 'confirmed' OR status = 'pending')`, [today])) || { count: 0 }).count;
    const completedCount = ((await queryOne(`SELECT COUNT(*) as count FROM appointments WHERE status = 'completed' AND date >= $1 AND date <= $2`, [startDate, today])) || { count: 0 }).count;

    const avgCheck = completedCount > 0 ? Math.round(parseFloat(revenueRow.totalRevenue) / parseInt(completedCount)) : 0;
    const employees = ((await queryOne("SELECT COUNT(*) as count FROM employees WHERE status = 'working'")) || { count: 0 }).count;
    const todayBooked = ((await queryOne(`SELECT COALESCE(SUM(duration), 0) as "totalMinutes" FROM appointments WHERE date = $1 AND (status = 'confirmed' OR status = 'pending')`, [today])) || { totalMinutes: 0 }).totalMinutes;
    const loadPercent = parseInt(employees) > 0 ? Math.min(100, Math.round((parseInt(todayBooked) / (parseInt(employees) * 540)) * 100)) : 0;

    res.json({
      totalRevenue: parseFloat(revenueRow.totalRevenue),
      clientCount: parseInt(clientCount),
      newClients: parseInt(newClients),
      todayAppointments: parseInt(todayAppointments),
      avgCheck,
      loadPercent
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Revenue by period
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    let groupExpr;
    if (groupBy === 'month') groupExpr = "TO_CHAR(date, 'YYYY-MM')";
    else if (groupBy === 'week') groupExpr = "TO_CHAR(date, 'YYYY-MM-DD')";
    else groupExpr = "TO_CHAR(date, 'YYYY-MM-DD')";

    const rows = await queryAll(`
      SELECT ${groupExpr} as date, SUM(amount) as revenue, COUNT(*) as count
      FROM payments WHERE status = 'completed' AND date >= $1 AND date <= $2
      GROUP BY ${groupExpr} ORDER BY date
    `, [startDate, endDate]);

    res.json(rows.map(r => ({ ...r, revenue: parseFloat(r.revenue), count: parseInt(r.count) })));
  } catch (err) {
    console.error('Revenue error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Client metrics
router.get('/client-metrics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const totalClients = parseInt(((await queryOne('SELECT COUNT(*) as count FROM clients')) || { count: 0 }).count);
    const newClients = parseInt(((await queryOne('SELECT COUNT(*) as count FROM clients WHERE "registrationDate" >= $1 AND "registrationDate" <= $2', [startDate, endDate])) || { count: 0 }).count);

    const activeClientRows = await queryAll(`SELECT DISTINCT "clientId" FROM appointments WHERE status = 'completed' AND date >= $1 AND date <= $2`, [startDate, endDate]);
    const activeClients = activeClientRows.length;

    let repeatClients = 0;
    for (const row of activeClientRows) {
      const countRow = await queryOne("SELECT COUNT(*) as count FROM appointments WHERE \"clientId\" = $1 AND status = 'completed'", [row.clientId]);
      if (countRow && parseInt(countRow.count) > 1) repeatClients++;
    }

    const totalRevenue = parseFloat(((await queryOne(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND date >= $1 AND date <= $2`, [startDate, endDate])) || { total: 0 }).total);
    const avgCheck = activeClients > 0 ? Math.round(totalRevenue / activeClients) : 0;

    const allClientsSpent = (await queryOne('SELECT COALESCE(SUM("totalSpent"), 0) as total, COUNT(*) as count FROM clients')) || { total: 0, count: 0 };
    const avgLTV = parseInt(allClientsSpent.count) > 0 ? Math.round(parseFloat(allClientsSpent.total) / parseInt(allClientsSpent.count)) : 0;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

    const activeTotal = parseInt(((await queryOne('SELECT COUNT(*) as count FROM clients WHERE "totalVisits" > 0')) || { count: 0 }).count);
    const churned = parseInt(((await queryOne('SELECT COUNT(*) as count FROM clients WHERE "totalVisits" > 0 AND "lastVisit" IS NOT NULL AND "lastVisit" < $1', [ninetyDaysAgoStr])) || { count: 0 }).count);
    const churnRate = activeTotal > 0 ? Math.round((churned / activeTotal) * 100) : 0;

    res.json({
      totalClients, newClients, activeClients, repeatClients,
      repeatRate: activeClients > 0 ? Math.round((repeatClients / activeClients) * 100) : 0,
      avgCheck, avgLTV, churnRate, totalRevenue
    });
  } catch (err) {
    console.error('Client metrics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Employee efficiency
router.get('/employee-efficiency', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const employees = await queryAll('SELECT * FROM employees');
    const efficiency = [];

    for (const employee of employees) {
      const appointments = await queryAll(
        `SELECT * FROM appointments WHERE "employeeId" = $1 AND status = 'completed' AND date >= $2 AND date <= $3`,
        [employee.id, startDate, endDate]
      );

      let revenue = 0;
      for (const apt of appointments) {
        const payment = await queryOne("SELECT amount FROM payments WHERE \"appointmentId\" = $1 AND status = 'completed'", [apt.id]);
        if (payment) revenue += parseFloat(payment.amount);
      }

      const totalMinutes = appointments.reduce((sum, a) => sum + a.duration, 0);
      const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

      if (appointments.length > 0) {
        efficiency.push({
          employeeId: employee.id, employeeName: employee.name, position: employee.position,
          appointmentsCount: appointments.length, revenue, totalHours,
          revenuePerHour: totalHours > 0 ? Math.round(revenue / totalHours) : 0,
          avgCheck: appointments.length > 0 ? Math.round(revenue / appointments.length) : 0
        });
      }
    }

    res.json(efficiency.sort((a, b) => b.revenue - a.revenue));
  } catch (err) {
    console.error('Employee efficiency error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Top services
router.get('/top-services', async (req, res) => {
  try {
    const { limit = 5, startDate, endDate } = req.query;
    let sql = `SELECT s.id, s.name, COUNT(a.id) as count, COUNT(a.id) * s.price as revenue
      FROM services s JOIN appointments a ON a."serviceId" = s.id AND a.status = 'completed'`;
    const params = [];
    let paramIdx = 1;

    if (startDate && endDate) {
      sql += ` WHERE a.date >= $${paramIdx++} AND a.date <= $${paramIdx++}`;
      params.push(startDate, endDate);
    }
    sql += ` GROUP BY s.id ORDER BY revenue DESC LIMIT $${paramIdx}`;
    params.push(Number(limit));

    const rows = await queryAll(sql, params);
    res.json(rows.map(r => ({ ...r, count: parseInt(r.count), revenue: parseFloat(r.revenue) })));
  } catch (err) {
    console.error('Top services error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Today employee load
router.get('/today-load', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const employees = await queryAll("SELECT * FROM employees WHERE status = 'working'");

    const load = [];
    for (const emp of employees) {
      const appointments = await queryAll(
        `SELECT * FROM appointments WHERE "employeeId" = $1 AND date = $2 AND (status = 'confirmed' OR status = 'pending')`,
        [emp.id, today]
      );
      const totalMinutes = appointments.reduce((sum, a) => sum + a.duration, 0);
      load.push({
        employeeId: emp.id, employeeName: emp.name,
        appointmentsCount: appointments.length, totalMinutes,
        loadPercentage: Math.min(100, Math.round((totalMinutes / 540) * 100))
      });
    }

    res.json(load.sort((a, b) => b.loadPercentage - a.loadPercentage));
  } catch (err) {
    console.error('Today load error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upcoming appointments
router.get('/upcoming-appointments', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);

    const rows = await queryAll(`
      SELECT a.*, c.name as "clientName", e.name as "employeeName", s.name as "serviceName", s.price
      FROM appointments a
      LEFT JOIN clients c ON c.id = a."clientId"
      LEFT JOIN employees e ON e.id = a."employeeId"
      LEFT JOIN services s ON s.id = a."serviceId"
      WHERE (a.date > $1 OR (a.date = $2 AND a.time >= $3))
        AND (a.status = 'confirmed' OR a.status = 'pending')
      ORDER BY a.date, a.time LIMIT $4
    `, [today, today, currentTime, Number(limit)]);

    res.json(rows.map(r => ({ ...r, price: r.price ? parseFloat(r.price) : 0 })));
  } catch (err) {
    console.error('Upcoming appointments error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Birthdays this week
router.get('/birthdays', async (req, res) => {
  try {
    const clients = await queryAll("SELECT * FROM clients WHERE birthdate IS NOT NULL");
    const today = new Date();

    const birthdays = clients.filter(client => {
      const birthdate = new Date(client.birthdate);
      const birthdayThisYear = new Date(today.getFullYear(), birthdate.getMonth(), birthdate.getDate());
      const daysUntil = Math.ceil((birthdayThisYear - today) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    }).map(client => {
      const birthdate = new Date(client.birthdate);
      const birthdayThisYear = new Date(today.getFullYear(), birthdate.getMonth(), birthdate.getDate());
      return {
        ...client,
        totalSpent: parseFloat(client.totalSpent),
        discount: parseFloat(client.discount),
        daysUntilBirthday: Math.ceil((birthdayThisYear - today) / (1000 * 60 * 60 * 24)),
        age: today.getFullYear() - birthdate.getFullYear()
      };
    }).sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

    res.json(birthdays);
  } catch (err) {
    console.error('Birthdays error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
