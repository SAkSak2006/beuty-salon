const express = require('express');
const crypto = require('crypto');
const { queryAll, queryOne } = require('../database');
const router = express.Router();

// Demo users (no separate users table — tied to employees)
const DEMO_USERS = [
  { id: 1, username: 'owner', password: 'admin123', role: 'owner', employeeName: 'Владелец' },
  { id: 2, username: 'admin', password: 'admin123', role: 'admin', employeeName: 'Администратор' },
  { id: 3, username: 'master', password: 'admin123', role: 'master', employeeName: 'Мастер', employeeId: 1 },
];

// Simple token store (in-memory, resets on server restart)
const tokens = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function findUserByToken(token) {
  const entry = tokens.get(token);
  if (!entry) return null;
  return entry.user;
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = DEMO_USERS.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  const accessToken = generateToken();
  const refreshToken = generateToken();

  const userInfo = {
    id: user.id,
    username: user.username,
    role: user.role,
    employeeName: user.employeeName,
    employeeId: user.employeeId,
  };

  tokens.set(accessToken, { user: userInfo, type: 'access' });
  tokens.set(refreshToken, { user: userInfo, type: 'refresh' });

  res.json({ accessToken, refreshToken, user: userInfo });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  const entry = tokens.get(refreshToken);
  if (!entry || entry.type !== 'refresh') {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Revoke old refresh token
  tokens.delete(refreshToken);

  // Issue new access token
  const newAccessToken = generateToken();
  const newRefreshToken = generateToken();

  tokens.set(newAccessToken, { user: entry.user, type: 'access' });
  tokens.set(newRefreshToken, { user: entry.user, type: 'refresh' });

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const user = findUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  res.json(user);
});

module.exports = router;
