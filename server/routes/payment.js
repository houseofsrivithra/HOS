const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { getDb } = require('../db/schema');
const { sendOrderNotificationEmail } = require('../utils/email');
const { calculateShipping } = require('../utils/shipping');

const router = express.Router();

// Initialize Razorpay with keys from .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Step 1: Called when user clicks "Proceed to Pay"
// Calculates total from DB (secure), creates a Razorpay order, returns order_id
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-order', async (req, res) => {
  try {
    const { items, shipping_address } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Always calculate total from DB — never trust client-side amounts
    const db = getDb();
    let subtotal = 0;

    for (const item of items) {
      const product = db.prepare('SELECT price FROM products WHERE id = ?').get(item.product_id);
      if (!product) {
        db.close();
        return res.status(400).json({ error: `Product not found: ${item.product_id}` });
      }
      subtotal += product.price * item.quantity;
    }
    db.close();

    const shipping = calculateShipping(shipping_address || {});
    const tax = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + shipping + tax;

    // Razorpay requires amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(grandTotal * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: 'HOS-' + Date.now().toString(36).toUpperCase(),
    });

    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ error: 'Failed to create payment order. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Step 2: Called after customer completes payment on Razorpay popup
// Verifies HMAC signature then saves order to DB and sends email notification
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      shipping_address,
      user_name,
      user_email,
      notes,
    } = req.body;

    // Verify Razorpay payment signature (security check)
    const hmacBody = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(hmacBody)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed. Please contact support.' });
    }

    // Save order to database
    const db = getDb();
    let subtotal = 0;

    const orderItems = items.map(item => {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      // Reduce stock
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

    const shipping = calculateShipping(shipping_address || {});
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shipping + tax;

    const orderNumber =
      'HOS-' + Date.now().toString(36).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const result = db.prepare(`
      INSERT INTO orders
        (order_number, user_id, user_name, user_email, items, subtotal, shipping, tax, total, status, shipping_address, payment_method, notes)
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
    };

    // Send email notification (non-blocking)
    sendOrderNotificationEmail(fullOrder).catch(err =>
      console.error('Order email notification failed:', err)
    );

    res.status(201).json(fullOrder);
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ error: 'Order creation failed after payment: ' + err.message });
  }
});

module.exports = router;
