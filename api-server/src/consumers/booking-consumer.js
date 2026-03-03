const { getRabbitChannel } = require('../config/rabbitmq');
const { pool, queryOne } = require('../config/database');
const CacheService = require('../services/cache-service');
const { sendTelegramMessage } = require('../services/notification-service');

/**
 * Booking consumer — processes booking requests from RabbitMQ
 * Uses PostgreSQL transactions with SELECT ... FOR UPDATE for race condition protection
 */
async function startBookingConsumer() {
  const channel = await getRabbitChannel();
  if (!channel) {
    console.log('RabbitMQ unavailable, booking consumer not started (using direct booking)');
    return;
  }

  channel.prefetch(1);

  channel.consume('booking_requests', async (msg) => {
    if (!msg) return;

    const booking = JSON.parse(msg.content.toString());
    console.log('Processing booking request:', booking);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Lock the employee's appointments for this date to prevent double-booking
      await client.query(
        `SELECT id FROM appointments
         WHERE "employeeId" = $1 AND date = $2 AND status != 'cancelled'
         FOR UPDATE`,
        [booking.employeeId, booking.date]
      );

      // Check if the specific time slot is still available
      const existingAppts = await client.query(
        `SELECT time, duration FROM appointments
         WHERE "employeeId" = $1 AND date = $2 AND status != 'cancelled'`,
        [booking.employeeId, booking.date]
      );

      const requestStart = timeToMinutes(booking.time);
      const requestEnd = requestStart + booking.duration;

      const hasConflict = existingAppts.rows.some(apt => {
        const aptStart = timeToMinutes(apt.time);
        const aptEnd = aptStart + apt.duration;
        return requestStart < aptEnd && requestEnd > aptStart;
      });

      if (hasConflict) {
        await client.query('ROLLBACK');
        console.log('Booking conflict detected, slot already taken');

        // Notify user about conflict
        if (booking.telegramId) {
          await sendTelegramMessage(
            booking.telegramId,
            `❌ *К сожалению, время ${booking.time} уже занято.*\n\nПопробуйте выбрать другое время.`
          );
        }

        channel.ack(msg);
        return;
      }

      // Create the appointment
      const result = await client.query(
        `INSERT INTO appointments ("clientId", "employeeId", "serviceId", date, time, duration, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', NOW(), NOW()) RETURNING id`,
        [booking.clientId, booking.employeeId, booking.serviceId, booking.date, booking.time, booking.duration]
      );

      await client.query('COMMIT');

      const appointmentId = result.rows[0].id;

      // Invalidate slots cache
      await CacheService.invalidate(`slots:${booking.employeeId}:*`);

      console.log('Booking created successfully, ID:', appointmentId);

      // Send confirmation to Telegram user
      if (booking.telegramId) {
        const employee = await queryOne('SELECT name FROM employees WHERE id = $1', [booking.employeeId]);
        const date = new Date(booking.date).toLocaleDateString('ru-RU', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        await sendTelegramMessage(
          booking.telegramId,
          `✅ *Запись подтверждена!*\n\n` +
          `💇 Услуга: ${booking.serviceName || 'Услуга'}\n` +
          `👩‍🎨 Мастер: ${employee ? employee.name : 'Мастер'}\n` +
          `📆 Дата: ${date}\n` +
          `🕐 Время: ${booking.time}\n\n` +
          `Ждём вас!`
        );
      }

      channel.ack(msg);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Booking consumer error:', err);
      channel.nack(msg, false, true); // Requeue
    } finally {
      client.release();
    }
  });

  console.log('Booking consumer started, listening on queue: booking_requests');
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

module.exports = { startBookingConsumer };
