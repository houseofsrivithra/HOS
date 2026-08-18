const express = require('express');
const { getDb } = require('../db/schema');
const { requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'products'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/products - List products with filtering
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const {
      category, search, min_price, max_price,
      sort, limit = 50, offset = 0,
      featured, new_arrivals, best_sellers
    } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND (category_name = ? OR category_id = ?)';
      params.push(category, category);
    }
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR category_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    if (min_price) {
      query += ' AND price >= ?';
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      query += ' AND price <= ?';
      params.push(parseFloat(max_price));
    }
    if (featured === 'true') {
      query += ' AND featured = 1';
    }
    if (new_arrivals === 'true') {
      query += ' AND is_new_arrival = 1';
    }
    if (best_sellers === 'true') {
      query += ' AND is_best_seller = 1';
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query += ' ORDER BY price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY price DESC';
        break;
      case 'newest':
        query += ' ORDER BY created_at DESC';
        break;
      case 'name_asc':
        query += ' ORDER BY name ASC';
        break;
      default:
        query += ' ORDER BY created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const products = db.prepare(query).all(...params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const countParams = [];
    if (category) {
      countQuery += ' AND (category_name = ? OR category_id = ?)';
      countParams.push(category, category);
    }
    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ? OR category_name LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    // Parse JSON fields
    const parsed = products.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
      sizes: JSON.parse(p.sizes || '[]'),
      colors: JSON.parse(p.colors || '[]')
    }));

    db.close();
    res.json({ products: parsed, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Single product
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!product) {
      db.close();
      return res.status(404).json({ error: 'Product not found' });
    }

    const parsed = {
      ...product,
      images: JSON.parse(product.images || '[]'),
      sizes: JSON.parse(product.sizes || '[]'),
      colors: JSON.parse(product.colors || '[]')
    };

    // Get related products from same category
    const related = db.prepare(
      'SELECT * FROM products WHERE category_name = ? AND id != ? ORDER BY RANDOM() LIMIT 4'
    ).all(product.category_name, product.id).map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
      sizes: JSON.parse(p.sizes || '[]'),
      colors: JSON.parse(p.colors || '[]')
    }));

    db.close();
    res.json({ product: parsed, related });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create product (Admin only)
router.post('/', requireAdmin, upload.array('images', 5), (req, res) => {
  try {
    const db = getDb();
    const {
      name, description, short_description, price, original_price,
      category_id, category_name, sku, sizes, colors, stock,
      featured, is_new_arrival, is_best_seller, material, care_instructions
    } = req.body;

    // Start with any explicitly passed image URLs (e.g. existing images to keep)
    let images = [];
    if (req.body.images) {
      try { images = JSON.parse(req.body.images); } catch (e) {}
    }
    // Append newly uploaded files on top
    if (req.files && req.files.length > 0) {
      const uploadedUrls = req.files.map(f => `/uploads/products/${f.filename}`);
      images = [...images, ...uploadedUrls];
    }

    const result = db.prepare(`
      INSERT INTO products (name, description, short_description, price, original_price,
        category_id, category_name, sku, images, sizes, colors, stock,
        featured, is_new_arrival, is_best_seller, material, care_instructions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, description || '', short_description || '', parseFloat(price), parseFloat(original_price || 0),
      category_id ? parseInt(category_id) : null, category_name || '', sku || '',
      JSON.stringify(images), 
      typeof sizes === 'string' ? sizes : JSON.stringify(sizes || []),
      typeof colors === 'string' ? colors : JSON.stringify(colors || []),
      parseInt(stock || 0),
      featured === 'true' || featured === true ? 1 : 0,
      is_new_arrival === 'true' || is_new_arrival === true ? 1 : 0,
      is_best_seller === 'true' || is_best_seller === true ? 1 : 0,
      material || '', care_instructions || ''
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    db.close();

    res.status(201).json({
      ...product,
      images: JSON.parse(product.images || '[]'),
      sizes: JSON.parse(product.sizes || '[]'),
      colors: JSON.parse(product.colors || '[]')
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', requireAdmin, upload.array('images', 5), (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!existing) {
      db.close();
      return res.status(404).json({ error: 'Product not found' });
    }

    const {
      name, description, short_description, price, original_price,
      category_id, category_name, sku, sizes, colors, stock,
      featured, is_new_arrival, is_best_seller, material, care_instructions
    } = req.body;

    // Start with the explicitly kept images list sent from admin (may be a subset of original)
    let images;
    if (req.body.images) {
      try { images = JSON.parse(req.body.images); } catch (e) { images = JSON.parse(existing.images || '[]'); }
    } else {
      images = JSON.parse(existing.images || '[]');
    }
    // Append any newly uploaded files on top
    if (req.files && req.files.length > 0) {
      const uploadedUrls = req.files.map(f => `/uploads/products/${f.filename}`);
      images = [...images, ...uploadedUrls];
    }

    db.prepare(`
      UPDATE products SET
        name = ?, description = ?, short_description = ?, price = ?, original_price = ?,
        category_id = ?, category_name = ?, sku = ?, images = ?, sizes = ?, colors = ?,
        stock = ?, featured = ?, is_new_arrival = ?, is_best_seller = ?,
        material = ?, care_instructions = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || existing.name,
      description !== undefined ? description : existing.description,
      short_description !== undefined ? short_description : existing.short_description,
      price ? parseFloat(price) : existing.price,
      original_price ? parseFloat(original_price) : existing.original_price,
      category_id ? parseInt(category_id) : existing.category_id,
      category_name || existing.category_name,
      sku || existing.sku,
      JSON.stringify(images),
      sizes ? (typeof sizes === 'string' ? sizes : JSON.stringify(sizes)) : existing.sizes,
      colors ? (typeof colors === 'string' ? colors : JSON.stringify(colors)) : existing.colors,
      stock !== undefined ? parseInt(stock) : existing.stock,
      featured === 'true' || featured === true ? 1 : (featured === 'false' || featured === false ? 0 : existing.featured),
      is_new_arrival === 'true' || is_new_arrival === true ? 1 : (is_new_arrival === 'false' || is_new_arrival === false ? 0 : existing.is_new_arrival),
      is_best_seller === 'true' || is_best_seller === true ? 1 : (is_best_seller === 'false' || is_best_seller === false ? 0 : existing.is_best_seller),
      material || existing.material,
      care_instructions || existing.care_instructions,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    db.close();

    res.json({
      ...updated,
      images: JSON.parse(updated.images || '[]'),
      sizes: JSON.parse(updated.sizes || '[]'),
      colors: JSON.parse(updated.colors || '[]')
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// PATCH /api/products/:id/flags - Quick-toggle new_arrival / best_seller / featured (Admin only)
router.patch('/:id/flags', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) { db.close(); return res.status(404).json({ error: 'Product not found' }); }

    const fields = [];
    const values = [];
    const allowed = ['is_new_arrival', 'is_best_seller', 'featured'];
    allowed.forEach(f => {
      if (req.body[f] !== undefined) {
        fields.push(`${f} = ?`);
        values.push(req.body[f] ? 1 : 0);
      }
    });
    if (fields.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    values.push(req.params.id);
    db.prepare(`UPDATE products SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    db.close();

    res.json({ ...updated, images: JSON.parse(updated.images || '[]'), sizes: JSON.parse(updated.sizes || '[]'), colors: JSON.parse(updated.colors || '[]') });
  } catch (err) {
    console.error('Error patching product flags:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!existing) {
      db.close();
      return res.status(404).json({ error: 'Product not found' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    db.close();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
