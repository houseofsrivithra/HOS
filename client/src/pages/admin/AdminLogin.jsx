import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Lock, User, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  const { login, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after login
  const from = location.state?.from?.pathname || '/admin';

  useEffect(() => {
    // If user is already authenticated as admin, redirect to admin area
    if (user && user.role === 'admin') {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);

      if (loggedUser && loggedUser.role === 'admin') {
        navigate(from, { replace: true });
      } else {
        // If user logged in successfully but is NOT an admin
        logout();
        setError('Access denied: Account does not have admin privileges.');
      }
    } catch (err) {
      setError(err.message || 'Invalid User ID or Password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/reset-admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'Houseofsrivithra@gmail.com', newPassword: 'Hos@2025' })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccessMsg('Admin password has been reset to default: Hos@2025');
      setEmail('Houseofsrivithra@gmail.com');
      setPassword('Hos@2025');
      setShowResetModal(false);
    } catch (err) {
      setError(err.message || 'Error resetting password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-box">
        {/* Header Branding */}
        <div className="admin-login-header">
          <div className="admin-login-shield">
            <ShieldCheck size={32} />
          </div>
          <div className="admin-login-title-group">
            <span className="admin-login-sub">House of</span>
            <h1 className="admin-login-main">SRIVITHRA</h1>
          </div>
          <span className="admin-login-badge">ADMIN PORTAL</span>
        </div>

        {/* Form Container */}
        <div className="admin-login-card">
          <h2>Admin Authentication</h2>
          <p className="admin-login-subtitle">Enter your admin credentials to access the dashboard</p>

          {error && (
            <div className="admin-login-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="admin-login-field">
              <label htmlFor="admin-email">User ID / Email</label>
              <div className="admin-login-input-group">
                <User size={18} className="admin-login-icon" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Houseofsrivithra@gmail.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="admin-login-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="admin-password">Password</label>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c5a880',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Reset Admin Password?
                </button>
              </div>
              <div className="admin-login-input-group">
                <Lock size={18} className="admin-login-icon" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading}
              id="admin-login-submit-btn"
            >
              {loading ? (
                <span className="admin-login-spinner-text">
                  <span className="admin-btn-spinner"></span> Authenticating...
                </span>
              ) : (
                'Sign In to Admin Portal'
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="admin-login-footer">
          <Link to="/" className="admin-back-store-link">
            <ArrowLeft size={16} /> Return to Storefront
          </Link>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ background: '#14141c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="admin-modal-header" style={{ borderColor: '#2d2f42' }}>
              <h2 style={{ color: '#fff' }}>Reset Admin Password</h2>
              <button onClick={() => setShowResetModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Would you like to reset the admin password for <strong>Houseofsrivithra@gmail.com</strong> back to default (<strong>Hos@2025</strong>)?
              </p>
            </div>
            <div className="admin-modal-footer" style={{ borderColor: '#2d2f42' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowResetModal(false)}
                style={{ background: '#222433', color: '#d1d5db', border: 'none' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResetPassword}
                disabled={resetLoading}
                style={{ background: '#c5a880', color: '#0d0d12', border: 'none', fontWeight: 600 }}
              >
                {resetLoading ? 'Resetting...' : 'Confirm Reset to Hos@2025'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
