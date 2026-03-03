const cron = require('node-cron');
const { queryAll, execute } = require('../config/database');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Send message to Telegram user via Bot API
 */
async function sendTelegramMessage(chatId, text) {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram send error:', data.description);
    }
    return data.ok;
  } catch (err) {
    console.error('Telegram send error:', err.message);
    return false;
  }
}

/**
 * Start cron job for appointment reminders
 * Runs every hour, sends notification 2 hours before appointment
 */
function startNotificationCron() {
  if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.log('Notification cron: BOT_TOKEN not set, skipping');
    return;
  }

  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const today = now.toISOString().split('T')[0];
      const targetTime = twoHoursLater.toTimeString().slice(0, 5);
      const currentTime = now.toTimeString().slice(0, 5);

      // Find appointments that start in ~2 hours and haven't been notified yet
      const appointments = await queryAll(`
        SELECT a.id, a.date, a.time, s.name as "serviceName", e.name as "employeeName",
               c.name as "clientName", tu.telegram_id
        FROM appointments a
        LEFT JOIN services s ON s.id = a."serviceId"
        LEFT JOIN employees e ON e.id = a."employeeId"
        LEFT JOIN clients c ON c.id = a."clientId"
        LEFT JOIN telegram_users tu ON tu.client_id = a."clientId"
        WHERE a.date = $1
          AND a.time >= $2 AND a.time <= $3
          AND a.status IN ('confirmed', 'pending')
          AND tu.telegram_id IS NOT NULL
      `, [today, currentTime, targetTime]);

      let sent = 0;
      for (const apt of appointments) {
        const message =
          `⏰ *Напоминание о записи!*\n\n` +
          `💇 Услуга: ${apt.serviceName}\n` +
          `👩‍🎨 Мастер: ${apt.employeeName}\n` +
          `🕐 Время: ${apt.time}\n\n` +
          `Ждём вас через 2 часа!`;

        const ok = await sendTelegramMessage(apt.telegram_id, message);
        if (ok) sent++;
      }

      if (sent > 0) {
        console.log(`Notification cron: ${sent} reminders sent`);
      }
    } catch (err) {
      console.error('Notification cron error:', err);
    }
  });

  console.log('Notification cron started (hourly check for reminders)');
}

module.exports = { startNotificationCron, sendTelegramMessage };
