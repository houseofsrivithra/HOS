import { useState, useEffect } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { apiGet, apiPut, apiDelete, formatPrice, exportOrdersToExcel } from '../../api';
import './Admin.css';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColors = {
  pending: 'badge-warning', confirmed: 'badge-info', processing: 'badge-info',
  shipped: 'badge-gold', delivered: 'badge-success', cancelled: 'badge-danger'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = '/orders?limit=100';
      if (statusFilter) query += `&status=${statusFilter}`;
      const data = await apiGet(query);
      setOrders(data.orders);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await apiPut(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) { alert('Error: ' + err.message); }
  };

  const deleteOrder = async (orderId, orderNumber) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete order ${orderNumber || '#' + orderId}?\nThis action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await apiDelete(`/orders/${orderId}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      fetchOrders();
    } catch (err) {
      alert('Error deleting order: ' + err.message);
    }
  };

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

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Orders</h1>
          <p className="admin-page-subtitle">{orders.length} total orders</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={16} />
          {exporting ? 'Exporting...' : 'Export Orders to Excel'}
        </button>
      </div>

      {exportError && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'rgba(196, 91, 91, 0.1)', border: '1px solid #C45B5B', borderRadius: '6px', color: '#C45B5B', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ {exportError}</span>
          <button onClick={() => setExportError('')} style={{ background: 'none', border: 'none', color: '#C45B5B', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}


      <div className="admin-search">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 400px' : '1fr', gap: 'var(--space-6)' }}>
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ cursor: 'pointer', background: selectedOrder?.id === order.id ? 'rgba(126,140,84,0.05)' : '' }} onClick={() => setSelectedOrder(order)}>
                  <td><strong>{order.order_number}</strong></td>
                  <td>
                    <div>{order.user_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.user_email}</div>
                  </td>
                  <td>{order.items.length}</td>
                  <td><strong>{formatPrice(order.total)}</strong></td>
                  <td><span className={`badge ${statusColors[order.status]}`}>{order.status}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.value === 'delete') {
                          deleteOrder(order.id, order.order_number);
                        } else {
                          updateStatus(order.id, e.target.value);
                        }
                      }}
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: 12, padding: '4px 8px', width: 'auto' }}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      <option value="delete" style={{ color: '#ef4444', fontWeight: 'bold' }}>🗑️ Delete</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order detail panel */}
        {selectedOrder && (
          <div className="admin-table-card" style={{ position: 'sticky', top: 'var(--space-4)', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
            <div className="admin-table-header">
              <h3 className="admin-table-title">Order Detail</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ padding: 'var(--space-5)' }}>
              <p style={{ fontSize: 13, marginBottom: 4 }}><strong>Order:</strong> {selectedOrder.order_number}</p>
              <p style={{ fontSize: 13, marginBottom: 4 }}><strong>Customer:</strong> {selectedOrder.user_name}</p>
              <p style={{ fontSize: 13, marginBottom: 4 }}><strong>Email:</strong> {selectedOrder.user_email}</p>
              {selectedOrder.notes && (
                <div style={{ fontSize: 12, color: 'var(--charcoal-light)', marginBottom: 10, background: 'rgba(126,140,84,0.08)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(126,140,84,0.15)' }}>
                  <strong>Notes:</strong> {selectedOrder.notes}
                </div>
              )}
              <p style={{ fontSize: 13, marginBottom: 16 }}>
                <strong>Status:</strong> <span className={`badge ${statusColors[selectedOrder.status]}`}>{selectedOrder.status}</span>
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-accent)' }}>Items</h4>
              {selectedOrder.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--sand-beige-light)' }}>
                  <div>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {item.size && `Size: ${item.size}`} {item.color && `· Color: ${item.color}`} · Qty: {item.quantity}
                    </div>
                  </div>
                  <span>{formatPrice(item.total)}</span>
                </div>
              ))}

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '2px solid var(--sand-beige-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Subtotal</span><span>{formatPrice(selectedOrder.subtotal)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Shipping</span><span>{selectedOrder.shipping === 0 ? 'FREE' : formatPrice(selectedOrder.shipping)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Tax</span><span>{formatPrice(selectedOrder.tax)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--sand-beige-light)' }}><span>Total</span><span>{formatPrice(selectedOrder.total)}</span></div>
              </div>

              {selectedOrder.shipping_address?.address && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-accent)' }}>Shipping Address</h4>
                  <p style={{ fontSize: 13, color: 'var(--charcoal-light)', lineHeight: 1.6 }}>
                    {selectedOrder.shipping_address.name}<br />
                    {selectedOrder.shipping_address.address}<br />
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.pincode}<br />
                    {selectedOrder.shipping_address.phone}
                  </p>
                </div>
              )}

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--sand-beige-light)' }}>
                <button
                  type="button"
                  onClick={() => deleteOrder(selectedOrder.id, selectedOrder.order_number)}
                  className="btn"
                  style={{
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    fontWeight: 500
                  }}
                >
                  <Trash2 size={15} /> Delete Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
