const express = require('express');
const { getDb } = require('../db/schema');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All wishlist routes require authentication
router.use(requireAuth);

// GET /api/wishlist - Get current user's wishlist
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const items = db.prepare(`
      SELECT w.id as wishlist_id, w.product_id, w.created_at,
             p.name, p.price, p.original_price, p.images, p.stock, p.category_name, p.description
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(req.user.id).map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));

    db.close();
    res.json({ items, count: items.length });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST /api/wishlist - Add product to wishlist
router.post('/', (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const db = getDb();
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
    if (!product) {
      db.close();
      return res.status(404).json({ error: 'Product not found' });
    }

    const existing = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
    if (!existing) {
      db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
    }

    const items = db.prepare(`
      SELECT w.id as wishlist_id, w.product_id, w.created_at,
             p.name, p.price, p.original_price, p.images, p.stock, p.category_name
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(req.user.id).map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));

    db.close();
    res.status(201).json({ items, count: items.length, message: 'Added to wishlist' });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/wishlist/:productId - Remove product from wishlist
router.delete('/:productId', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
    
    const items = db.prepare(`
      SELECT w.id as wishlist_id, w.product_id, w.created_at,
             p.name, p.price, p.original_price, p.images, p.stock, p.category_name
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(req.user.id).map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));

    db.close();
    res.json({ items, count: items.length, message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

module.exports = router;
