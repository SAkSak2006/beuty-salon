const express = require('express');
const { pool, queryAll, queryOne, execute } = require('../config/database');
const CacheService = require('../services/cache-service');
const { publishToQueue } = require('../config/rabbitmq');
const router = express.Router();

// GET /booking/services — услуги с категориями (cached 5 min)
router.get('/services', async (req, res) => {
  try {
    // Check cache first
    const cached = await CacheService.get('services:all');
    if (cached) return res.json(cached);

    const categories = await queryAll('SELECT * FROM service_categories ORDER BY name');
    const services = await queryAll('SELECT * FROM services WHERE "isActive" = true ORDER BY "sortOrder", name');

    const result = categories.map(cat => ({
      ...cat,
      services: services.filter(s => s.categoryId === cat.id).map(s => ({
        id: s.id,
        name: s.name,
        price: parseFloat(s.price),
        duration: s.duration,
        description: s.description
      }))
    })).filter(cat => cat.services.length > 0);

    // Cache for 5 minutes
    await CacheService.set('services:all', result, 300);

    res.json(result);
  } catch (err) {
    console.error('Booking services error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /booking/masters?serviceId=X — мастера для услуги (cached 5 min)
router.get('/masters', async (req, res) => {
  try {
    const { serviceId } = req.query;
    if (!serviceId) return res.status(400).json({ error: 'serviceId required' });

    // Check cache
    const cacheKey = `masters:${serviceId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const masters = await queryAll(`
      SELECT e.id, e.name, e.position, e.photo, cm."skillLevel", cm."customDuration"
      FROM employees e
      JOIN competency_matrix cm ON cm."employeeId" = e.id
      WHERE cm."serviceId" = $1 AND cm."canPerform" = true AND e.status = 'working'
      ORDER BY e.name
    `, [serviceId]);

    // Cache for 5 minutes
    await CacheService.set(cacheKey, masters, 300);

    res.json(masters);
  } catch (err) {
    console.error('Booking masters error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /booking/slots?employeeId=X&date=Y&serviceId=Z — свободные слоты (cached 2 min)
router.get('/slots', async (req, res) => {
  try {
    const { employeeId, date, serviceId } = req.query;
    if (!employeeId || !date || !serviceId) {
      return res.status(400).json({ error: 'employeeId, date, serviceId required' });
    }

    // Check cache
    const cacheKey = `slots:${employeeId}:${date}:${serviceId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json(cached);

    // Get service duration (or custom from competency)
    const competency = await queryOne(
      'SELECT "customDuration" FROM competency_matrix WHERE "employeeId" = $1 AND "serviceId" = $2',
      [employeeId, serviceId]
    );
    const service = await queryOne('SELECT duration FROM services WHERE id = $1', [serviceId]);
    const duration = (competency && competency.customDuration) || (service && service.duration) || 60;

    // Get employee schedule for this day of week
    const dayOfWeek = new Date(date).getDay(); // 0=Sun
    const schedule = await queryOne(
      'SELECT * FROM schedule WHERE "employeeId" = $1 AND "dayOfWeek" = $2',
      [employeeId, dayOfWeek]
    );

    if (!schedule || !schedule.isWorkingDay) {
      return res.json([]);
    }

    // Check vacation
    const vacation = await queryOne(
      'SELECT id FROM vacations WHERE "employeeId" = $1 AND "startDate" <= $2 AND "endDate" >= $2',
      [employeeId, date]
    );
    if (vacation) {
      return res.json([]);
    }

    // Get existing appointments for this day
    const appointments = await queryAll(
      `SELECT time, duration FROM appointments
       WHERE "employeeId" = $1 AND date = $2 AND status != 'cancelled'
       ORDER BY time`,
      [employeeId, date]
    );

    // Generate available slots (every 30 minutes)
    const slots = [];
    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);

    for (let m = startMinutes; m + duration <= endMinutes; m += 30) {
      const slotStart = m;
      const slotEnd = m + duration;

      // Check if slot conflicts with any existing appointment
      const hasConflict = appointments.some(apt => {
        const aptStart = timeToMinutes(apt.time);
        const aptEnd = aptStart + apt.duration;
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      if (!hasConflict) {
        slots.push(minutesToTime(m));
      }
    }

    // Cache for 2 minutes
    await CacheService.set(cacheKey, slots, 120);

    res.json(slots);
  } catch (err) {
    console.error('Booking slots error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /booking/create — создание записи
// Если RabbitMQ доступен — через очередь, иначе — прямое создание с SELECT...FOR UPDATE
router.post('/create', async (req, res) => {
  try {
    const { serviceId, employeeId, date, time, clientName, clientPhone, telegramId } = req.body;

    if (!serviceId || !employeeId || !date || !time) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    // Get service info
    const service = await queryOne('SELECT * FROM services WHERE id = $1', [serviceId]);
    if (!service) return res.status(404).json({ error: 'Услуга не найдена' });

    // Get or create client
    let client = null;
    if (telegramId) {
      const tgUser = await queryOne('SELECT client_id FROM telegram_users WHERE telegram_id = $1', [telegramId]);
      if (tgUser && tgUser.client_id) {
        client = await queryOne('SELECT * FROM clients WHERE id = $1', [tgUser.client_id]);
      }
    }

    if (!client && clientPhone) {
      client = await queryOne('SELECT * FROM clients WHERE phone = $1', [clientPhone]);
    }

    if (!client) {
      const result = await execute(
        'INSERT INTO clients (name, phone, "registrationDate") VALUES ($1, $2, $3) RETURNING id',
        [clientName || 'Клиент Telegram', clientPhone || '', new Date().toISOString().split('T')[0]]
      );
      client = { id: result.rows[0].id };

      // Link to telegram user
      if (telegramId) {
        await execute(
          'UPDATE telegram_users SET client_id = $1 WHERE telegram_id = $2',
          [client.id, telegramId]
        ).catch(() => {});
      }
    }

    // Get duration
    const competency = await queryOne(
      'SELECT "customDuration" FROM competency_matrix WHERE "employeeId" = $1 AND "serviceId" = $2',
      [employeeId, serviceId]
    );
    const duration = (competency && competency.customDuration) || service.duration || 60;

    // Try RabbitMQ path first
    const published = await publishToQueue('booking_requests', {
      clientId: client.id,
      employeeId,
      serviceId,
      serviceName: service.name,
      date,
      time,
      duration,
      telegramId: telegramId || null
    });

    if (published) {
      // RabbitMQ accepted — consumer will process with FOR UPDATE
      return res.status(202).json({
        message: 'Запись обрабатывается',
        status: 'processing',
        service: service.name,
        date,
        time,
        duration
      });
    }

    // Fallback: direct creation with transaction + SELECT...FOR UPDATE
    const dbClient = await pool.connect();
    try {
      await dbClient.query('BEGIN');

      // Lock employee's appointments for this date
      await dbClient.query(
        `SELECT id FROM appointments
         WHERE "employeeId" = $1 AND date = $2 AND status != 'cancelled'
         FOR UPDATE`,
        [employeeId, date]
      );

      // Check for time conflict
      const existingAppts = await dbClient.query(
        `SELECT time, duration FROM appointments
         WHERE "employeeId" = $1 AND date = $2 AND status != 'cancelled'`,
        [employeeId, date]
      );

      const requestStart = timeToMinutes(time);
      const requestEnd = requestStart + duration;

      const hasConflict = existingAppts.rows.some(apt => {
        const aptStart = timeToMinutes(apt.time);
        const aptEnd = aptStart + apt.duration;
        return requestStart < aptEnd && requestEnd > aptStart;
      });

      if (hasConflict) {
        await dbClient.query('ROLLBACK');
        return res.status(409).json({ error: 'Это время уже занято' });
      }

      // Create appointment
      const result = await dbClient.query(
        `INSERT INTO appointments ("clientId", "employeeId", "serviceId", date, time, duration, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', NOW(), NOW()) RETURNING id`,
        [client.id, employeeId, serviceId, date, time, duration]
      );

      await dbClient.query('COMMIT');

      const appointmentId = result.rows[0].id;

      // Invalidate slots cache
      await CacheService.invalidate(`slots:${employeeId}:*`);

      res.status(201).json({
        id: appointmentId,
        message: 'Запись создана',
        service: service.name,
        date,
        time,
        duration
      });
    } catch (err) {
      await dbClient.query('ROLLBACK');
      throw err;
    } finally {
      dbClient.release();
    }
  } catch (err) {
    console.error('Booking create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /booking/my?telegramId=X — записи клиента
router.get('/my', async (req, res) => {
  try {
    const { telegramId } = req.query;
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const tgUser = await queryOne('SELECT client_id FROM telegram_users WHERE telegram_id = $1', [telegramId]);
    if (!tgUser || !tgUser.client_id) return res.json([]);

    const appointments = await queryAll(`
      SELECT a.*, s.name as "serviceName", s.price, e.name as "employeeName"
      FROM appointments a
      LEFT JOIN services s ON s.id = a."serviceId"
      LEFT JOIN employees e ON e.id = a."employeeId"
      WHERE a."clientId" = $1 AND a.date >= CURRENT_DATE AND a.status != 'cancelled'
      ORDER BY a.date, a.time
    `, [tgUser.client_id]);

    res.json(appointments.map(a => ({ ...a, price: a.price ? parseFloat(a.price) : 0 })));
  } catch (err) {
    console.error('Booking my error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /booking/:id?telegramId=X — отмена записи (только своей)
router.delete('/:id', async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { telegramId } = req.query;

    // Verify appointment belongs to this Telegram user
    if (telegramId) {
      const tgUser = await queryOne('SELECT client_id FROM telegram_users WHERE telegram_id = $1', [telegramId]);
      if (tgUser && tgUser.client_id) {
        const appointment = await queryOne(
          'SELECT id FROM appointments WHERE id = $1 AND "clientId" = $2',
          [appointmentId, tgUser.client_id]
        );
        if (!appointment) {
          return res.status(403).json({ error: 'Вы можете отменить только свои записи' });
        }
      }
    }

    // Get appointment info before cancelling (for cache invalidation)
    const aptInfo = await queryOne(
      'SELECT "employeeId" FROM appointments WHERE id = $1',
      [appointmentId]
    );

    const result = await execute(
      `UPDATE appointments SET status = 'cancelled', "updatedAt" = NOW() WHERE id = $1 AND status != 'cancelled'`,
      [appointmentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Запись не найдена или уже отменена' });
    }

    // Invalidate slots cache for this employee
    if (aptInfo && aptInfo.employeeId) {
      await CacheService.invalidate(`slots:${aptInfo.employeeId}:*`);
    }

    res.json({ success: true, message: 'Запись отменена' });
  } catch (err) {
    console.error('Booking cancel error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /booking/telegram-user — save/update telegram user
router.post('/telegram-user', async (req, res) => {
  try {
    const { telegramId, firstName, lastName, username, phone } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const existing = await queryOne('SELECT id, client_id FROM telegram_users WHERE telegram_id = $1', [telegramId]);
    if (existing) {
      if (phone) {
        await execute(
          'UPDATE telegram_users SET first_name = $1, last_name = $2, username = $3, phone = $4 WHERE telegram_id = $5',
          [firstName, lastName, username, phone, telegramId]
        );
        // Link to existing client by phone, or create new client
        if (!existing.client_id) {
          let client = await queryOne('SELECT id FROM clients WHERE phone = $1', [phone]);
          if (!client) {
            const result = await execute(
              'INSERT INTO clients (name, phone, "registrationDate") VALUES ($1, $2, $3) RETURNING id',
              [`${firstName} ${lastName || ''}`.trim(), phone, new Date().toISOString().split('T')[0]]
            );
            client = { id: result.rows[0].id };
          }
          await execute('UPDATE telegram_users SET client_id = $1 WHERE telegram_id = $2', [client.id, telegramId]);
        }
      } else {
        await execute(
          'UPDATE telegram_users SET first_name = $1, last_name = $2, username = $3 WHERE telegram_id = $4',
          [firstName, lastName, username, telegramId]
        );
      }
    } else {
      await execute(
        'INSERT INTO telegram_users (telegram_id, first_name, last_name, username, phone) VALUES ($1, $2, $3, $4, $5)',
        [telegramId, firstName, lastName, username, phone || null]
      );
      // If phone provided, link to client
      if (phone) {
        let client = await queryOne('SELECT id FROM clients WHERE phone = $1', [phone]);
        if (!client) {
          const result = await execute(
            'INSERT INTO clients (name, phone, "registrationDate") VALUES ($1, $2, $3) RETURNING id',
            [`${firstName} ${lastName || ''}`.trim(), phone, new Date().toISOString().split('T')[0]]
          );
          client = { id: result.rows[0].id };
        }
        await execute('UPDATE telegram_users SET client_id = $1 WHERE telegram_id = $2', [client.id, telegramId]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Telegram user save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper functions
function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

module.exports = router;
