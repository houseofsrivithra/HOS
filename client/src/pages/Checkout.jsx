import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, Truck, ArrowLeft,
  CheckCircle, Lock, AlertCircle, Package
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiPost, formatPrice, calculateShipping } from '../api';
import './Checkout.css';

// Dynamically load the Razorpay checkout script
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Dynamic delivery charge based on address (Chennai: ₹99, Rest of TN: ₹149, Other states: ₹199)
  const shipping = calculateShipping(form);
  const tax = Math.round(total * 0.05);
  const grandTotal = total + shipping + tax;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setValidationError('');
  };

  const validateShippingForm = () => {
    if (!form.name.trim()) return 'Please enter your full name';
    if (!form.email.trim() || !form.email.includes('@')) return 'Please enter a valid email address';
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) return 'Please enter a valid 10-digit phone number';
    if (!form.address.trim()) return 'Please enter your street address';
    if (!form.city.trim()) return 'Please enter your city';
    if (!form.state.trim()) return 'Please enter your state';
    if (!form.pincode.trim() || form.pincode.trim().length < 5) return 'Please enter a valid PIN code';
    return '';
  };

  // ── Main payment handler — opens Razorpay popup ──────────────────────────
  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();

    const validationErr = validateShippingForm();
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay failed to load. Please check your internet connection.');
      }

      const shippingAddress = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      };

      // Step 2: Ask server to create a Razorpay order and get order_id
      const paymentOrder = await apiPost('/payment/create-order', {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        shipping_address: shippingAddress,
      });

      // Step 3: Open the Razorpay checkout popup
      const options = {
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'House of Srivithra',
        description: `Order of ${items.length} item(s)`,
        order_id: paymentOrder.razorpay_order_id,
        prefill: {
          name: form.name.trim(),
          email: form.email.trim(),
          contact: form.phone.trim(),
        },
        theme: {
          color: '#7E8C54',
        },
        // Step 4: On successful payment — verify with server and save order
        handler: async function (response) {
          try {
            const order = await apiPost('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
              })),
              user_name: form.name.trim(),
              user_email: form.email.trim(),
              shipping_address: {
                name: form.name.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                city: form.city.trim(),
                state: form.state.trim(),
                pincode: form.pincode.trim(),
              },
              notes: form.notes.trim(),
            });

            setOrderPlaced(order);
            await clearCart();
            setStep(2);
          } catch (verifyErr) {
            setError('Payment received but order confirmation failed: ' + (verifyErr.message || 'Please contact support.'));
          } finally {
            setLoading(false);
          }
        },
        modal: {
          // User closed the popup without paying
          ondismiss: function () {
            setLoading(false);
            setError('Payment was cancelled. You can try again.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setLoading(false);
        setError('Payment failed: ' + (response.error?.description || 'Please try again.'));
      });
      rzp.open();

    } catch (err) {
      setLoading(false);
      setError('Payment initiation failed: ' + (err.message || 'Please check your connection and try again.'));
    }
  };

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, orderPlaced, navigate]);

  if (items.length === 0 && !orderPlaced) {
    return null;
  }

  // ── Step 2: Order Confirmation Screen ─────────────────────────────────────
  if (step === 2 && orderPlaced) {
    return (
      <div className="checkout-page container">
        <div className="checkout-success animate-fade-in-up">
          <div className="checkout-success-ring">
            <CheckCircle size={56} className="checkout-success-icon" />
          </div>

          <h1>Payment Successful! 🎉</h1>
          <p className="checkout-success-order">Order #{orderPlaced.order_number}</p>

          <p>Thank you for shopping with House of Srivithra!</p>
          <p className="checkout-success-note">
            A confirmation email has been sent to <strong>{form.email}</strong>
          </p>

          <div className="checkout-success-actions">
            <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
            {user ? (
              <Link to="/account" className="btn btn-outline">View My Orders</Link>
            ) : (
              <Link to="/" className="btn btn-outline">Go Home</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Main Checkout & Shipping Form ────────────────────────────────
  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <Link to="/cart" className="checkout-back"><ArrowLeft size={18} /> Back to Cart</Link>
          <h1 className="checkout-title">Checkout</h1>
        </div>

        {/* Progress */}
        <div className="checkout-progress">
          <div className={`checkout-step ${step >= 1 ? 'active' : ''}`}>
            <span className="checkout-step-num">1</span>
            <span>Shipping &amp; Details</span>
          </div>
          <div className="checkout-step-line" />
          <div className={`checkout-step ${step >= 2 ? 'active' : ''}`}>
            <span className="checkout-step-num">2</span>
            <span>Confirmation</span>
          </div>
        </div>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handlePlaceOrder}>
            <div className="checkout-section animate-fade-in">
              <h2 className="checkout-section-title">Shipping Information</h2>
              <div className="checkout-form-grid">
                <div className="form-group form-full">
                  <label>Full Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 9876543210"
                  />
                </div>
                <div className="form-group form-full">
                  <label>Address *</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    placeholder="Street address, apartment, building, etc."
                  />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    placeholder="City"
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                    placeholder="State"
                  />
                </div>
                <div className="form-group">
                  <label>PIN Code *</label>
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    required
                    placeholder="PIN Code"
                  />
                </div>
                <div className="form-group form-full">
                  <label>Order Notes / Delivery Instructions (Optional)</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Any special instructions for delivery..."
                    className="form-textarea"
                  />
                </div>

                <div className="form-group form-full" style={{ marginTop: '4px' }}>
                  <div style={{
                    background: 'rgba(126, 140, 84, 0.08)',
                    border: '1px solid rgba(126, 140, 84, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--moss-green, #7E8C54)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Truck size={15} /> Delivery Charges:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', fontSize: '0.82rem', color: '#444' }}>
                      <span style={{ color: shipping === 99 ? '#556b2f' : 'inherit', fontWeight: shipping === 99 ? '700' : 'normal' }}>
                        • Inside Chennai: <strong>₹99</strong> {shipping === 99 && '✓'}
                      </span>
                      <span style={{ color: shipping === 149 ? '#556b2f' : 'inherit', fontWeight: shipping === 149 ? '700' : 'normal' }}>
                        • Rest of Tamil Nadu: <strong>₹149</strong> {shipping === 149 && '✓'}
                      </span>
                      <span style={{ color: shipping === 199 ? '#556b2f' : 'inherit', fontWeight: shipping === 199 ? '700' : 'normal' }}>
                        • Outside Tamil Nadu: <strong>₹199</strong> {shipping === 199 && '✓'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {validationError && (
                <div className="checkout-error-banner animate-fade-in" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', background: '#fee2e2', padding: '10px 16px', borderRadius: '8px', fontSize: '0.9rem' }}>
                  <AlertCircle size={18} />
                  <span>{validationError}</span>
                </div>
              )}

              {error && (
                <div className="checkout-error-banner animate-fade-in" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', background: '#fee2e2', padding: '10px 16px', borderRadius: '8px', fontSize: '0.9rem' }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="checkout-action-row" style={{ marginTop: '24px' }}>
                <button
                  id="place-order-btn"
                  type="submit"
                  className={`btn btn-primary btn-lg place-order-submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="pay-spinner" />
                      <span>Opening Payment…</span>
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      <span>Proceed to Pay · {formatPrice(grandTotal)}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="checkout-assurance-badges">
                <div className="assurance-item">
                  <Truck size={15} />
                  <span>Express Dispatch within 24-48 Hours</span>
                </div>
                <div className="assurance-item">
                  <ShieldCheck size={15} />
                  <span>100% Quality Guaranteed &amp; Inspected</span>
                </div>
                <div className="assurance-item">
                  <Lock size={15} />
                  <span>Secure Payment via Razorpay</span>
                </div>
              </div>
            </div>
          </form>

          {/* ── Order Summary Sidebar ── */}
          <div className="checkout-summary">
            <div className="checkout-summary-card">
              <h3>Order Summary</h3>
              <div className="checkout-summary-items">
                {items.map(item => (
                  <div key={`${item.product_id}-${item.size}-${item.color}`} className="checkout-summary-item">
                    <span className="checkout-summary-item-name">
                      {item.name} × {item.quantity}
                      {(item.size || item.color) && (
                        <span className="checkout-item-sub">
                          {[item.size, item.color].filter(Boolean).join(' / ')}
                        </span>
                      )}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="checkout-summary-row"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              <div className="checkout-summary-row">
                <span>
                  Shipping
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    {shipping === 99 ? '(Inside Chennai)' : shipping === 149 ? '(Tamil Nadu)' : '(Outside TN)'}
                  </span>
                </span>
                <span style={{ fontWeight: 600 }}>{formatPrice(shipping)}</span>
              </div>
              <div className="checkout-summary-row"><span>Tax (GST 5%)</span><span>{formatPrice(tax)}</span></div>
              <div className="checkout-summary-total"><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
              <div className="checkout-trust">
                <ShieldCheck size={14} /> Secured by Razorpay
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
