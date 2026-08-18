import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, getDiscount, getProductImage, CATEGORY_IMAGES } from '../api';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const isWished = isInWishlist(product.id);
  const discount = getDiscount(product.original_price, product.price);
  const imageUrl = product.images && product.images.length > 0 
    ? getProductImage(product.images) 
    : CATEGORY_IMAGES[product.category_name] || '/images/products/saree.png';

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    toggleWishlist(product.id);
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card" id={`product-${product.id}`}>
      <div className="product-card-image">
        {!imageLoaded && <div className="product-card-skeleton skeleton" />}
        <img
          src={imageUrl}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />
        
        <button
          className={`product-card-wishlist ${isWished ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={18} fill={isWished ? '#C45B5B' : 'none'} stroke={isWished ? '#C45B5B' : 'currentColor'} />
        </button>

        {discount > 0 && (
          <span className="product-card-discount-badge">-{discount}%</span>
        )}

        {product.is_new_arrival ? (
          <span className="product-card-new-badge">NEW</span>
        ) : null}
      </div>

      <div className="product-card-info">
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-price">
          <span className="price">{formatPrice(product.price)}</span>
          {discount > 0 && (
            <span className="price-original">{formatPrice(product.original_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

