import { useState, useEffect } from 'react';
import { AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { apiGet, apiPut, formatPrice } from '../../api';
import './Admin.css';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetch() {
      try {
        const data = await apiGet('/products?limit=100');
        setProducts(data.products);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  const updateStock = async (id, newStock) => {
    try {
      await apiPut(`/products/${id}`, { stock: newStock });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    } catch (err) { alert('Error: ' + err.message); }
  };

  const filtered = products.filter(p => {
    if (filter === 'low') return p.stock < 10 && p.stock > 0;
    if (filter === 'out') return p.stock === 0;
    if (filter === 'in') return p.stock >= 10;
    return true;
  });

  const lowStock = products.filter(p => p.stock < 10 && p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const inStock = products.filter(p => p.stock >= 10).length;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Inventory</h1>
          <p className="admin-page-subtitle">Manage stock levels for all products</p>
        </div>
      </div>

      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="admin-stat-card" onClick={() => setFilter('in')} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(90, 143, 90, 0.1)', color: 'var(--success)' }}><CheckCircle size={22} /></div>
          <p className="admin-stat-label">In Stock</p>
          <p className="admin-stat-value">{inStock}</p>
        </div>
        <div className="admin-stat-card" onClick={() => setFilter('low')} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(212, 168, 67, 0.15)', color: '#D4A843' }}><AlertTriangle size={22} /></div>
          <p className="admin-stat-label">Low Stock</p>
          <p className="admin-stat-value">{lowStock}</p>
        </div>
        <div className="admin-stat-card" onClick={() => setFilter('out')} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(196, 91, 91, 0.1)', color: 'var(--danger)' }}><Package size={22} /></div>
          <p className="admin-stat-label">Out of Stock</p>
          <p className="admin-stat-value">{outOfStock}</p>
        </div>
      </div>

      <div className="admin-search">
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
          <option value="all">All Products</option>
          <option value="in">In Stock (10+)</option>
          <option value="low">Low Stock (&lt;10)</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Current Stock</th>
              <th>Status</th>
              <th>Update Stock</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{product.sku}</div>
                </td>
                <td>{product.category_name}</td>
                <td>{formatPrice(product.price)}</td>
                <td>
                  <strong style={{ fontSize: 18 }}>{product.stock}</strong>
                </td>
                <td>
                  {product.stock === 0 && <span className="badge badge-danger">Out of Stock</span>}
                  {product.stock > 0 && product.stock < 10 && <span className="badge badge-warning">Low Stock</span>}
                  {product.stock >= 10 && <span className="badge badge-success">In Stock</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => updateStock(product.id, Math.max(0, product.stock - 1))}>-</button>
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => updateStock(product.id, parseInt(e.target.value) || 0)}
                      style={{ width: 70, textAlign: 'center', padding: '4px 8px' }}
                      min="0"
                    />
                    <button className="btn btn-outline btn-sm" onClick={() => updateStock(product.id, product.stock + 1)}>+</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
