import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'HOME', path: '/' },
  {
    label: 'WOMEN', path: '/shop?category=Sarees',
    subcategories: [
      { name: 'Sarees', path: '/shop?category=Sarees', description: 'Silk, Georgette, Banarasi & more' },
      { name: 'Kurtas & Suits', path: '/shop?category=Kurtas%20%26%20Suits', description: 'Embroidered, Printed & Designer' },
      { name: 'Lehengas', path: '/shop?category=Lehengas', description: 'Bridal, Party & Festive wear' },
      { name: 'Dresses', path: '/shop?category=Dresses', description: 'Indo-Western & Fusion styles' },
    ]
  },
  {
    label: 'MEN', path: '/shop?category=Men%20Ethnic',
    subcategories: [
      { name: 'Men Ethnic', path: '/shop?category=Men%20Ethnic', description: 'Kurtas, Nehru Jackets & more' },
      { name: 'Sherwani', path: '/shop?category=Sherwani', description: 'Wedding & Celebration wear' },
    ]
  },
  {
    label: 'NEW ARRIVALS', path: '/shop?new_arrivals=true',
    subcategories: [
      { name: 'New in Sarees', path: '/shop?new_arrivals=true&category=Sarees', description: 'Latest saree collections' },
      { name: 'New in Kurtas', path: '/shop?new_arrivals=true&category=Kurtas%20%26%20Suits', description: 'Fresh kurta arrivals' },
      { name: 'New in Lehengas', path: '/shop?new_arrivals=true&category=Lehengas', description: 'Newest lehenga designs' },
      { name: 'View All New', path: '/shop?new_arrivals=true', description: 'Browse all new arrivals' },
    ]
  },
  {
    label: 'SAREES', path: '/shop?category=Sarees',
    subcategories: [
      { name: 'All Sarees', path: '/shop?category=Sarees', description: 'Browse the full collection' },
      { name: 'Best Sellers', path: '/shop?category=Sarees&best_sellers=true', description: 'Most loved by our customers' },
      { name: 'New Arrivals', path: '/shop?category=Sarees&new_arrivals=true', description: 'Just added to our collection' },
      { name: 'Under ₹3000', path: '/shop?category=Sarees&max_price=3000', description: 'Affordable elegance' },
    ]
  },
  { label: 'CONTACT', path: '/contact' },
  {
    label: 'KURTAS & SUITS', path: '/shop?category=Kurtas%20%26%20Suits',
    subcategories: [
      { name: 'All Kurtas & Suits', path: '/shop?category=Kurtas%20%26%20Suits', description: 'Complete collection' },
      { name: 'Best Sellers', path: '/shop?category=Kurtas%20%26%20Suits&best_sellers=true', description: 'Customer favourites' },
      { name: 'New Arrivals', path: '/shop?category=Kurtas%20%26%20Suits&new_arrivals=true', description: 'Latest designs' },
    ]
  },
  {
    label: 'LEHENGAS', path: '/shop?category=Lehengas',
    subcategories: [
      { name: 'All Lehengas', path: '/shop?category=Lehengas', description: 'Full lehenga collection' },
      { name: 'Best Sellers', path: '/shop?category=Lehengas&best_sellers=true', description: 'Top picks' },
      { name: 'New Arrivals', path: '/shop?category=Lehengas&new_arrivals=true', description: 'Fresh designs' },
    ]
  },
  {
    label: 'ACCESSORIES', path: '/shop?category=Accessories',
    subcategories: [
      { name: 'All Accessories', path: '/shop?category=Accessories', description: 'Complete the look' },
      { name: 'New Arrivals', path: '/shop?category=Accessories&new_arrivals=true', description: 'Latest additions' },
    ]
  },
  {
    label: 'SALE', path: '/shop?sort=price_asc', className: 'nav-sale',
    subcategories: [
      { name: 'All Sale Items', path: '/shop?sort=price_asc', description: 'Shop all deals' },
      { name: 'Sarees on Sale', path: '/shop?category=Sarees&sort=price_asc', description: 'Sarees at best prices' },
      { name: 'Kurtas on Sale', path: '/shop?category=Kurtas%20%26%20Suits&sort=price_asc', description: 'Kurtas at best prices' },
      { name: 'Under ₹2000', path: '/shop?max_price=2000&sort=price_asc', description: 'Budget-friendly picks' },
    ]
  },
];

function NavLinkWithDropdown({ link, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  }, []);

  if (!link.subcategories) {
    return (
      <Link
        to={link.path}
        className={`navbar-link ${link.className || ''}`}
        onClick={onNavigate}
      >
        {link.label}
      </Link>
    );
  }

  return (
    <div
      className="navbar-link-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        to={link.path}
        className={`navbar-link has-dropdown ${link.className || ''} ${isOpen ? 'dropdown-active' : ''}`}
        onClick={onNavigate}
      >
        {link.label}
      </Link>
      <div className={`navbar-dropdown ${isOpen ? 'open' : ''}`}>
        <div className="navbar-dropdown-inner">
          <div className="navbar-dropdown-header">
            <span className="navbar-dropdown-title">{link.label}</span>
          </div>
          <div className="navbar-dropdown-items">
            {link.subcategories.map((sub) => (
              <Link
                key={sub.name}
                to={sub.path}
                className="navbar-dropdown-item"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate();
                }}
              >
                <div className="navbar-dropdown-item-content">
                  <span className="navbar-dropdown-item-name">{sub.name}</span>
                  <span className="navbar-dropdown-item-desc">{sub.description}</span>
                </div>
                <ChevronRight size={14} className="navbar-dropdown-item-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const closeMobileMenu = () => setMobileMenuOpen(false);

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
            <NavLinkWithDropdown key={link.label} link={link} onNavigate={closeMobileMenu} />
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
            <NavLinkWithDropdown key={link.label} link={link} onNavigate={closeMobileMenu} />
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
