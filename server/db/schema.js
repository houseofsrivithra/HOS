const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'store.db');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function initializeDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      image TEXT DEFAULT '',
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      short_description TEXT DEFAULT '',
      price REAL NOT NULL,
      original_price REAL DEFAULT 0,
      category_id INTEGER,
      category_name TEXT DEFAULT '',
      sku TEXT DEFAULT '',
      images TEXT DEFAULT '[]',
      sizes TEXT DEFAULT '[]',
      colors TEXT DEFAULT '[]',
      stock INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      is_new_arrival INTEGER DEFAULT 0,
      is_best_seller INTEGER DEFAULT 0,
      material TEXT DEFAULT '',
      care_instructions TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT DEFAULT '',
      addresses TEXT DEFAULT '[]',
      role TEXT DEFAULT 'customer',
      oauth_provider TEXT DEFAULT '',
      oauth_id TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      user_id INTEGER,
      user_name TEXT DEFAULT '',
      user_email TEXT DEFAULT '',
      items TEXT NOT NULL DEFAULT '[]',
      subtotal REAL DEFAULT 0,
      shipping REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_address TEXT DEFAULT '{}',
      payment_method TEXT DEFAULT 'cod',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      size TEXT DEFAULT '',
      color TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS site_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT NOT NULL UNIQUE,
      title TEXT DEFAULT '',
      subtitle TEXT DEFAULT '',
      content TEXT DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      message TEXT NOT NULL,
      email_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: add OAuth columns if they don't exist yet (safe to run multiple times)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN oauth_provider TEXT DEFAULT ''`);
  } catch (_) { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN oauth_id TEXT DEFAULT ''`);
  } catch (_) { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE cart_items ADD COLUMN user_id INTEGER DEFAULT NULL`);
  } catch (_) { /* column already exists */ }

  db.close();
  console.log('Database initialized successfully.');
  ensureAdminUser();
}

function ensureAdminUser() {
  const bcrypt = require('bcryptjs');
  const db = getDb();
  try {
    const adminEmail = 'Houseofsrivithra@gmail.com';
    const passwordHash = bcrypt.hashSync('Hos@2025', 10);

    const existingAdmin = db.prepare('SELECT id, email FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(email) = LOWER(?) OR role = ?').get(adminEmail, 'srivithra@gmail.com', 'admin');

    if (existingAdmin) {
      db.prepare('UPDATE users SET email = ?, password_hash = ?, role = ? WHERE id = ?').run(
        adminEmail,
        passwordHash,
        'admin',
        existingAdmin.id
      );
      console.log(`Admin account updated/verified for ${adminEmail}`);
    } else {
      db.prepare('INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)').run(
        'Admin',
        adminEmail,
        passwordHash,
        '+91 9876543210',
        'admin'
      );
      console.log(`Admin account created for ${adminEmail}`);
    }
  } catch (err) {
    console.error('Failed to ensure admin user:', err);
  } finally {
    db.close();
  }
}

module.exports = { getDb, initializeDatabase, ensureAdminUser, DB_PATH };
