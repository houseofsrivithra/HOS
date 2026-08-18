import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid3X3, LayoutList, X } from 'lucide-react';
import { apiGet } from '../api';
import ProductCard from '../components/ProductCard';
import './Shop.css';

const CATEGORIES = ['All', 'Sarees', 'Kurtas & Suits', 'Lehengas', 'Dresses', 'Men Ethnic', 'Sherwani', 'Accessories'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const newArrivals = searchParams.get('new_arrivals') || '';
  const bestSellers = searchParams.get('best_sellers') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let query = `/products?sort=${sort}&limit=50`;
        if (category && category !== 'All') query += `&category=${encodeURIComponent(category)}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        if (newArrivals) query += `&new_arrivals=true`;
        if (bestSellers) query += `&best_sellers=true`;
        if (minPrice) query += `&min_price=${minPrice}`;
        if (maxPrice) query += `&max_price=${maxPrice}`;

        const data = await apiGet(query);
        setProducts(data.products);
        setTotal(data.total);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category, search, sort, newArrivals, bestSellers, minPrice, maxPrice]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'All') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const pageTitle = search ? `Search: "${search}"` 
    : newArrivals ? 'New Arrivals' 
    : bestSellers ? 'Best Sellers' 
    : category ? category 
    : 'Shop All';

  return (
    <div className="shop-page">
      <div className="container">
        {/* Page header */}
        <div className="shop-header">
          <div>
            <h1 className="shop-title">{pageTitle}</h1>
            <p className="shop-count">{total} {total === 1 ? 'product' : 'products'}</p>
          </div>
          <div className="shop-controls">
            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="shop-sort-select"
              id="sort-select"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button 
              className="btn btn-outline btn-sm shop-filter-toggle"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>
        </div>

        <div className="shop-layout">
          {/* Sidebar filters */}
          <aside className={`shop-sidebar ${filtersOpen ? 'open' : ''}`}>
            <div className="shop-sidebar-header">
              <h3>Filters</h3>
              <button onClick={() => setFiltersOpen(false)} className="shop-sidebar-close">
                <X size={20} />
              </button>
            </div>

            {/* Category filter */}
            <div className="filter-group">
              <h4 className="filter-title">Category</h4>
              <div className="filter-options">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`filter-chip ${(category || 'All') === cat ? 'active' : ''}`}
                    onClick={() => updateFilter('category', cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range filter */}
            <div className="filter-group">
              <h4 className="filter-title">Price Range</h4>
              <div className="filter-price-inputs">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => updateFilter('min_price', e.target.value)}
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => updateFilter('max_price', e.target.value)}
                />
              </div>
              <div className="filter-price-presets">
                {[
                  { label: 'Under ₹2000', min: '', max: '2000' },
                  { label: '₹2000 - ₹5000', min: '2000', max: '5000' },
                  { label: '₹5000 - ₹10000', min: '5000', max: '10000' },
                  { label: 'Above ₹10000', min: '10000', max: '' },
                ].map(preset => (
                  <button
                    key={preset.label}
                    className="filter-preset-btn"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      if (preset.min) params.set('min_price', preset.min); else params.delete('min_price');
                      if (preset.max) params.set('max_price', preset.max); else params.delete('max_price');
                      setSearchParams(params);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick filters */}
            <div className="filter-group">
              <h4 className="filter-title">Quick Filters</h4>
              <div className="filter-options">
                <button
                  className={`filter-chip ${newArrivals ? 'active' : ''}`}
                  onClick={() => updateFilter('new_arrivals', newArrivals ? '' : 'true')}
                >
                  New Arrivals
                </button>
                <button
                  className={`filter-chip ${bestSellers ? 'active' : ''}`}
                  onClick={() => updateFilter('best_sellers', bestSellers ? '' : 'true')}
                >
                  Best Sellers
                </button>
              </div>
            </div>

            {(category || search || minPrice || maxPrice || newArrivals || bestSellers) && (
              <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ width: '100%', marginTop: 'var(--space-4)' }}>
                Clear All Filters
              </button>
            )}
          </aside>

          {/* Product grid */}
          <div className="shop-grid-area">
            {loading ? (
              <div className="shop-product-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="shop-skeleton-card">
                    <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: '8px' }} />
                    <div className="skeleton" style={{ height: '16px', marginTop: '12px', width: '70%' }} />
                    <div className="skeleton" style={{ height: '14px', marginTop: '6px', width: '40%' }} />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="shop-empty">
                <h3>No products found</h3>
                <p>Try adjusting your filters or search terms.</p>
                <button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
              </div>
            ) : (
              <div className="shop-product-grid">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
