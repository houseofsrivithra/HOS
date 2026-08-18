const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getDb } = require('../db/schema');
const { sendOrderNotificationEmail } = require('../utils/email');

const router = express.Router();

// Initialize Razorpay with env keys
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// POST /api/payment/create-order
// Creates a Razorpay order and returns the order details for the frontend popup
router.post('/create-order', async (req, res) => {
  try {
    const { items, shipping_address, user_name, user_email } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Calculate total from DB prices (never trust frontend price)
    const db = getDb();
    let subtotal = 0;
    for (const item of items) {
      const product = db.prepare('SELECT price FROM products WHERE id = ?').get(item.product_id);
      if (!product) {
        db.close();
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }
      subtotal += product.price * item.quantity;
    }
    const shipping = subtotal >= 1999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = subtotal + shipping + tax;
    db.close();

    // Razorpay expects amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(total * 100);

    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: 'hos_' + Date.now().toString(36),
      notes: {
        customer_name: user_name || '',
        customer_email: user_email || '',
      },
    });

    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment order' });
  }
});

// POST /api/payment/verify
// Verifies Razorpay payment signature, then creates the confirmed order in DB
router.post('/verify', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // Order data
      items,
      shipping_address,
      user_name,
      user_email,
      notes,
    } = req.body;

    // --- Signature Verification ---
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay secret not configured' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
    }

    // --- Signature verified — now create the confirmed order ---
    const db = getDb();

    let subtotal = 0;
    const orderItems = items.map(item => {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      // Reduce inventory
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);

      return {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: item.size || '',
        color: item.color || '',
        image: JSON.parse(product.images || '[]')[0] || '',
        total: itemTotal,
      };
    });

    const shipping = subtotal >= 1999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = subtotal + shipping + tax;
    const orderNumber = 'HOS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const result = db.prepare(`
      INSERT INTO orders (order_number, user_id, user_name, user_email, items, subtotal, shipping, tax, total, status, shipping_address, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, 'razorpay', ?)
    `).run(
      orderNumber,
      req.user ? req.user.id : null,
      user_name || (req.user ? req.user.name : 'Guest'),
      user_email || (req.user ? req.user.email : ''),
      JSON.stringify(orderItems),
      subtotal, shipping, tax, total,
      JSON.stringify(shipping_address || {}),
      notes || ''
    );

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    db.close();

    const fullOrder = {
      ...order,
      items: JSON.parse(order.items),
      shipping_address: JSON.parse(order.shipping_address),
      razorpay_payment_id,
      razorpay_order_id,
    };

    // Send email notification (non-blocking)
    sendOrderNotificationEmail(fullOrder).catch(err =>
      console.error('Order email notification failed:', err)
    );

    res.status(201).json(fullOrder);
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: err.message || 'Failed to verify payment' });
  }
});

module.exports = router;
