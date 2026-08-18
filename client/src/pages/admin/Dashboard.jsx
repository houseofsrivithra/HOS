import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, DollarSign, Users, AlertTriangle, Clock, Download } from 'lucide-react';
import { apiGet, formatPrice, exportOrdersToExcel } from '../../api';
import './Admin.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const handleExportExcel = async () => {
    setExporting(true);
    setExportError('');
    try {
      await exportOrdersToExcel();
    } catch (err) {
      setExportError(err.message || 'Failed to export orders.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await apiGet('/dashboard/stats');
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div>
        <div className="admin-page-header">
          <div><h1 className="admin-page-title">Dashboard</h1></div>
        </div>
        <div className="admin-stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="admin-stat-card">
              <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 36, width: '40%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: 'badge-warning', confirmed: 'badge-info', processing: 'badge-info',
    shipped: 'badge-gold', delivered: 'badge-success', cancelled: 'badge-danger'
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Welcome back! Here's an overview of your store.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <Link to="/admin/products" className="btn btn-primary">
            <Package size={16} /> Add Product
          </Link>
        </div>
      </div>

      {exportError && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'rgba(196, 91, 91, 0.1)', border: '1px solid #C45B5B', borderRadius: '6px', color: '#C45B5B', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ {exportError}</span>
          <button onClick={() => setExportError('')} style={{ background: 'none', border: 'none', color: '#C45B5B', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}


      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon"><Package size={22} /></div>
          <p className="admin-stat-label">Total Products</p>
          <p className="admin-stat-value">{stats.totalProducts}</p>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon"><ShoppingCart size={22} /></div>
          <p className="admin-stat-label">Total Orders</p>
          <p className="admin-stat-value">{stats.totalOrders}</p>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon"><DollarSign size={22} /></div>
          <p className="admin-stat-label">Total Revenue</p>
          <p className="admin-stat-value">{formatPrice(stats.totalRevenue)}</p>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon"><Users size={22} /></div>
          <p className="admin-stat-label">Customers</p>
          <p className="admin-stat-value">{stats.totalCustomers}</p>
        </div>
      </div>

      {/* Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
        <div className="admin-stat-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(212, 168, 67, 0.15)', color: '#D4A843' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="admin-stat-label">Low Stock Items</p>
            <p className="admin-stat-value" style={{ fontSize: '1.5rem' }}>{stats.lowStockProducts}</p>
          </div>
          <Link to="/admin/inventory" style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--moss-green)' }}>View →</Link>
        </div>
        <div className="admin-stat-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(196, 91, 91, 0.1)', color: '#C45B5B' }}>
            <Clock size={22} />
          </div>
          <div>
            <p className="admin-stat-label">Pending Orders</p>
            <p className="admin-stat-value" style={{ fontSize: '1.5rem' }}>{stats.pendingOrders}</p>
          </div>
          <Link to="/admin/orders" style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--moss-green)' }}>View →</Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h3 className="admin-table-title">Recent Orders</h3>
          <Link to="/admin/orders" className="btn btn-outline btn-sm">View All</Link>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentOrders.map(order => (
              <tr key={order.id}>
                <td><strong>{order.order_number}</strong></td>
                <td>{order.user_name}</td>
                <td>{order.items.length} items</td>
                <td><strong>{formatPrice(order.total)}</strong></td>
                <td><span className={`badge ${statusColors[order.status]}`}>{order.status}</span></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Orders by Status */}
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h3 className="admin-table-title">Orders by Status</h3>
        </div>
        <div style={{ padding: 'var(--space-6)', display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          {stats.ordersByStatus.map(item => (
            <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${statusColors[item.status] || 'badge-info'}`}>{item.status}</span>
              <strong style={{ fontSize: '18px' }}>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
