const express = require('express');
const { getDb } = require('../db/schema');
const { v4: uuidv4 } = require('uuid');
const { sendOrderNotificationEmail } = require('../utils/email');
const { calculateShipping } = require('../utils/shipping');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const ExcelJS = require('exceljs');

const router = express.Router();

// GET /api/orders/export/excel - Export orders to Excel spreadsheet (Admin only)
router.get('/export/excel', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();

    // Map of product IDs to SKUs for lookup
    const products = db.prepare('SELECT id, sku FROM products').all();
    const skuMap = {};
    products.forEach(p => { skuMap[p.id] = p.sku || ''; });

    db.close();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: 'No orders available to export.' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'House of Srivithra Fashion Store';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Orders', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    worksheet.columns = [
      { header: 'Order ID', key: 'order_number', width: 22 },
      { header: 'Order Date', key: 'created_at', width: 20 },
      { header: 'Order Status', key: 'status', width: 14 },
      { header: 'Customer Name', key: 'user_name', width: 20 },
      { header: 'Customer Email', key: 'user_email', width: 26 },
      { header: 'Phone Number', key: 'phone', width: 16 },
      { header: 'Delivery Address', key: 'address', width: 32 },
      { header: 'City', key: 'city', width: 16 },
      { header: 'State', key: 'state', width: 16 },
      { header: 'Pincode', key: 'pincode', width: 12 },
      { header: 'Product ID', key: 'product_id', width: 12 },
      { header: 'Product SKU', key: 'product_sku', width: 16 },
      { header: 'Product Name', key: 'product_name', width: 30 },
      { header: 'Size', key: 'size', width: 10 },
      { header: 'Color', key: 'color', width: 12 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Unit Price', key: 'unit_price', width: 14 },
      { header: 'Item Total', key: 'item_total', width: 14 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'Shipping', key: 'shipping', width: 12 },
      { header: 'Tax', key: 'tax', width: 12 },
      { header: 'Grand Total', key: 'total', width: 14 },
      { header: 'Payment Method', key: 'payment_method', width: 16 },
      { header: 'Notes', key: 'notes', width: 24 },
    ];

    // Format header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3A4D39' } // Dark moss green theme color
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 26;

    // Enable auto filter across all header columns
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length }
    };

    function formatRow(row) {
      row.alignment = { vertical: 'middle' };
      row.getCell('quantity').alignment = { horizontal: 'right' };
      row.getCell('unit_price').alignment = { horizontal: 'right' };
      row.getCell('item_total').alignment = { horizontal: 'right' };
      row.getCell('subtotal').alignment = { horizontal: 'right' };
      row.getCell('shipping').alignment = { horizontal: 'right' };
      row.getCell('tax').alignment = { horizontal: 'right' };
      row.getCell('total').alignment = { horizontal: 'right' };

      row.getCell('unit_price').numFmt = '₹#,##0.00';
      row.getCell('item_total').numFmt = '₹#,##0.00';
      row.getCell('subtotal').numFmt = '₹#,##0.00';
      row.getCell('shipping').numFmt = '₹#,##0.00';
      row.getCell('tax').numFmt = '₹#,##0.00';
      row.getCell('total').numFmt = '₹#,##0.00';
      row.getCell('quantity').numFmt = '#,##0';
    }

    orders.forEach(order => {
      let items = [];
      let addr = {};
      try { items = JSON.parse(order.items || '[]'); } catch (_) {}
      try { addr = JSON.parse(order.shipping_address || '{}'); } catch (_) {}

      const formattedDate = order.created_at
        ? new Date(order.created_at).toISOString().replace('T', ' ').substring(0, 19)
        : '';

      const baseOrderData = {
        order_number: order.order_number || `ORDER-#${order.id}`,
        created_at: formattedDate,
        status: (order.status || 'pending').toUpperCase(),
        user_name: addr.name || order.user_name || 'Guest',
        user_email: order.user_email || '',
        phone: addr.phone || '',
        address: addr.address || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
        subtotal: Number(order.subtotal || 0),
        shipping: Number(order.shipping || 0),
        tax: Number(order.tax || 0),
        total: Number(order.total || 0),
        payment_method: order.payment_method ? order.payment_method.toUpperCase() : 'STANDARD',
        notes: order.notes || ''
      };

      if (items && items.length > 0) {
        items.forEach(item => {
          const productId = item.product_id || '';
          const productSku = productId ? (skuMap[productId] || '') : '';
          const row = worksheet.addRow({
            ...baseOrderData,
            product_id: productId,
            product_sku: productSku,
            product_name: item.name || '',
            size: item.size || '',
            color: item.color || '',
            quantity: Number(item.quantity || 1),
            unit_price: Number(item.price || 0),
            item_total: Number(item.total || (item.price * item.quantity) || 0)
          });
          formatRow(row);
        });
      } else {
        const row = worksheet.addRow({
          ...baseOrderData,
          product_id: '',
          product_sku: '',
          product_name: 'N/A',
          size: '',
          color: '',
          quantity: 0,
          unit_price: 0,
          item_total: 0
        });
        formatRow(row);
      }
    });

    // Auto-adjust column widths based on content length
    worksheet.columns.forEach(column => {
      let maxLen = column.header ? column.header.length : 10;
      column.eachCell({ includeEmpty: true }, cell => {
        const val = cell.value ? cell.value.toString() : '';
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      });
      column.width = Math.min(Math.max(maxLen + 4, 12), 45);
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `fashion-store-orders-${dateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating Excel export:', err);
    res.status(500).json({ error: 'Failed to export orders to Excel.' });
  }
});


// GET /api/orders - List orders (Authenticated: admin sees all, customer sees own)
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // If non-admin user, strictly only show their own orders
    if (req.user.role !== 'admin') {
      query += ' AND user_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = db.prepare(query).all(...params).map(o => ({
      ...o,
      items: JSON.parse(o.items || '[]'),
      shipping_address: JSON.parse(o.shipping_address || '{}')
    }));

    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const countParams = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (req.user.role !== 'admin') {
      countQuery += ' AND user_id = ?';
      countParams.push(req.user.id);
    }
    const { total } = db.prepare(countQuery).get(...countParams);
    db.close();

    res.json({ orders, total });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Single order details
router.get('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(req.params.id, req.params.id);
    
    if (!order) {
      db.close();
      return res.status(404).json({ error: 'Order not found' });
    }

    // Authorization check: user must be admin or the owner of the order
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      db.close();
      return res.status(403).json({ error: 'Access denied: You do not have permission to view this order' });
    }

    db.close();
    res.json({
      ...order,
      items: JSON.parse(order.items || '[]'),
      shipping_address: JSON.parse(order.shipping_address || '{}')
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders - Create order
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const {
      items, shipping_address, payment_method, user_name, user_email, notes
    } = req.body;

    if (!items || items.length === 0) {
      db.close();
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map(item => {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      // Decrease stock
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);

      return {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: item.size || '',
        color: item.color || '',
        image: JSON.parse(product.images || '[]')[0] || '',
        total: itemTotal
      };
    });

    const shipping = calculateShipping(shipping_address || {});
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shipping + tax;
    const orderNumber = 'HOS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const result = db.prepare(`
      INSERT INTO orders (order_number, user_id, user_name, user_email, items, subtotal, shipping, tax, total, status, shipping_address, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(
      orderNumber,
      req.user ? req.user.id : null,
      user_name || (req.user ? req.user.name : 'Guest'),
      user_email || (req.user ? req.user.email : ''),
      JSON.stringify(orderItems),
      subtotal, shipping, tax, total,
      JSON.stringify(shipping_address || {}),
      payment_method || null,
      notes || ''
    );

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    db.close();

    const fullOrder = {
      ...order,
      items: JSON.parse(order.items),
      shipping_address: JSON.parse(order.shipping_address)
    };

    // Send email notification to store (non-blocking)
    sendOrderNotificationEmail(fullOrder).catch(err =>
      console.error('Order email notification failed:', err)
    );

    res.status(201).json(fullOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/orders/:id/status - Update order status (Admin only)
router.put('/:id/status', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      db.close();
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    db.close();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      ...order,
      items: JSON.parse(order.items || '[]'),
      shipping_address: JSON.parse(order.shipping_address || '{}')
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// DELETE /api/orders/:id - Delete order (Admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    
    if (!order) {
      db.close();
      return res.status(404).json({ error: 'Order not found' });
    }

    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    db.close();

    res.json({ message: 'Order deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;
