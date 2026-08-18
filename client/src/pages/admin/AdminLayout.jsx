import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, FileText, Settings, LogOut, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const ADMIN_NAV = [
  { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
  { path: '/admin/products', icon: <Package size={20} />, label: 'Products' },
  { path: '/admin/orders', icon: <ShoppingCart size={20} />, label: 'Orders' },
  { path: '/admin/inventory', icon: <BarChart3 size={20} />, label: 'Inventory' },
  { path: '/admin/content', icon: <FileText size={20} />, label: 'Content' },
  { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar" id="admin-sidebar">
        <Link to="/admin" className="admin-sidebar-logo">
          <span className="admin-logo-icon">✦</span>
          <div>
            <span className="admin-logo-sub">House of</span>
            <span className="admin-logo-main">SRIVITHRA</span>
          </div>
        </Link>
        <span className="admin-badge">ADMIN</span>

        <nav className="admin-nav">
          {ADMIN_NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <Link to="/" className="admin-nav-link admin-view-store">
            <Store size={20} /> <span>View Store</span>
          </Link>
          <button className="admin-nav-link admin-logout" onClick={handleLogout}>
            <LogOut size={20} /> <span>Logout</span>
          </button>
          <div className="admin-user-info">
            <span className="admin-user-name">{user?.name || 'Admin'}</span>
            <span className="admin-user-email">{user?.email || ''}</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
