const nodemailer = require('nodemailer');

const STORE_EMAIL = process.env.GMAIL_USER || 'houseofsrivithra@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'houseofsrivithra@gmail.com'; // All notifications go here

// Create transporter using Gmail
// Uses an App Password - set GMAIL_APP_PASSWORD env variable
function createTransporter() {
  const appPassword = process.env.GMAIL_APP_PASSWORD || '';
  if (!appPassword || appPassword === 'your_app_password_here') {
    throw new Error(
      'GMAIL_APP_PASSWORD is not configured. ' +
      'Go to Google Account -> Security -> App Passwords and generate one, ' +
      'then set it in server/.env as GMAIL_APP_PASSWORD=yourpassword'
    );
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: STORE_EMAIL,
      pass: appPassword
    }
  });
}

// Send contact form message to store admin
async function sendContactEmail({ name, email, phone, subject, message }) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"${name} via House of Srivithra" <${STORE_EMAIL}>`,
    to: ADMIN_EMAIL,
    replyTo: `"${name}" <${email}>`,
    subject: `[Contact Form] ${subject || 'New Enquiry'} - from ${name} (${email})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f6f1; border-radius: 10px; overflow: hidden; border: 1px solid #e8dfd0;">
        <div style="background: #7E8C54; padding: 28px 32px;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px;">House of Srivithra</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 14px;">New Customer Contact Message</p>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h3 style="font-size: 15px; color: #7E8C54; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0; margin-bottom: 16px;">Customer Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 140px; font-weight: 500;">Full Name:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #2e2e2e;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Email Address:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #2e2e2e;">
                <a href="mailto:${email}" style="color: #7E8C54; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Phone Number:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #2e2e2e;">${phone || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Subject:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #2e2e2e;">${subject || 'General Enquiry'}</td>
            </tr>
          </table>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <h3 style="font-size: 15px; color: #7E8C54; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Message Body</h3>
          <div style="background: #fdfcf9; border-left: 4px solid #7E8C54; padding: 16px; border-radius: 4px; color: #2e2e2e; line-height: 1.7; white-space: pre-wrap; font-size: 14px; border: 1px solid #f0ebe2; border-left: 4px solid #7E8C54;">
${message}
          </div>

          <div style="margin-top: 24px; padding: 12px; background: #f4f6ee; border-radius: 6px; font-size: 13px; color: #55603a;">
            💡 <strong>Tip:</strong> You can directly hit <em>Reply</em> in your email client to respond to <strong>${email}</strong>.
          </div>
          
          <p style="font-size: 12px; color: #999; margin-top: 24px; text-align: center;">
            Sent automatically from House of Srivithra Website Contact Form.
          </p>
        </div>
      </div>
    `
  });
}

// Send new order notification to store
async function sendOrderNotificationEmail(order) {
  const transporter = createTransporter();

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px 8px; border-bottom: 1px solid #f0ebe2;">${item.name}${item.size ? ` <span style="color:#888;font-size:12px;">(${item.size})</span>` : ''}${item.color ? ` <span style="color:#888;font-size:12px;">${item.color}</span>` : ''}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #f0ebe2; text-align:center;">${item.quantity}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #f0ebe2; text-align:right;">₹${Number(item.price).toLocaleString('en-IN')}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #f0ebe2; text-align:right; font-weight:600;">₹${Number(item.total).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const addr = order.shipping_address || {};
  const addressHtml = [addr.name, addr.phone, addr.line1, addr.line2, addr.city, addr.state, addr.pincode]
    .filter(Boolean).join(', ');

  await transporter.sendMail({
    from: `"House of Srivithra Orders" <${STORE_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `🛍️ New Order ${order.order_number} - ₹${Number(order.total).toLocaleString('en-IN')}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8f6f1; border-radius: 10px; overflow: hidden; border: 1px solid #e8dfd0;">
        <div style="background: #7E8C54; padding: 28px 32px;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px;">House of Srivithra</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 14px;">New Order Received</p>
        </div>
        <div style="padding: 32px; background: #ffffff;">

          <!-- Order summary strip -->
          <div style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
            <div style="background: #fdfcf9; border-radius: 8px; padding: 14px 20px; flex: 1; min-width: 140px; border: 1px solid #e8dfd0;">
              <p style="margin: 0; font-size: 12px; color: #888; letter-spacing: 0.5px;">ORDER NUMBER</p>
              <p style="margin: 4px 0 0; font-weight: 700; color: #7E8C54; font-size: 15px;">${order.order_number}</p>
            </div>
            <div style="background: #fdfcf9; border-radius: 8px; padding: 14px 20px; flex: 1; min-width: 140px; border: 1px solid #e8dfd0;">
              <p style="margin: 0; font-size: 12px; color: #888; letter-spacing: 0.5px;">ORDER TOTAL</p>
              <p style="margin: 4px 0 0; font-weight: 700; color: #2e2e2e; font-size: 15px;">₹${Number(order.total).toLocaleString('en-IN')}</p>
            </div>
            <div style="background: #fdfcf9; border-radius: 8px; padding: 14px 20px; flex: 1; min-width: 140px; border: 1px solid #e8dfd0;">
              <p style="margin: 0; font-size: 12px; color: #888; letter-spacing: 0.5px;">PAYMENT</p>
              <p style="margin: 4px 0 0; font-weight: 700; color: #2e2e2e; font-size: 15px;">${(order.payment_method || 'COD').toUpperCase()}</p>
            </div>
          </div>

          <!-- Customer details -->
          <h3 style="font-size: 14px; letter-spacing: 1px; color: #7E8C54; text-transform: uppercase; margin-bottom: 12px;">Customer Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <tr><td style="padding: 6px 0; color: #888; width: 130px;">Name</td><td style="padding: 6px 0; font-weight: 600; color: #2e2e2e;">${order.user_name || 'Guest'}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Email</td><td style="padding: 6px 0; color: #2e2e2e;"><a href="mailto:${order.user_email}" style="color: #7E8C54;">${order.user_email || '-'}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Shipping To</td><td style="padding: 6px 0; color: #2e2e2e;">${addressHtml || '-'}</td></tr>
          </table>

          <!-- Items table -->
          <h3 style="font-size: 14px; letter-spacing: 1px; color: #7E8C54; text-transform: uppercase; margin-bottom: 12px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #e8dfd0;">
                <th style="padding: 10px 8px; text-align: left; color: #2e2e2e;">Product</th>
                <th style="padding: 10px 8px; text-align: center; color: #2e2e2e;">Qty</th>
                <th style="padding: 10px 8px; text-align: right; color: #2e2e2e;">Price</th>
                <th style="padding: 10px 8px; text-align: right; color: #2e2e2e;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 16px;">
            <tr><td style="padding: 6px 0; color: #888;">Subtotal</td><td style="padding: 6px 0; text-align: right;">₹${Number(order.subtotal).toLocaleString('en-IN')}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Shipping</td><td style="padding: 6px 0; text-align: right;">${order.shipping === 0 ? 'FREE' : '₹' + Number(order.shipping).toLocaleString('en-IN')}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Tax (5%)</td><td style="padding: 6px 0; text-align: right;">₹${Number(order.tax).toLocaleString('en-IN')}</td></tr>
            <tr style="border-top: 2px solid #7E8C54;">
              <td style="padding: 10px 0; font-weight: 700; font-size: 16px;">Grand Total</td>
              <td style="padding: 10px 0; font-weight: 700; font-size: 16px; text-align: right; color: #7E8C54;">₹${Number(order.total).toLocaleString('en-IN')}</td>
            </tr>
          </table>

          ${order.notes ? `<div style="margin-top: 20px; padding: 14px; background: #fdfcf9; border-left: 4px solid #C8A96A; border-radius: 4px;"><p style="margin: 0; font-size: 13px; color: #888;">Customer Note</p><p style="margin: 6px 0 0; color: #2e2e2e;">${order.notes}</p></div>` : ''}

          <p style="font-size: 12px; color: #aaa; margin-top: 28px; border-top: 1px solid #e8dfd0; padding-top: 16px;">
            This email was automatically generated by the House of Srivithra order system.
          </p>
        </div>
      </div>
    `
  });
}

module.exports = { sendContactEmail, sendOrderNotificationEmail, STORE_EMAIL };
