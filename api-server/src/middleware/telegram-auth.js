const crypto = require('crypto');

const BOT_TOKEN = process.env.BOT_TOKEN || '';

/**
 * Validate Telegram Web App initData (HMAC-SHA-256)
 * Used to verify requests from Mini App
 */
function validateTelegramData(req, res, next) {
  const initData = req.headers['x-telegram-init-data'] || req.query.initData;

  if (!initData) {
    return res.status(401).json({ error: 'Telegram initData required' });
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Sort params alphabetically
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create HMAC-SHA-256
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(sortedParams).digest('hex');

    if (computedHash !== hash) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Parse user data
    const userData = params.get('user');
    if (userData) {
      req.telegramUser = JSON.parse(userData);
    }

    next();
  } catch (err) {
    console.error('Telegram auth error:', err);
    return res.status(401).json({ error: 'Invalid Telegram data' });
  }
}

module.exports = validateTelegramData;
