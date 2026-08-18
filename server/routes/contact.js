const express = require('express');
const { sendContactEmail } = require('../utils/email');
const { getDb } = require('../db/schema');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/contact - Handle contact form submission
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: 'Name, email, phone, and message are required.' });
  }

  // Step 1: Always save the message to the database first
  let savedId = null;
  try {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO contact_messages (name, email, phone, subject, message, email_sent)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(name, email, phone || '', subject || '', message);
    savedId = result.lastInsertRowid;
    db.close();
  } catch (dbErr) {
    console.error('Contact DB save error:', dbErr);
    // If we can't even save to DB, return an error
    return res.status(500).json({ error: 'Failed to save message. Please try again later.' });
  }

  // Step 2: Attempt to send email (non-blocking — don't fail the request if email fails)
  let emailSent = false;
  try {
    await sendContactEmail({ name, email, phone, subject, message });
    emailSent = true;

    // Mark email as sent in DB
    const db = getDb();
    db.prepare('UPDATE contact_messages SET email_sent = 1 WHERE id = ?').run(savedId);
    db.close();
  } catch (emailErr) {
    console.error('Contact form email error (message still saved to DB):', emailErr.message || emailErr);
    // Email failed but message was saved — still return success to the user
  }

  res.json({
    success: true,
    message: 'Your message has been received! We will get back to you within 24 hours.',
    emailSent
  });
});

// GET /api/contact - Admin: view all contact messages
router.get('/', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const messages = db.prepare(
      'SELECT * FROM contact_messages ORDER BY created_at DESC'
    ).all();
    db.close();
    res.json({ messages, total: messages.length });
  } catch (err) {
    console.error('Error fetching contact messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

module.exports = router;
