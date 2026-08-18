import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'HOME', path: '/' },
  { label: 'WOMEN', path: '/shop?category=Sarees' },
  { label: 'MEN', path: '/shop?category=Men%20Ethnic' },
  { label: 'NEW ARRIVALS', path: '/shop?new_arrivals=true' },
  { label: 'SAREES', path: '/shop?category=Sarees' },
  { label: 'CONTACT', path: '/contact' },
  { label: 'KURTAS & SUITS', path: '/shop?category=Kurtas%20%26%20Suits' },
  { label: 'LEHENGAS', path: '/shop?category=Lehengas' },
  { label: 'ACCESSORIES', path: '/shop?category=Accessories' },
  { label: 'SALE', path: '/shop?sort=price_asc', className: 'nav-sale' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        {/* Mobile menu button */}
        <button className="navbar-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Nav links - left side */}
        <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
          {NAV_LINKS.slice(0, 6).map(link => (
            <Link
              key={link.label}
              to={link.path}
              className={`navbar-link ${link.className || ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Brand name - after CONTACT, acts as center divider */}
        <Link to="/" className="navbar-brand" id="brand-logo">
          <div className="navbar-logo-text">
            <span className="navbar-logo-sub">House of</span>
            <span className="navbar-logo-main">SRIVITHRA</span>
          </div>
        </Link>

        {/* Nav links - right side */}
        <div className={`navbar-links navbar-links-right ${mobileMenuOpen ? 'active' : ''}`}>
          {NAV_LINKS.slice(6).map(link => (
            <Link
              key={link.label}
              to={link.path}
              className={`navbar-link ${link.className || ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions - right */}
        <div className="navbar-actions">
          <button className="navbar-action" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search" id="search-toggle">
            <Search size={20} />
          </button>
          <Link to={user ? '/account' : '/login'} className="navbar-action" aria-label="Account" id="account-link">
            <User size={20} />
          </Link>
          <Link to="/wishlist" className="navbar-action navbar-wishlist" aria-label="Wishlist" id="wishlist-link">
            <Heart size={20} />
            {wishlistCount > 0 && <span className="navbar-cart-badge">{wishlistCount}</span>}
          </Link>
          <Link to="/cart" className="navbar-action navbar-cart" aria-label="Cart" id="cart-link">
            <ShoppingBag size={20} />
            {itemCount > 0 && <span className="navbar-cart-badge">{itemCount}</span>}
          </Link>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="navbar-search-overlay animate-fade-in">
          <form onSubmit={handleSearch} className="navbar-search-form">
            <Search size={20} className="navbar-search-icon" />
            <input
              type="text"
              placeholder="Search for sarees, lehengas, kurtas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              id="search-input"
            />
            <button type="button" onClick={() => setSearchOpen(false)} className="navbar-search-close">
              <X size={20} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="navbar-mobile-menu animate-slide-in" onClick={e => e.stopPropagation()}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                to={link.path}
                className="navbar-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
