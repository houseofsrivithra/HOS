import { Link } from 'react-router-dom';
import { Globe, Star, Package, Headphones } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="site-footer">
      {/* Top trust bar */}
      <div className="footer-trust-bar">
        <div className="container">
          <div className="footer-trust-items">
            <div className="footer-trust-item">
              <Globe size={22} />
              <div>
                <strong>Worldwide Shipping</strong>
                <span>Across India</span>
              </div>
            </div>
            <div className="footer-trust-item">
              <Star size={22} />
              <div>
                <strong>Premium Quality</strong>
                <span>Finest Fabrics</span>
              </div>
            </div>
            <div className="footer-trust-item">
              <Package size={22} />
              <div>
                <strong>Secure Packaging</strong>
                <span>Safe Delivery</span>
              </div>
            </div>
            <div className="footer-trust-item">
              <Headphones size={22} />
              <div>
                <strong>24/7 Support</strong>
                <span>We're here to help</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar with credentials */}
      <div className="footer-credentials">
        <div className="container">
          <div className="footer-credentials-items">
            <div className="footer-credential">
              <span className="footer-credential-icon">✦</span>
              <strong>DISCOVER PREMIUM ETHNIC WEAR</strong>
            </div>
            <div className="footer-credential">
              <span className="footer-credential-icon">♥</span>
              <strong>TRUSTED BY 50K+ CUSTOMERS</strong>
            </div>
            <div className="footer-credential">
              <span className="footer-credential-icon">✋</span>
              <strong>CRAFTED WITH LOVE</strong>
              <span>MADE IN INDIA</span>
            </div>
            <div className="footer-credential">
              <span className="footer-credential-icon">↩</span>
              <strong>EASY RETURNS</strong>
              <span>7 DAYS RETURN POLICY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="footer-logo-icon">✦</span>
                <div>
                  <span className="footer-logo-sub">House of</span>
                  <span className="footer-logo-main">SRIVITHRA</span>
                </div>
              </div>
              <p className="footer-brand-desc">
                Premium ethnic wear that blends tradition with contemporary style. Crafted for celebrations, designed for you.
              </p>
              <div className="footer-social">
                <a href="https://www.instagram.com/house.of.srivithra?igsh=MWNlZXhpbWtlYzIwaw%3D%3D&utm_source=qr" className="footer-social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">IG</a>
                <a href="https://m.youtube.com/@HouseofSrivithra?ra=m" className="footer-social-link" aria-label="YouTube" target="_blank" rel="noopener noreferrer">YT</a>
              </div>
            </div>

            <div className="footer-links-group">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/shop">Shop All</Link></li>
                <li><Link to="/shop?new_arrivals=true">New Arrivals</Link></li>
                <li><Link to="/shop?best_sellers=true">Best Sellers</Link></li>
                <li><Link to="/shop?category=Sarees">Sarees</Link></li>
                <li><Link to="/shop?category=Lehengas">Lehengas</Link></li>
              </ul>
            </div>

            <div className="footer-links-group">
              <h4>Customer Care</h4>
              <ul>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">Shipping Policy</a></li>
                <li><a href="#">Returns & Exchanges</a></li>
                <li><a href="#">FAQs</a></li>
                <li><a href="#">Size Guide</a></li>
              </ul>
            </div>

            <div className="footer-links-group">
              <h4>Contact</h4>
              <ul>
                <li>📧 Houseofsrivithra@gmail.com</li>
                <li>📱 +91 98765 43210</li>
                <li>📍 Mumbai, Maharashtra, India</li>
                <li>⏰ Mon - Sat: 10AM - 7PM</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-copyright">
        <div className="container">
          <p>© 2024 House of Srivithra. All rights reserved.</p>
          <div className="footer-copyright-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
