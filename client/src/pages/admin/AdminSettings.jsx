import { useState } from 'react';
import { Shield, KeyRound, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

import { apiPut, apiPost } from '../../api';

export default function AdminSettings() {
  const { user } = useAuth();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);

    try {
      await apiPut('/auth/change-password', { currentPassword, newPassword });

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    setResetLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await apiPost('/auth/reset-admin-password', {
        email: user?.email || 'Houseofsrivithra@gmail.com',
        newPassword: 'Hos@2025'
      });

      setMessage({ type: 'success', text: 'Admin password has been reset to default: Hos@2025' });
      setShowConfirmReset(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="admin-settings-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admin Account & Security</h1>
          <p className="admin-page-subtitle">Manage admin credentials, update password, and access account security options</p>
        </div>
      </div>

      {message.text && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          background: message.type === 'success' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(196, 91, 91, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(46, 125, 50, 0.3)' : 'rgba(196, 91, 91, 0.3)'}`,
          color: message.type === 'success' ? '#2e7d32' : '#c45b5b'
        }}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Profile Details Card */}
        <div className="admin-table-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--sand-beige-light)', paddingBottom: '1rem' }}>
            <Shield size={24} style={{ color: 'var(--moss-green)' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', margin: 0 }}>Admin Profile</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Account Name
              </span>
              <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--charcoal)', margin: '0.2rem 0 0 0' }}>
                {user?.name || 'Admin'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Admin Email (Login ID)
              </span>
              <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--charcoal)', margin: '0.2rem 0 0 0' }}>
                {user?.email || 'Houseofsrivithra@gmail.com'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                System Role
              </span>
              <div style={{ marginTop: '0.2rem' }}>
                <span className="admin-badge" style={{ margin: 0 }}>SUPER ADMIN</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--ivory-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--sand-beige)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--charcoal-light)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>
                <RefreshCw size={14} /> Quick Reset Option
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0.5rem 0 1rem 0', lineHeight: 1.4 }}>
                If you need to reset the password back to default (<code>Hos@2025</code>), click the button below.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmReset(true)}
                style={{ width: '100%', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={14} /> Reset Password to Default (Hos@2025)
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="admin-table-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--sand-beige-light)', paddingBottom: '1rem' }}>
            <KeyRound size={24} style={{ color: 'var(--moss-green)' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', margin: 0 }}>Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="admin-form-group">
              <label htmlFor="current-pass">Current Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                <input
                  id="current-pass"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="new-pass">New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                <input
                  id="new-pass"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 chars)"
                  required
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="confirm-pass">Confirm New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                <input
                  id="confirm-pass"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Confirm Password Reset</h2>
              <button onClick={() => setShowConfirmReset(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--charcoal-light)', lineHeight: 1.5 }}>
                Are you sure you want to reset the admin password for <strong>Houseofsrivithra@gmail.com</strong> to <strong>Hos@2025</strong>?
              </p>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmReset(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleResetToDefault} disabled={resetLoading}>
                {resetLoading ? 'Resetting...' : 'Yes, Reset to Hos@2025'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
