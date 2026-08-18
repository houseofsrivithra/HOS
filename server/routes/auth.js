const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/schema');
const { JWT_SECRET, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const db = getDb();
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      db.close();
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      db.close();
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, password_hash, phone || '', 'customer');

    const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    db.close();

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const db = getDb();
    const { email, password } = req.body;

    if (!email || !password) {
      db.close();
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    if (!user) {
      db.close();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      db.close();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    db.close();
    res.json({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, name, email, phone, addresses, role, created_at FROM users WHERE id = ?').get(req.user.id);
    db.close();

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      ...user,
      addresses: JSON.parse(user.addresses || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/auth/profile - Update profile
router.put('/profile', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const db = getDb();
    const { name, phone, addresses } = req.body;

    db.prepare('UPDATE users SET name = ?, phone = ?, addresses = ? WHERE id = ?').run(
      name, phone || '', JSON.stringify(addresses || []), req.user.id
    );

    const user = db.prepare('SELECT id, name, email, phone, addresses, role FROM users WHERE id = ?').get(req.user.id);
    db.close();

    res.json({
      ...user,
      addresses: JSON.parse(user.addresses || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      db.close();
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isValid) {
      db.close();
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);
    db.close();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /api/auth/reset-admin-password (Admin only)
router.post('/reset-admin-password', requireAdmin, (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const targetEmail = email || 'Houseofsrivithra@gmail.com';
    const passwordToSet = newPassword || 'Hos@2025';

    const db = getDb();
    const adminUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND role = ?').get(targetEmail, 'admin');

    if (!adminUser) {
      db.close();
      return res.status(404).json({ error: 'Admin account not found' });
    }

    const newHash = bcrypt.hashSync(passwordToSet, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, adminUser.id);
    db.close();

    res.json({ message: `Admin password has been reset successfully` });
  } catch (err) {
    console.error('Reset admin password error:', err);
    res.status(500).json({ error: 'Failed to reset admin password' });
  }
});

module.exports = router;
