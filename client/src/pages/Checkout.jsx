import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, Truck, Banknote, ArrowLeft,
  CheckCircle, Lock, AlertCircle, Check, Smartphone, Copy, ClipboardCheck,
  CreditCard, Zap, Building2, Wallet
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiPost, formatPrice } from '../api';
import { loadRazorpayScript } from '../utils/razorpay';
import './Checkout.css';

// ── Store UPI details (for direct QR option) ────────────────────────────────
const STORE_UPI_ID = 'Houseofsrivithra@bob'; // Bank of Baroda UPI
const STORE_UPI_NAME = 'House of Srivithra';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [copied, setCopied] = useState(false);
  const [upiTxnId, setUpiTxnId] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '',
    payment_method: 'razorpay', // Razorpay default
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

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(STORE_UPI_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
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

  const handleContinueToPayment = () => {
    const error = validateShippingForm();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError('');
    setStep(2);
  };

  // ── Handle Razorpay Online Payment Flow ──────────────────────────────────
  const handleRazorpayPayment = async () => {
    const validationErr = validateShippingForm();
    if (validationErr) {
      setPaymentError(validationErr);
      return;
    }

    setLoading(true);
    setPaymentError('');

    try {
      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 2. Create Razorpay order on backend
      const orderPayload = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        shipping_address: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        user_name: form.name,
        user_email: form.email,
      };

      const razorpayOrder = await apiPost('/payment/create-order', orderPayload);

      if (!razorpayOrder || !razorpayOrder.razorpay_order_id) {
        throw new Error(razorpayOrder?.error || 'Failed to initialize payment order with gateway');
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: razorpayOrder.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'House of Srivithra',
        description: `Order Checkout (${items.length} ${items.length === 1 ? 'item' : 'items'})`,
        image: '/favicon.svg',
        order_id: razorpayOrder.razorpay_order_id,
        handler: async function (response) {
          try {
            setLoading(true);
            // 4. Verify payment signature on backend and persist confirmed order
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
              })),
              shipping_address: {
                name: form.name,
                phone: form.phone,
                address: form.address,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
              },
              user_name: form.name,
              user_email: form.email,
              notes: `Razorpay Payment ID: ${response.razorpay_payment_id}`,
            };

            const confirmedOrder = await apiPost('/payment/verify', verifyPayload);
            setOrderPlaced({
              ...confirmedOrder,
              payment_method: 'razorpay',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
            });
            await clearCart();
            setStep(3);
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            setPaymentError(
              verifyErr.message ||
              `Payment succeeded but order confirmation failed. Please contact support with Payment ID: ${response.razorpay_payment_id}`
            );
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        notes: {
          address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
          customer_name: form.name,
        },
        theme: {
          color: '#7E8C54', // House of Srivithra brand green
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
          escape: true,
          backdropclose: false,
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (failResponse) {
        setLoading(false);
        const reason = failResponse.error?.description || failResponse.error?.reason || 'Transaction could not be completed.';
        setPaymentError(`Payment failed: ${reason}`);
      });

      rzp.open();
    } catch (err) {
      console.error('Razorpay initialization error:', err);
      setPaymentError(err.message || 'Payment service error. Please try again or select another payment method.');
      setLoading(false);
    }
  };

  // ── Place order (Manual UPI / COD) ─────────────────────────────────────────
  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();

    if (form.payment_method === 'razorpay') {
      await handleRazorpayPayment();
      return;
    }

    // Validate UPI transaction ID if manual UPI selected
    if (form.payment_method === 'upi' && !upiTxnId.trim()) {
      setPaymentError('Please enter your UPI Transaction ID / UTR number after making the payment.');
      return;
    }

    setLoading(true);
    setPaymentError('');

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
        payment_method: form.payment_method,
        notes: form.payment_method === 'upi' ? `UPI Transaction ID: ${upiTxnId.trim()}` : '',
      };
      const order = await apiPost('/orders', orderData);
      setOrderPlaced({ ...order, upiTxnId: upiTxnId.trim() });
      await clearCart();
      setStep(3);
    } catch (err) {
      setPaymentError('Order failed: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  // ── Order Confirmation Screen ─────────────────────────────────────────────
  if (step === 3 && orderPlaced) {
    const isRazorpay = orderPlaced.payment_method === 'razorpay';
    const isUpi = orderPlaced.payment_method === 'upi';

    return (
      <div className="checkout-page container">
        <div className="checkout-success animate-fade-in-up">
          <div className="checkout-success-ring">
            <CheckCircle size={56} className="checkout-success-icon" />
          </div>

          <h1>
            {isRazorpay
              ? 'Payment Successful & Order Confirmed!'
              : isUpi
              ? 'Payment Received!'
              : 'Order Placed Successfully!'}
          </h1>

          <p className="checkout-success-order">Order #{orderPlaced.order_number}</p>

          {isRazorpay && orderPlaced.razorpay_payment_id && (
            <div className="checkout-payment-badge-group">
              <span className="checkout-payment-status-badge">
                <ShieldCheck size={14} /> Paid Online via Razorpay
              </span>
              <p className="checkout-payment-id">
                Razorpay Payment ID: <strong>{orderPlaced.razorpay_payment_id}</strong>
              </p>
            </div>
          )}

          {isUpi && orderPlaced.upiTxnId && (
            <p className="checkout-payment-id">
              UPI Transaction ID: <strong>{orderPlaced.upiTxnId}</strong>
            </p>
          )}

          <p>Thank you for shopping with House of Srivithra!</p>
          <p className="checkout-success-note">
            You'll receive a confirmation email at <strong>{form.email}</strong>
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
          <form className="checkout-form" onSubmit={handlePlaceOrder}>

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
                <h2 className="checkout-section-title">Select Payment Method</h2>

                <div className="checkout-payment-options">

                  {/* ── 1. Razorpay Gateway Option (Recommended) ── */}
                  <label
                    className={`payment-option ${form.payment_method === 'razorpay' ? 'active razorpay-active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, payment_method: 'razorpay' }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="razorpay"
                      checked={form.payment_method === 'razorpay'}
                      onChange={handleChange}
                    />
                    <div className="payment-option-icon razorpay-icon">
                      <CreditCard size={22} />
                    </div>
                    <div className="payment-option-content">
                      <div className="payment-option-header-row">
                        <strong>Razorpay Secure Online Payment</strong>
                        <span className="recommended-tag">RECOMMENDED</span>
                      </div>
                      <span>Cards, Instant UPI, Net Banking &amp; Wallets</span>
                      <div className="payment-method-badges">
                        <span className="payment-badge card-badge">Credit / Debit Cards</span>
                        <span className="payment-badge upi-badge">UPI (GPay · PhonePe · Paytm)</span>
                        <span className="payment-badge nb-badge">Net Banking (50+ Banks)</span>
                        <span className="payment-badge wallet-badge">Wallets</span>
                      </div>
                    </div>
                    {form.payment_method === 'razorpay' && (
                      <div className="payment-option-selected-badge razorpay-badge-selected">
                        <ShieldCheck size={14} /> 100% Instant &amp; Safe
                      </div>
                    )}
                  </label>

                  {/* ── 2. Direct UPI Option ── */}
                  <label
                    className={`payment-option ${form.payment_method === 'upi' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, payment_method: 'upi' }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="upi"
                      checked={form.payment_method === 'upi'}
                      onChange={handleChange}
                    />
                    <div className="payment-option-icon upi-icon">
                      <Smartphone size={22} />
                    </div>
                    <div className="payment-option-content">
                      <strong>Manual UPI Transfer (Scan QR Code)</strong>
                      <span>Pay directly to store UPI ID and enter reference UTR</span>
                      <div className="payment-method-badges">
                        <span className="payment-badge upi-badge">QR Code</span>
                        <span className="payment-badge gpay-badge">Bank of Baroda UPI</span>
                      </div>
                    </div>
                    {form.payment_method === 'upi' && (
                      <div className="payment-option-selected-badge">
                        <Smartphone size={14} /> Manual QR
                      </div>
                    )}
                  </label>

                  {/* ── 3. COD option ── */}
                  <label
                    className={`payment-option ${form.payment_method === 'cod' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, payment_method: 'cod' }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={form.payment_method === 'cod'}
                      onChange={handleChange}
                    />
                    <div className="payment-option-icon">
                      <Banknote size={22} />
                    </div>
                    <div className="payment-option-content">
                      <strong>Cash on Delivery (COD)</strong>
                      <span>Pay with cash when your package arrives at your door</span>
                    </div>
                    {form.payment_method === 'cod' && (
                      <div className="payment-option-selected-badge cod-badge">
                        <Truck size={14} /> Pay on Arrival
                      </div>
                    )}
                  </label>
                </div>

                {/* ── Razorpay Highlight Panel ── */}
                {form.payment_method === 'razorpay' && (
                  <div className="razorpay-feature-panel animate-fade-in">
                    <div className="razorpay-panel-header">
                      <ShieldCheck size={18} color="#7E8C54" />
                      <span>Razorpay Trusted Payment Gateway</span>
                    </div>
                    <div className="razorpay-features-grid">
                      <div className="razorpay-feature-item">
                        <Zap size={16} className="feature-icon" />
                        <div>
                          <strong>Instant Confirmation</strong>
                          <p>Order is immediately verified and sent to dispatch.</p>
                        </div>
                      </div>
                      <div className="razorpay-feature-item">
                        <CreditCard size={16} className="feature-icon" />
                        <div>
                          <strong>All Cards Accepted</strong>
                          <p>Visa, MasterCard, RuPay, Maestro &amp; Diners Club.</p>
                        </div>
                      </div>
                      <div className="razorpay-feature-item">
                        <Building2 size={16} className="feature-icon" />
                        <div>
                          <strong>Net Banking &amp; UPI</strong>
                          <p>SBI, HDFC, ICICI, Axis, Google Pay, PhonePe, Paytm.</p>
                        </div>
                      </div>
                      <div className="razorpay-feature-item">
                        <Lock size={16} className="feature-icon" />
                        <div>
                          <strong>PCI-DSS Compliant</strong>
                          <p>Bank-grade 256-bit encryption for complete peace of mind.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Manual UPI Payment Panel ── */}
                {form.payment_method === 'upi' && (
                  <div className="upi-payment-panel animate-fade-in">
                    <div className="upi-panel-header">
                      <Smartphone size={18} />
                      <span>Complete your UPI Payment</span>
                    </div>

                    <div className="upi-panel-body">
                      {/* QR Code */}
                      <div className="upi-qr-section">
                        <p className="upi-step-label">Step 1 — Scan QR Code</p>
                        <div className="upi-qr-wrapper">
                          <img
                            src="/upi-qr.jpg"
                            alt="UPI QR Code — House of Srivithra"
                            className="upi-qr-img"
                          />
                          <div className="upi-qr-amount">
                            Pay <strong>{formatPrice(grandTotal)}</strong>
                          </div>
                        </div>
                        <p className="upi-qr-hint">
                          Open any UPI app → Scan &amp; Pay → Enter amount <strong>{formatPrice(grandTotal)}</strong>
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="upi-divider"><span>OR</span></div>

                      {/* UPI ID copy */}
                      <div className="upi-id-section">
                        <p className="upi-step-label">Step 1 — Pay to UPI ID</p>
                        <div className="upi-id-box">
                          <div className="upi-id-details">
                            <span className="upi-id-label">UPI ID</span>
                            <span className="upi-id-value">{STORE_UPI_ID}</span>
                            <span className="upi-id-name">{STORE_UPI_NAME}</span>
                          </div>
                          <button
                            type="button"
                            className="upi-copy-btn"
                            onClick={handleCopyUPI}
                            title="Copy UPI ID"
                          >
                            {copied ? <ClipboardCheck size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Transaction ID input */}
                    <div className="upi-txn-section">
                      <p className="upi-step-label">Step 2 — Enter Transaction ID</p>
                      <p className="upi-txn-hint">
                        After payment, copy the <strong>UPI Transaction ID / UTR</strong> from your payment app and paste it below.
                      </p>
                      <div className="upi-txn-input-wrapper">
                        <input
                          id="upi-txn-id"
                          type="text"
                          value={upiTxnId}
                          onChange={e => { setUpiTxnId(e.target.value); setPaymentError(''); }}
                          placeholder="e.g. 425678901234 or UPI Ref No."
                          className="upi-txn-input"
                          autoComplete="off"
                        />
                      </div>
                      <div className="upi-txn-notice">
                        <Check size={14} color="#7E8C54" />
                        <span>Your order will be confirmed once we verify the transaction (usually within minutes).</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── COD benefits ── */}
                {form.payment_method === 'cod' && (
                  <div className="cod-benefits-panel animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#2e2e2e' }}>
                      <Check size={16} color="#7E8C54" />
                      <span><strong>No advance payment needed</strong> — inspect your order upon delivery.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#2e2e2e' }}>
                      <Check size={16} color="#7E8C54" />
                      <span><strong>Instant confirmation</strong> — you will receive an email order confirmation.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#2e2e2e' }}>
                      <Check size={16} color="#7E8C54" />
                      <span><strong>Easy 7-day hassle-free returns</strong> and exchanges available.</span>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {paymentError && (
                  <div className="payment-error" style={{ marginTop: '16px' }}>
                    <AlertCircle size={16} />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="checkout-nav-buttons" style={{ marginTop: '24px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
                  <button
                    id="place-order-btn"
                    type="submit"
                    className={`btn btn-gold btn-lg pay-now-btn ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="pay-spinner" />
                        {form.payment_method === 'razorpay' ? 'Opening Razorpay…' : 'Placing Order…'}
                      </>
                    ) : (
                      <>
                        {form.payment_method === 'razorpay' ? (
                          <><Zap size={16} /> Pay with Razorpay · {formatPrice(grandTotal)}</>
                        ) : form.payment_method === 'upi' ? (
                          <><Smartphone size={16} /> Confirm UPI Order · {formatPrice(grandTotal)}</>
                        ) : (
                          <><Truck size={16} /> Place Order · {formatPrice(grandTotal)}</>
                        )}
                      </>
                    )}
                  </button>
                </div>

                <p className="checkout-secure-note">
                  <Lock size={12} /> 256-bit SSL encrypted · Verified by Razorpay &amp; House of Srivithra
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
