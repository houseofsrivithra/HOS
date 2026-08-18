const express = require('express');
const { getDb } = require('../db/schema');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
    db.close();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const category = db.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);
    if (!category) {
      db.close();
      return res.status(404).json({ error: 'Category not found' });
    }
    db.close();
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/categories (Admin only)
router.post('/', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { name, slug, image, display_order } = req.body;
    const result = db.prepare(
      'INSERT INTO categories (name, slug, image, display_order) VALUES (?, ?, ?, ?)'
    ).run(name, slug || name.toLowerCase().replace(/\s+/g, '-'), image || '', display_order || 0);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    db.close();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id (Admin only)
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { name, slug, image, display_order } = req.body;
    db.prepare(
      'UPDATE categories SET name = ?, slug = ?, image = ?, display_order = ? WHERE id = ?'
    ).run(name, slug, image || '', display_order || 0, req.params.id);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    db.close();
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id (Admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    db.close();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
