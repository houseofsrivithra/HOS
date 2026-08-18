import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const user = await login(form.email, form.password);
        navigate(user.role === 'admin' ? '/admin' : '/');
      } else {
        await register(form.name, form.email, form.password, form.phone);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-tabs">
            <button className={`login-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)} id="tab-signin">Sign In</button>
            <button className={`login-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)} id="tab-register">Create Account</button>
          </div>

          {error && <div className="login-error" id="login-error-msg">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" id="register-name" />
              </div>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" id="login-email" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="login-password-wrapper">
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required placeholder="Enter password" id="login-password" minLength={6} />
                <button type="button" className="login-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {!isLogin && (
              <div className="form-group">
                <label>Phone (optional)</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" id="register-phone" />
              </div>
            )}
            <button type="submit" className="btn btn-gold btn-lg login-submit" disabled={loading} id="login-submit">
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>


          {/* Social login divider */}
          <div className="login-divider">
            <span>or continue with</span>
          </div>

          {/* Social login buttons */}
          <div className="login-social">
            <button
              type="button"
              className="login-social-btn login-social-google"
              id="google-login"
              onClick={() => window.location.href = 'http://localhost:3001/api/auth/google'}
            >
              <svg viewBox="0 0 24 24" className="login-social-icon" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

          </div>
        </div>

        <Link to="/" className="login-home-link">← Back to Store</Link>
      </div>
    </div>
  );
}
