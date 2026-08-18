import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthCallback.css';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'error'

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      const messages = {
        google_cancelled: 'Google sign-in was cancelled.',
        google_failed:    'Google sign-in failed. Please try again.',
        apple_cancelled:  'Apple sign-in was cancelled.',
        apple_failed:     'Apple sign-in failed. Please try again.',
      };
      console.error('OAuth error:', error, messages[error]);
      setStatus('error');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!token) {
      setStatus('error');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Store token and refresh auth state
    localStorage.setItem('auth_token', token);
    checkAuth().then(() => {
      navigate('/');
    });
  }, [searchParams, checkAuth, navigate]);

  return (
    <div className="auth-callback-page">
      <div className="auth-callback-card">
        {status === 'loading' ? (
          <>
            <div className="auth-callback-spinner" />
            <p className="auth-callback-text">Signing you in…</p>
          </>
        ) : (
          <>
            <div className="auth-callback-error-icon">✕</div>
            <p className="auth-callback-text">Sign-in failed. Redirecting back…</p>
          </>
        )}
      </div>
    </div>
  );
}
