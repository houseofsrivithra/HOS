require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeDatabase } = require('./db/schema');
const { seedDatabase } = require('./db/seed');
const { authenticateToken, requireAdmin } = require('./middleware/auth');

// Import routes
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const ordersRouter = require('./routes/orders');
const cartRouter = require('./routes/cart');
const wishlistRouter = require('./routes/wishlist');
const authRouter = require('./routes/auth');
const oauthRouter = require('./routes/oauth');
const contentRouter = require('./routes/content');
const contactRouter = require('./routes/contact');
const paymentRouter = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware - Allow requests from localhost, Vercel deployments, and production domains
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth middleware (optional - adds user to req if token present)
app.use(authenticateToken);

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/auth', authRouter);
app.use('/api/auth', oauthRouter);   // Google & Apple OAuth routes
app.use('/api/content', contentRouter);
app.use('/api/contact', contactRouter);
app.use('/api/payment', paymentRouter);

// Dashboard stats endpoint (Admin only)
app.get('/api/dashboard/stats', requireAdmin, (req, res) => {
  try {
    const { getDb } = require('./db/schema');
    const db = getDb();

    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != ?').get('cancelled').total;
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('customer').count;
    const lowStockProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock < 10').get().count;
    const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('pending').count;

    // Recent orders
    const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5').all().map(o => ({
      ...o,
      items: JSON.parse(o.items || '[]'),
      shipping_address: JSON.parse(o.shipping_address || '{}')
    }));

    // Orders by status
    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM orders GROUP BY status
    `).all();

    // Top selling products (by order frequency)
    const topProducts = db.prepare('SELECT * FROM products WHERE is_best_seller = 1 LIMIT 5').all().map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
      sizes: JSON.parse(p.sizes || '[]'),
      colors: JSON.parse(p.colors || '[]')
    }));

    db.close();

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      totalCustomers,
      lowStockProducts,
      pendingOrders,
      recentOrders,
      ordersByStatus,
      topProducts
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed endpoint (auto or manual trigger)
app.get('/api/seed', (req, res) => {
  try {
    seedDatabase();
    res.json({ status: 'ok', message: 'Database seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize database and auto-seed sample products if empty
initializeDatabase();
try {
  seedDatabase();
} catch (seedErr) {
  console.log('Seed check:', seedErr.message);
}

app.listen(PORT, () => {
  console.log(`\n🏪 House of Srivithra API Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   API docs: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
