import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, ChevronRight, Minus, Plus, Star } from 'lucide-react';
import { apiGet, formatPrice, getDiscount, getProductImage, CATEGORY_IMAGES } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const data = await apiGet(`/products/${id}`);
        setProduct(data.product);
        setRelated(data.related);
        if (data.product.sizes.length > 0) setSelectedSize(data.product.sizes[0]);
        if (data.product.colors.length > 0) setSelectedColor(data.product.colors[0]);
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const success = await addToCart(product.id, quantity, selectedSize, selectedColor);
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleWishlistToggle = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    toggleWishlist(product.id);
  };

  if (loading) {
    return (
      <div className="product-detail-page container">
        <div className="pd-layout">
          <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: '12px' }} />
          <div>
            <div className="skeleton" style={{ height: '32px', width: '70%', marginBottom: '16px' }} />
            <div className="skeleton" style={{ height: '24px', width: '40%', marginBottom: '24px' }} />
            <div className="skeleton" style={{ height: '100px', marginBottom: '16px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page container" style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Product not found</h2>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '20px' }}>Back to Shop</Link>
      </div>
    );
  }

  const discount = getDiscount(product.original_price, product.price);
  const imageUrl = product.images.length > 0 ? getProductImage(product.images) : CATEGORY_IMAGES[product.category_name] || '/images/products/saree.png';

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/shop">Shop</Link>
          <ChevronRight size={14} />
          <Link to={`/shop?category=${encodeURIComponent(product.category_name)}`}>{product.category_name}</Link>
          <ChevronRight size={14} />
          <span>{product.name}</span>
        </nav>

        <div className="pd-layout">
          {/* Image gallery */}
          <div className="pd-gallery">
            <div className="pd-main-image">
              <img src={imageUrl} alt={product.name} />
              {discount > 0 && <span className="pd-discount-badge">-{discount}% OFF</span>}
            </div>
          </div>

          {/* Product info */}
          <div className="pd-info">
            <p className="pd-category">{product.category_name}</p>
            <h1 className="pd-name">{product.name}</h1>
            
            <div className="pd-rating">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={16} fill={i <= 4 ? '#C8A96A' : 'none'} stroke="#C8A96A" />
              ))}
              <span>(4.2 / 5 · 128 reviews)</span>
            </div>

            <div className="pd-price-row">
              <span className="pd-price">{formatPrice(product.price)}</span>
              {discount > 0 && (
                <>
                  <span className="pd-original-price">{formatPrice(product.original_price)}</span>
                  <span className="pd-discount-text">{discount}% OFF</span>
                </>
              )}
            </div>
            <p className="pd-tax-note">Inclusive of all taxes</p>

            <p className="pd-short-desc">{product.short_description}</p>

            {/* Size selector */}
            {product.sizes.length > 0 && (
              <div className="pd-option-group">
                <label className="pd-option-label">Size: <strong>{selectedSize}</strong></label>
                <div className="pd-option-chips">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      className={`pd-chip ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color selector */}
            {product.colors.length > 0 && (
              <div className="pd-option-group">
                <label className="pd-option-label">Color: <strong>{selectedColor}</strong></label>
                <div className="pd-option-chips">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      className={`pd-chip ${selectedColor === color ? 'active' : ''}`}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="pd-option-group">
              <label className="pd-option-label">Quantity</label>
              <div className="pd-quantity">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} /></button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}><Plus size={16} /></button>
              </div>
            </div>

            {/* Stock status */}
            <p className={`pd-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
              {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
            </p>

            {/* Action buttons */}
            <div className="pd-actions">
              <button
                className={`btn ${addedToCart ? 'btn-primary' : 'btn-gold'} btn-lg pd-add-to-cart`}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                id="add-to-cart-btn"
              >
                <ShoppingBag size={18} />
                {addedToCart ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button
                className={`btn btn-outline btn-lg pd-wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}`}
                onClick={handleWishlistToggle}
                aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                id="wishlist-toggle-btn"
              >
                <Heart size={18} fill={isInWishlist(product.id) ? '#C45B5B' : 'none'} stroke={isInWishlist(product.id) ? '#C45B5B' : 'currentColor'} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="pd-trust-row">
              <div className="pd-trust-item"><Truck size={16} /> Fast Express Shipping</div>
              <div className="pd-trust-item"><RotateCcw size={16} /> Easy 7-Day Returns</div>
              <div className="pd-trust-item"><ShieldCheck size={16} /> Secure Payments</div>
            </div>
          </div>
        </div>

        {/* Description tabs */}
        <div className="pd-tabs">
          <div className="pd-tab-headers">
            <button className={`pd-tab-btn ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
            <button className={`pd-tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
            <button className={`pd-tab-btn ${activeTab === 'care' ? 'active' : ''}`} onClick={() => setActiveTab('care')}>Care</button>
          </div>
          <div className="pd-tab-content">
            {activeTab === 'description' && <p>{product.description}</p>}
            {activeTab === 'details' && (
              <div className="pd-details-grid">
                <div><strong>Material:</strong> {product.material || 'Premium Fabric'}</div>
                <div><strong>SKU:</strong> {product.sku}</div>
                <div><strong>Category:</strong> {product.category_name}</div>
                <div><strong>Available Sizes:</strong> {product.sizes.join(', ')}</div>
                <div><strong>Available Colors:</strong> {product.colors.join(', ')}</div>
              </div>
            )}
            {activeTab === 'care' && <p>{product.care_instructions || 'Please refer to the care label attached to the garment.'}</p>}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="pd-related section">
            <h2 className="section-title">You May Also Like</h2>
            <div className="pd-related-grid">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
