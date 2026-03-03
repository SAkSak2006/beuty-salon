const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'beauty-salon-jwt-secret';

/**
 * JWT authentication middleware
 * Verifies Bearer token and attaches user to req
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истёк', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Недействительный токен' });
  }
}

module.exports = authenticate;
