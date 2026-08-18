import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { apiGet, formatPrice, getProductImage, CATEGORY_IMAGES } from '../api';
import HeroSection from '../components/HeroSection';
import CategoryCircles from '../components/CategoryCircles';
import ProductCard from '../components/ProductCard';
import './Home.css';

export default function Home() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newsletter, setNewsletter] = useState({ title: 'Stay in Style', description: 'Sign up for exclusive offers, new arrivals and style inspiration.', button_text: 'SUBSCRIBE' });
  const [featuredDresses, setFeaturedDresses] = useState({ title: 'Featured Collection', subtitle: 'Handpicked styles for every occasion', dresses: [] });
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [newArr, best, siteContent, dressesContent] = await Promise.all([
          apiGet('/products?new_arrivals=true&limit=10'),
          apiGet('/products?best_sellers=true&limit=8'),
          apiGet('/content/newsletter').catch(() => null),
          apiGet('/content/featured_dresses').catch(() => null),
        ]);
        setNewArrivals(newArr.products);
        setBestSellers(best.products);
        if (siteContent?.title || siteContent?.content) {
          setNewsletter({
            title: siteContent.title || 'Stay in Style',
            description: siteContent.content?.description || 'Sign up for exclusive offers, new arrivals and style inspiration.',
            button_text: siteContent.content?.button_text || 'SUBSCRIBE',
          });
        }
        if (dressesContent) {
          setFeaturedDresses({
            title: dressesContent.title || 'Featured Collection',
            subtitle: dressesContent.subtitle || 'Handpicked styles for every occasion',
            dresses: dressesContent.content?.dresses || [],
          });
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <div className="home-page">
      <HeroSection />
      <CategoryCircles />

      {/* New Arrivals Section */}
      <section className="section home-new-arrivals" id="new-arrivals">
        <div className="container">
          <h2 className="section-title">New Arrivals</h2>
          
          <div className="carousel-wrapper">
            <button className="carousel-btn carousel-btn-left" onClick={() => scrollCarousel(-1)} aria-label="Previous">
              <ChevronLeft size={20} />
            </button>

            <div className="carousel-track" ref={carouselRef}>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="carousel-item">
                    <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: '8px' }} />
                    <div className="skeleton" style={{ height: '16px', marginTop: '12px', width: '70%' }} />
                    <div className="skeleton" style={{ height: '14px', marginTop: '6px', width: '40%' }} />
                  </div>
                ))
              ) : (
                newArrivals.map(product => (
                  <div key={product.id} className="carousel-item">
                    <ProductCard product={product} />
                  </div>
                ))
              )}
            </div>

            <button className="carousel-btn carousel-btn-right" onClick={() => scrollCarousel(1)} aria-label="Next">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Dresses Section */}
      {featuredDresses.dresses.length > 0 && (
        <section className="section home-featured-dresses" id="featured-dresses">
          <div className="container">
            <div className="featured-dresses-header">
              <h2 className="section-title">{featuredDresses.title}</h2>
              {featuredDresses.subtitle && (
                <p className="featured-dresses-subtitle">{featuredDresses.subtitle}</p>
              )}
            </div>
            <div className="featured-dresses-grid">
              {featuredDresses.dresses.map((dress, idx) => (
                <Link to={dress.link || '/shop'} key={dress.id || idx} className="featured-dress-card">
                  <div className="featured-dress-img-wrap">
                    <img
                      src={dress.image || '/images/products/saree.png'}
                      alt={dress.title}
                      className="featured-dress-img"
                      onError={e => { e.target.src = '/images/products/saree.png'; }}
                    />
                    {dress.badge && (
                      <span className="featured-dress-badge">{dress.badge}</span>
                    )}
                  </div>
                  <div className="featured-dress-info">
                    <h3 className="featured-dress-title">{dress.title}</h3>
                    <p className="featured-dress-desc">{dress.description}</p>
                    <span className="featured-dress-cta">Shop Now →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers + Newsletter Section */}
      <section className="section home-bottom-section">
        <div className="container">
          <div className="home-bottom-grid">
            {/* Best Sellers */}
            <div className="home-best-sellers" id="best-sellers">
              <div className="best-sellers-header">
                <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 0 }}>Best Sellers</h2>
                <Link to="/shop?best_sellers=true" className="best-sellers-view-all">VIEW ALL</Link>
              </div>
              <div className="best-sellers-grid">
                {bestSellers.slice(0, 4).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="home-newsletter" id="newsletter">
              <div className="newsletter-card">
                <h3 className="newsletter-title">{newsletter.title}</h3>
                <p className="newsletter-desc">{newsletter.description}</p>
                <form className="newsletter-form" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    id="newsletter-email"
                  />
                  <button type="submit" className="btn btn-gold newsletter-btn" id="newsletter-subscribe">
                    {newsletter.button_text}
                  </button>
                </form>
                {subscribed && (
                  <p className="newsletter-success animate-fade-in">✓ Thank you for subscribing!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
