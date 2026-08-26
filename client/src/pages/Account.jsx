import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiGet, formatPrice } from '../api';
import './Account.css';

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    async function fetchOrders() {
      try {
        const data = await apiGet('/orders');
        setOrders(data.orders || []);
      } catch (err) { console.error(err); }
    }
    fetchOrders();
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => { logout(); navigate('/'); };

  const statusColors = {
    pending: 'badge-warning', confirmed: 'badge-info', processing: 'badge-info',
    shipped: 'badge-gold', delivered: 'badge-success', cancelled: 'badge-danger'
  };

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-layout">
          <aside className="account-sidebar">
            <div className="account-user-info">
              <div className="account-avatar"><User size={24} /></div>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>
            <nav className="account-nav">
              <button className={`account-nav-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                <Package size={18} /> My Orders
              </button>
              <button className={`account-nav-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                <User size={18} /> Profile
              </button>
              {user.role === 'admin' && (
                <Link to="/admin" className="account-nav-link"><MapPin size={18} /> Admin Panel</Link>
              )}
              <button className="account-nav-link account-logout" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </button>
            </nav>
          </aside>

          <main className="account-content">
            {activeTab === 'orders' && (
              <div>
                <h2>My Orders</h2>
                {orders.length === 0 ? (
                  <div className="account-empty">
                    <p>No orders yet.</p>
                    <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="account-orders">
                    {orders.map(order => (
                      <div key={order.id} className="account-order-card">
                        <div className="account-order-header">
                          <div>
                            <span className="account-order-number">{order.order_number}</span>
                            <span className="account-order-date">
                              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <span className={`badge ${statusColors[order.status] || 'badge-info'}`}>{order.status}</span>
                        </div>
                        <div className="account-order-items">
                          {order.items.map((item, i) => (
                            <div key={i} className="account-order-item">
                              <span>{item.name} × {item.quantity}</span>
                              <span>{formatPrice(item.total)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="account-order-total">
                          <span>Total</span>
                          <strong>{formatPrice(order.total)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2>Profile</h2>
                <div className="account-profile-card">
                  <div className="account-profile-row"><strong>Name:</strong> {user.name}</div>
                  <div className="account-profile-row"><strong>Email:</strong> {user.email}</div>
                  <div className="account-profile-row"><strong>Phone:</strong> {user.phone || 'Not provided'}</div>
                  <div className="account-profile-row"><strong>Role:</strong> {user.role}</div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
