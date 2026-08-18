import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, getDiscount, getProductImage, CATEGORY_IMAGES } from '../api';
import './Wishlist.css';

export default function Wishlist() {
  const { wishlistItems, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="wishlist-page container">
        <div className="wishlist-empty animate-fade-in-up">
          <div className="wishlist-empty-icon">
            <Heart size={48} strokeWidth={1.5} />
          </div>
          <h2>Please Sign In to View Wishlist</h2>
          <p>Sign in to save your favorite ethnic outfits and access them across all your devices.</p>
          <Link to="/login" className="btn btn-primary btn-lg">
            Sign In / Register
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="wishlist-page container">
        <h1 className="wishlist-title">My Wishlist</h1>
        <div className="wishlist-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="wishlist-skeleton skeleton" style={{ height: '360px', borderRadius: '12px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-page container">
        <div className="wishlist-empty animate-fade-in-up">
          <div className="wishlist-empty-icon">
            <Heart size={48} strokeWidth={1.5} />
          </div>
          <h2>Your Wishlist is Empty</h2>
          <p>Explore our latest handcrafted sarees, lehengas, and ethnic ensembles to add items to your wishlist.</p>
          <Link to="/shop" className="btn btn-primary btn-lg">
            Explore Collections <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page container">
      <div className="wishlist-header">
        <div>
          <h1 className="wishlist-title">My Wishlist</h1>
          <p className="wishlist-subtitle">{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved</p>
        </div>
        <Link to="/shop" className="btn btn-outline btn-sm">
          Continue Shopping
        </Link>
      </div>

      <div className="wishlist-grid">
        {wishlistItems.map(item => {
          const discount = getDiscount(item.original_price, item.price);
          const imageUrl = item.images && item.images.length > 0
            ? getProductImage(item.images)
            : CATEGORY_IMAGES[item.category_name] || '/images/products/saree.png';

          return (
            <div key={item.product_id} className="wishlist-card animate-fade-in">
              <div className="wishlist-card-image-wrap">
                <Link to={`/product/${item.product_id}`}>
                  <img src={imageUrl} alt={item.name} className="wishlist-card-image" />
                </Link>
                <button
                  className="wishlist-card-remove"
                  onClick={() => removeFromWishlist(item.product_id)}
                  title="Remove from wishlist"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
                {discount > 0 && (
                  <span className="wishlist-card-badge">-{discount}%</span>
                )}
              </div>

              <div className="wishlist-card-content">
                <span className="wishlist-card-category">{item.category_name}</span>
                <h3 className="wishlist-card-name">
                  <Link to={`/product/${item.product_id}`}>{item.name}</Link>
                </h3>

                <div className="wishlist-card-price-row">
                  <span className="price">{formatPrice(item.price)}</span>
                  {discount > 0 && (
                    <span className="price-original">{formatPrice(item.original_price)}</span>
                  )}
                </div>

                <div className="wishlist-card-actions">
                  <button
                    className="btn btn-primary btn-sm wishlist-btn-cart"
                    onClick={() => addToCart(item.product_id, 1)}
                    disabled={item.stock === 0}
                  >
                    <ShoppingBag size={15} />
                    {item.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
