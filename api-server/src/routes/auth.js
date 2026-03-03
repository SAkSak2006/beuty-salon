const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { queryOne, execute } = require('../config/database');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'beauty-salon-jwt-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'beauty-salon-refresh-secret';

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Укажите логин и пароль' });
    }

    const user = await queryOne(
      'SELECT u.*, e.name as employee_name FROM users u LEFT JOIN employees e ON e.id = u.employee_id WHERE u.username = $1',
      [username]
    );

    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Аккаунт деактивирован' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Generate tokens
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employee_id,
      employeeName: user.employee_name
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Log auth action
    await execute(
      'INSERT INTO audit_log (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [user.id, 'login', req.ip]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        employeeId: user.employee_id,
        employeeName: user.employee_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Токен не предоставлен' });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await queryOne(
      'SELECT u.*, e.name as employee_name FROM users u LEFT JOIN employees e ON e.id = u.employee_id WHERE u.id = $1 AND u.is_active = true',
      [decoded.id]
    );

    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employee_id,
      employeeName: user.employee_name
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
});

// GET /auth/me — текущий пользователь
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      employeeId: decoded.employeeId,
      employeeName: decoded.employeeName
    });
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
});

module.exports = router;
