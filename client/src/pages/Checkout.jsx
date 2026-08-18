import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, Truck, CreditCard, Banknote, ArrowLeft,
  CheckCircle, Smartphone, Lock, Zap, AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiPost, formatPrice } from '../api';
import './Checkout.css';

// Dynamically loads the Razorpay checkout script
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
  const [paymentError, setPaymentError] = useState('');
  const [validationError, setValidationError] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '',
    payment_method: 'razorpay',
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

  const shipping = total >= 1999 ? 0 : 99;
  const tax = Math.round(total * 0.05);
  const grandTotal = total + shipping + tax;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setPaymentError('');
    setValidationError('');
  };

  const handleContinueToPayment = () => {
    if (!form.name.trim()) {
      setValidationError('Please enter your full name');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setValidationError('Please enter a valid email address');
      return;
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      setValidationError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!form.address.trim()) {
      setValidationError('Please enter your street address');
      return;
    }
    if (!form.city.trim()) {
      setValidationError('Please enter your city');
      return;
    }
    if (!form.state.trim()) {
      setValidationError('Please enter your state');
      return;
    }
    if (!form.pincode.trim() || form.pincode.trim().length < 5) {
      setValidationError('Please enter a valid PIN code');
      return;
    }
    setValidationError('');
    setStep(2);
  };

  // ── COD flow ──────────────────────────────────────────────────────────────
  const handleCOD = async () => {
    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        user_name: form.name,
        user_email: form.email,
        shipping_address: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        payment_method: 'cod',
      };
      const order = await apiPost('/orders', orderData);
      setOrderPlaced(order);
      await clearCart();
      setStep(3);
    } catch (err) {
      setPaymentError('Order failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Razorpay flow ─────────────────────────────────────────────────────────
  const handleRazorpay = async () => {
    setLoading(true);
    setPaymentError('');

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Could not load Razorpay. Please check your internet connection.');
      }

      // 2. Create order on backend
      const orderPayload = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        user_name: form.name,
        user_email: form.email,
        shipping_address: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
      };

      const { razorpay_order_id, amount, currency, key_id } = await apiPost('/payment/create-order', orderPayload);

      // 3. Open Razorpay checkout popup
      await new Promise((resolve, reject) => {
        const options = {
          key: key_id,
          amount,
          currency,
          name: 'House of Srivithra',
          description: 'Fashion Store Purchase',
          image: '/favicon.ico',
          order_id: razorpay_order_id,
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone,
          },
          notes: {
            address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
          },
          theme: {
            color: '#7E8C54', // moss green — brand color
          },
          modal: {
            ondismiss: () => reject(new Error('Payment was cancelled.')),
          },
          handler: async (response) => {
            try {
              // 4. Verify signature on backend
              const verifyData = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                ...orderPayload,
              };

              const confirmedOrder = await apiPost('/payment/verify', verifyData);
              setOrderPlaced(confirmedOrder);
              await clearCart();
              setStep(3);
              resolve();
            } catch (verifyErr) {
              reject(verifyErr);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          reject(new Error(resp.error.description || 'Payment failed.'));
        });
        rzp.open();
      });

    } catch (err) {
      if (err.message !== 'Payment was cancelled.') {
        setPaymentError(err.message || 'Payment failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Form submit dispatcher ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.payment_method === 'cod') {
      await handleCOD();
    } else {
      await handleRazorpay();
    }
  };

  if (items.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  // ── Order Confirmation Screen ─────────────────────────────────────────────
  if (step === 3 && orderPlaced) {
    const isPaid = orderPlaced.payment_method === 'razorpay';
    return (
      <div className="checkout-page container">
        <div className="checkout-success animate-fade-in-up">
          <div className="checkout-success-ring">
            <CheckCircle size={56} className="checkout-success-icon" />
          </div>
          <h1>
            {isPaid ? 'Payment Successful!' : 'Order Placed Successfully!'}
          </h1>
          <p className="checkout-success-order">Order #{orderPlaced.order_number}</p>
          {isPaid && orderPlaced.razorpay_payment_id && (
            <p className="checkout-payment-id">
              Payment ID: <strong>{orderPlaced.razorpay_payment_id}</strong>
            </p>
          )}
          <p>Thank you for shopping with House of Srivithra!</p>
          <p className="checkout-success-note">
            You'll receive a confirmation email at <strong>{form.email}</strong>
          </p>
          <div className="checkout-success-actions">
            <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
            <Link to="/" className="btn btn-outline">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Checkout ─────────────────────────────────────────────────────────
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
            <span>Shipping</span>
          </div>
          <div className="checkout-step-line" />
          <div className={`checkout-step ${step >= 2 ? 'active' : ''}`}>
            <span className="checkout-step-num">2</span>
            <span>Payment</span>
          </div>
          <div className="checkout-step-line" />
          <div className={`checkout-step ${step >= 3 ? 'active' : ''}`}>
            <span className="checkout-step-num">3</span>
            <span>Confirmation</span>
          </div>
        </div>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>

            {/* ── Step 1: Shipping ── */}
            {step === 1 && (
              <div className="checkout-section animate-fade-in">
                <h2 className="checkout-section-title">Shipping Information</h2>
                <div className="checkout-form-grid">
                  <div className="form-group form-full">
                    <label>Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required placeholder="Enter your full name" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+91 9876543210" />
                  </div>
                  <div className="form-group form-full">
                    <label>Address *</label>
                    <input name="address" value={form.address} onChange={handleChange} required placeholder="Street address, apartment, etc." />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input name="city" value={form.city} onChange={handleChange} required placeholder="City" />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input name="state" value={form.state} onChange={handleChange} required placeholder="State" />
                  </div>
                  <div className="form-group">
                    <label>PIN Code *</label>
                    <input name="pincode" value={form.pincode} onChange={handleChange} required placeholder="PIN Code" />
                  </div>
                </div>
                {validationError && (
                  <div className="checkout-error-banner animate-fade-in" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', background: '#fee2e2', padding: '10px 16px', borderRadius: '8px', fontSize: '0.9rem' }}>
                    <AlertCircle size={18} />
                    <span>{validationError}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleContinueToPayment}
                  id="checkout-continue-payment-btn"
                  style={{ marginTop: '24px' }}
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {/* ── Step 2: Payment ── */}
            {step === 2 && (
              <div className="checkout-section animate-fade-in">
                <h2 className="checkout-section-title">Payment Method</h2>

                <div className="checkout-payment-options">

                  {/* ── Razorpay online payment option ── */}
                  <label className={`payment-option payment-option-razorpay ${form.payment_method === 'razorpay' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="razorpay"
                      checked={form.payment_method === 'razorpay'}
                      onChange={handleChange}
                    />
                    <div className="payment-option-icon razorpay-icon">
                      <Zap size={20} />
                    </div>
                    <div className="payment-option-content">
                      <strong>Pay Online</strong>
                      <span>UPI · Cards · Net Banking · Wallets</span>
                      <div className="payment-method-badges">
                        <span className="payment-badge upi-badge">UPI</span>
                        <span className="payment-badge gpay-badge">GPay</span>
                        <span className="payment-badge phonePe-badge">PhonePe</span>
                        <span className="payment-badge card-badge">
                          <CreditCard size={10} /> Cards
                        </span>
                        <span className="payment-badge nb-badge">Net Banking</span>
                      </div>
                    </div>
                    {form.payment_method === 'razorpay' && (
                      <div className="payment-option-selected-badge">
                        <ShieldCheck size={14} /> Secured by Razorpay
                      </div>
                    )}
                  </label>

                  {/* ── COD option ── */}
                  <label className={`payment-option ${form.payment_method === 'cod' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={form.payment_method === 'cod'}
                      onChange={handleChange}
                    />
                    <div className="payment-option-icon">
                      <Banknote size={20} />
                    </div>
                    <div className="payment-option-content">
                      <strong>Cash on Delivery</strong>
                      <span>Pay when your order arrives</span>
                    </div>
                    {form.payment_method === 'cod' && (
                      <div className="payment-option-selected-badge cod-badge">
                        <Truck size={14} /> Free delivery tracking
                      </div>
                    )}
                  </label>
                </div>

                {/* Error message */}
                {paymentError && (
                  <div className="payment-error">
                    <Lock size={14} />
                    {paymentError}
                  </div>
                )}

                <div className="checkout-nav-buttons">
                  <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
                  <button
                    id="pay-now-btn"
                    type="submit"
                    className={`btn btn-gold btn-lg pay-now-btn ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="pay-spinner" />
                        {form.payment_method === 'razorpay' ? 'Processing…' : 'Placing Order…'}
                      </>
                    ) : (
                      <>
                        {form.payment_method === 'razorpay' ? (
                          <><Zap size={16} /> Pay Now · {formatPrice(grandTotal)}</>
                        ) : (
                          <><Truck size={16} /> Place Order · {formatPrice(grandTotal)}</>
                        )}
                      </>
                    )}
                  </button>
                </div>

                <p className="checkout-secure-note">
                  <Lock size={12} /> 256-bit SSL encrypted · Your payment info is never stored on our servers
                </p>
              </div>
            )}
          </form>

          {/* ── Order Summary Sidebar ── */}
          <div className="checkout-summary">
            <div className="checkout-summary-card">
              <h3>Order Summary</h3>
              <div className="checkout-summary-items">
                {items.map(item => (
                  <div key={item.id} className="checkout-summary-item">
                    <span className="checkout-summary-item-name">{item.name} × {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="checkout-summary-row"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              <div className="checkout-summary-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
              <div className="checkout-summary-row"><span>Tax (GST 5%)</span><span>{formatPrice(tax)}</span></div>
              <div className="checkout-summary-total"><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
              <div className="checkout-trust">
                <ShieldCheck size={14} /> Secure checkout powered by 256-bit SSL
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
