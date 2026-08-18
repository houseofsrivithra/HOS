import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, Upload, ImageOff, Star, Sparkles, Info } from 'lucide-react';
import { apiGet, apiDelete, formatPrice, getProductImage, CATEGORY_IMAGES } from '../../api';
import './Admin.css';

const API_BASE = 'http://localhost:3001/api';
const CATEGORIES = ['Sarees', 'Kurtas & Suits', 'Lehengas', 'Dresses', 'Men Ethnic', 'Sherwani', 'Accessories'];
const emptyProduct = {
  name: '', description: '', short_description: '', price: '', original_price: '',
  category_name: 'Sarees', sku: '', sizes: '', colors: '', stock: '',
  featured: false, is_new_arrival: false, is_best_seller: false,
  material: '', care_instructions: '', images: '[]'
};

const TAB_ALL = 'all';
const TAB_NEW = 'new_arrivals';
const TAB_BEST = 'best_sellers';

async function apiMultipart(method, endpoint, formData) {
  const token = localStorage.getItem('auth_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function patchFlags(id, flags) {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/products/${id}/flags`, {
    method: 'PATCH', headers, body: JSON.stringify(flags)
  });
  if (!res.ok) throw new Error('Failed to update');
  return res.json();
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeTab, setActiveTab] = useState(TAB_ALL);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ ...emptyProduct });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = '/products?limit=100';
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (categoryFilter) query += `&category=${encodeURIComponent(categoryFilter)}`;
      if (activeTab === TAB_NEW) query += '&new_arrivals=true';
      if (activeTab === TAB_BEST) query += '&best_sellers=true';
      const data = await apiGet(query);
      setProducts(data.products);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [search, categoryFilter, activeTab]);

  const handleToggleFlag = async (product, flag) => {
    setTogglingId(`${product.id}-${flag}`);
    try {
      const updated = await patchFlags(product.id, { [flag]: !product[flag] });
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) { alert('Error: ' + err.message); }
    finally { setTogglingId(null); }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({ ...emptyProduct });
    setExistingImages([]);
    setNewFiles([]);
    setNewPreviews([]);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name, description: product.description, short_description: product.short_description,
      price: product.price, original_price: product.original_price || '',
      category_name: product.category_name, sku: product.sku,
      sizes: product.sizes.join(', '), colors: product.colors.join(', '),
      stock: product.stock, featured: !!product.featured,
      is_new_arrival: !!product.is_new_arrival, is_best_seller: !!product.is_best_seller,
      material: product.material, care_instructions: product.care_instructions,
      images: JSON.stringify(product.images)
    });
    setExistingImages(product.images || []);
    setNewFiles([]);
    setNewPreviews([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    newPreviews.forEach(url => URL.revokeObjectURL(url));
    setNewFiles([]);
    setNewPreviews([]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const totalAllowed = 5 - existingImages.length;
    const accepted = files.slice(0, Math.max(0, totalAllowed));
    const previews = accepted.map(f => URL.createObjectURL(f));
    setNewFiles(prev => [...prev, ...accepted].slice(0, totalAllowed));
    setNewPreviews(prev => [...prev, ...previews].slice(0, totalAllowed));
    e.target.value = '';
  };

  const removeExistingImage = (idx) => setExistingImages(prev => prev.filter((_, i) => i !== idx));
  const removeNewFile = (idx) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewFiles(prev => prev.filter((_, i) => i !== idx));
    setNewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description || '');
      fd.append('short_description', form.short_description || '');
      fd.append('price', parseFloat(form.price));
      fd.append('original_price', form.original_price ? parseFloat(form.original_price) : 0);
      fd.append('category_name', form.category_name);
      fd.append('sku', form.sku || '');
      fd.append('sizes', JSON.stringify(form.sizes.split(',').map(s => s.trim()).filter(Boolean)));
      fd.append('colors', JSON.stringify(form.colors.split(',').map(s => s.trim()).filter(Boolean)));
      fd.append('stock', parseInt(form.stock) || 0);
      fd.append('featured', form.featured);
      fd.append('is_new_arrival', form.is_new_arrival);
      fd.append('is_best_seller', form.is_best_seller);
      fd.append('material', form.material || '');
      fd.append('care_instructions', form.care_instructions || '');
      fd.append('images', JSON.stringify(existingImages));
      newFiles.forEach(file => fd.append('images', file));

      if (editingProduct) {
        await apiMultipart('PUT', `/products/${editingProduct.id}`, fd);
      } else {
        await apiMultipart('POST', `/products`, fd);
      }
      closeModal();
      fetchProducts();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try { await apiDelete(`/products/${id}`); fetchProducts(); }
    catch (err) { alert('Error: ' + err.message); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const totalImages = existingImages.length + newFiles.length;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-subtitle">{products.length} products shown</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} id="add-product-btn">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Home Page Info Banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
        background: 'rgba(126,140,84,0.10)', border: '1px solid rgba(126,140,84,0.25)',
        borderRadius: 10, marginBottom: 20, fontSize: 13, color: 'var(--charcoal-light)'
      }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--moss-green)' }} />
        <span>
          <strong style={{ color: 'var(--charcoal)' }}>Home Page Slides:</strong>{' '}
          Products marked <strong>✦ New Arrival</strong> appear in the <em>New Arrivals</em> carousel.
          Products marked <strong>★ Best Seller</strong> appear in the <em>Best Sellers</em> grid.
          Click the toggle pills in the table to update instantly, or use <strong>Edit</strong> to also change images and description.
        </span>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: TAB_ALL, label: 'All Products', color: 'var(--charcoal)' },
          { key: TAB_NEW, label: '✦ New Arrivals', color: 'var(--moss-green)' },
          { key: TAB_BEST, label: '★ Best Sellers', color: '#C8A96A' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: activeTab === tab.key ? tab.color : 'var(--sand-beige-light)',
            color: activeTab === tab.key ? '#fff' : 'var(--charcoal-light)',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & filter */}
      <div className="admin-search">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Products table */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Home Page Slides</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No products found.</td></tr>
            ) : products.map(product => {
              const imgUrl = product.images?.length > 0 ? getProductImage(product.images) : CATEGORY_IMAGES[product.category_name];
              return (
                <tr key={product.id}>
                  <td><img src={imgUrl} alt="" className="admin-table-img" /></td>
                  <td>
                    <strong style={{ display: 'block' }}>{product.name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{product.sku}</span>
                  </td>
                  <td>{product.category_name}</td>
                  <td>
                    <strong>{formatPrice(product.price)}</strong>
                    {product.original_price > product.price && (
                      <span style={{ display: 'block', fontSize: '11px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>{formatPrice(product.original_price)}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${product.stock < 10 ? 'badge-danger' : product.stock < 20 ? 'badge-warning' : 'badge-success'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <button
                        title="Toggle New Arrival — shows in New Arrivals carousel on Home"
                        disabled={togglingId === `${product.id}-is_new_arrival`}
                        onClick={() => handleToggleFlag(product, 'is_new_arrival')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                          background: product.is_new_arrival ? 'var(--moss-green)' : 'var(--sand-beige)',
                          color: product.is_new_arrival ? '#fff' : 'var(--charcoal-light)',
                          opacity: togglingId === `${product.id}-is_new_arrival` ? 0.5 : 1
                        }}
                      >
                        <Sparkles size={10} /> New Arrival
                      </button>
                      <button
                        title="Toggle Best Seller — shows in Best Sellers grid on Home"
                        disabled={togglingId === `${product.id}-is_best_seller`}
                        onClick={() => handleToggleFlag(product, 'is_best_seller')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                          background: product.is_best_seller ? '#C8A96A' : 'var(--sand-beige)',
                          color: product.is_best_seller ? '#fff' : 'var(--charcoal-light)',
                          opacity: togglingId === `${product.id}-is_best_seller` ? 0.5 : 1
                        }}
                      >
                        <Star size={10} /> Best Seller
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="admin-table-action edit" onClick={() => openEditModal(product)}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button className="admin-table-action delete" onClick={() => handleDelete(product.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal admin-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-modal-body">

                {/* IMAGE UPLOADER */}
                <div className="admin-image-section">
                  <label className="admin-image-section-label">
                    Product Images
                    <span className="admin-image-count">{totalImages}/5</span>
                  </label>
                  <div className="admin-image-grid">
                    {existingImages.map((url, idx) => (
                      <div key={`ex-${idx}`} className="admin-image-thumb">
                        <img src={url.startsWith('http') || url.startsWith('/images') ? url : `http://localhost:3001${url}`} alt={`Image ${idx + 1}`} />
                        <button type="button" className="admin-image-remove" onClick={() => removeExistingImage(idx)} title="Remove image"><X size={12} /></button>
                        {idx === 0 && <span className="admin-image-primary-badge">Main</span>}
                      </div>
                    ))}
                    {newPreviews.map((url, idx) => (
                      <div key={`new-${idx}`} className="admin-image-thumb admin-image-thumb-new">
                        <img src={url} alt={`New ${idx + 1}`} />
                        <button type="button" className="admin-image-remove" onClick={() => removeNewFile(idx)} title="Remove"><X size={12} /></button>
                        <span className="admin-image-new-badge">New</span>
                      </div>
                    ))}
                    {totalImages < 5 && (
                      <button type="button" className="admin-image-upload-btn" onClick={() => fileInputRef.current?.click()} title="Upload images">
                        <Upload size={20} />
                        <span>Upload</span>
                        <span className="admin-image-upload-hint">JPG, PNG, WEBP · max 5MB</span>
                      </button>
                    )}
                    {totalImages === 0 && (
                      <div className="admin-image-empty"><ImageOff size={28} /><span>No images yet</span></div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
                  <p className="admin-image-tip">Upload up to 5 images. The <strong>first image</strong> is shown as the main photo in the home page slides.</p>
                </div>

                {/* PRODUCT FIELDS */}
                <div className="admin-form-grid">
                  <div className="admin-form-group admin-form-full">
                    <label>Product Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Price (₹) *</label>
                    <input name="price" type="number" value={form.price} onChange={handleChange} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Original Price (₹)</label>
                    <input name="original_price" type="number" value={form.original_price} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group">
                    <label>Category</label>
                    <select name="category_name" value={form.category_name} onChange={handleChange}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>SKU</label>
                    <input name="sku" value={form.sku} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group admin-form-full">
                    <label>Short Description <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>(shown on product cards)</span></label>
                    <input name="short_description" value={form.short_description} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group admin-form-full">
                    <label>Full Description <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>(shown on product detail page)</span></label>
                    <textarea name="description" value={form.description} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group">
                    <label>Sizes (comma-separated)</label>
                    <input name="sizes" value={form.sizes} onChange={handleChange} placeholder="S, M, L, XL" />
                  </div>
                  <div className="admin-form-group">
                    <label>Colors (comma-separated)</label>
                    <input name="colors" value={form.colors} onChange={handleChange} placeholder="Red, Blue, Green" />
                  </div>
                  <div className="admin-form-group">
                    <label>Stock</label>
                    <input name="stock" type="number" value={form.stock} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group">
                    <label>Material</label>
                    <input name="material" value={form.material} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group admin-form-full">
                    <label>Care Instructions</label>
                    <input name="care_instructions" value={form.care_instructions} onChange={handleChange} />
                  </div>

                  {/* Home Page Slides */}
                  <div className="admin-form-group admin-form-full">
                    <label style={{ marginBottom: 10 }}>🏠 Show on Home Page Slides</label>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <label className="checkbox-row" style={{
                        background: form.is_new_arrival ? 'rgba(126,140,84,0.12)' : 'transparent',
                        padding: '8px 14px', borderRadius: 8, border: '1px solid var(--sand-beige)', cursor: 'pointer'
                      }}>
                        <input type="checkbox" name="is_new_arrival" checked={form.is_new_arrival} onChange={handleChange} />
                        <Sparkles size={14} style={{ color: 'var(--moss-green)' }} />
                        <strong>New Arrivals Carousel</strong>
                      </label>
                      <label className="checkbox-row" style={{
                        background: form.is_best_seller ? 'rgba(200,169,106,0.12)' : 'transparent',
                        padding: '8px 14px', borderRadius: 8, border: '1px solid var(--sand-beige)', cursor: 'pointer'
                      }}>
                        <input type="checkbox" name="is_best_seller" checked={form.is_best_seller} onChange={handleChange} />
                        <Star size={14} style={{ color: '#C8A96A' }} />
                        <strong>Best Sellers Grid</strong>
                      </label>
                      <label className="checkbox-row" style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--sand-beige)', cursor: 'pointer' }}>
                        <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
                        Featured
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
