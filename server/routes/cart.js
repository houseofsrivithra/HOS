const express = require('express');
const { getDb } = require('../db/schema');

const router = express.Router();

// Helper to get cart query & params based on auth or session
function getCartFilter(req) {
  if (req.user && req.user.id) {
    return { condition: 'ci.user_id = ?', params: [req.user.id] };
  }
  const sessionId = req.query.session_id || req.headers['x-session-id'];
  return { condition: 'ci.session_id = ? AND ci.user_id IS NULL', params: [sessionId || '__no_session__'] };
}

// GET /api/cart
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { condition, params } = getCartFilter(req);

    const items = db.prepare(`
      SELECT ci.*, p.name, p.price, p.original_price, p.images, p.stock, p.category_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ${condition}
      ORDER BY ci.created_at DESC
    `).all(...params).map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    db.close();

    res.json({ items, total });
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart - Add item
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { session_id, product_id, quantity = 1, size, color } = req.body;

    if (!product_id) {
      db.close();
      return res.status(400).json({ error: 'product_id is required' });
    }

    const userId = req.user ? req.user.id : null;
    const effectiveSessionId = session_id || req.headers['x-session-id'] || 'guest_sess';

    // Check if item already exists in user's or session's cart
    let existing;
    if (userId) {
      existing = db.prepare(
        'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?'
      ).get(userId, product_id, size || '', color || '');
    } else {
      existing = db.prepare(
        'SELECT * FROM cart_items WHERE session_id = ? AND user_id IS NULL AND product_id = ? AND size = ? AND color = ?'
      ).get(effectiveSessionId, product_id, size || '', color || '');
    }

    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
    } else {
      db.prepare(
        'INSERT INTO cart_items (session_id, user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(effectiveSessionId, userId, product_id, quantity, size || '', color || '');
    }

    // Return updated cart
    const { condition, params } = getCartFilter(req);
    const items = db.prepare(`
      SELECT ci.*, p.name, p.price, p.original_price, p.images, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ${condition}
      ORDER BY ci.created_at DESC
    `).all(...params).map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    db.close();

    res.json({ items, total });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PUT /api/cart/:id - Update quantity
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { quantity } = req.body;

    if (quantity <= 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
    } else {
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
    }

    const { condition, params } = getCartFilter(req);
    const items = db.prepare(`
      SELECT ci.*, p.name, p.price, p.original_price, p.images, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ${condition}
      ORDER BY ci.created_at DESC
    `).all(...params).map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    db.close();

    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/:id - Remove item
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
    db.close();
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

// DELETE /api/cart - Clear cart
router.delete('/', (req, res) => {
  try {
    const db = getDb();
    if (req.user && req.user.id) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    } else {
      const sessionId = req.query.session_id || req.headers['x-session-id'];
      if (sessionId) {
        db.prepare('DELETE FROM cart_items WHERE session_id = ? AND user_id IS NULL').run(sessionId);
      }
    }
    db.close();
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
