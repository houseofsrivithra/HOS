const express = require('express');
const { getDb } = require('../db/schema');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/content - Get all site content
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const content = db.prepare('SELECT * FROM site_content').all();
    db.close();

    const contentMap = {};
    content.forEach(c => {
      contentMap[c.section_key] = {
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        content: JSON.parse(c.content || '{}'),
        updated_at: c.updated_at
      };
    });

    res.json(contentMap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// GET /api/content/:key - Get specific section
router.get('/:key', (req, res) => {
  try {
    const db = getDb();
    const content = db.prepare('SELECT * FROM site_content WHERE section_key = ?').get(req.params.key);
    db.close();

    if (!content) return res.status(404).json({ error: 'Content section not found' });

    res.json({
      ...content,
      content: JSON.parse(content.content || '{}')
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// PUT /api/content/:key - Update section (Admin only)
router.put('/:key', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { title, subtitle, content } = req.body;

    const existing = db.prepare('SELECT * FROM site_content WHERE section_key = ?').get(req.params.key);

    if (existing) {
      db.prepare(
        'UPDATE site_content SET title = ?, subtitle = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE section_key = ?'
      ).run(
        title || existing.title,
        subtitle || existing.subtitle,
        JSON.stringify(content || JSON.parse(existing.content || '{}')),
        req.params.key
      );
    } else {
      db.prepare(
        'INSERT INTO site_content (section_key, title, subtitle, content) VALUES (?, ?, ?, ?)'
      ).run(req.params.key, title || '', subtitle || '', JSON.stringify(content || {}));
    }

    const updated = db.prepare('SELECT * FROM site_content WHERE section_key = ?').get(req.params.key);
    db.close();

    res.json({
      ...updated,
      content: JSON.parse(updated.content || '{}')
    });
  } catch (err) {
    console.error('Error updating content:', err);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

module.exports = router;
