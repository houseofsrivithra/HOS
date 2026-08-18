import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gem, ShieldCheck, RotateCcw } from 'lucide-react';
import { apiGet } from '../api';
import './HeroSection.css';

const DEFAULTS = {
  eyebrow: 'Timeless. Elegant. You.',
  title: 'Crafted for Every Celebration',
  description: 'Premium ethnic wear for women & men that blend tradition with contemporary style.',
  cta_text: 'SHOP COLLECTION',
  cta_link: '/shop',
  badges: [
    { icon: 'gem',     title: 'Premium Quality', subtitle: 'Finest Fabrics' },
    { icon: 'shield',  title: 'Secure Payment',  subtitle: '100% Safe & Secure' },
    { icon: 'refresh', title: 'Easy Returns',     subtitle: '7 Days Hassle-Free' },
  ],
  promo_cards: [
    { title: 'Lehengas That Speak Elegance', cta: 'EXPLORE NOW', link: '/shop?category=Lehengas',  img: '/images/products/lehenga.png',  alt: 'Lehenga collection',       cls: 'hero-promo-lehenga' },
    { title: "Men's Ethnic Collection",      cta: 'EXPLORE NOW', link: '/shop?category=Men Ethnic', img: '/images/products/sherwani.png', alt: "Men's ethnic collection", cls: 'hero-promo-men' },
  ],
};

function BadgeIcon({ icon }) {
  if (icon === 'shield') return <ShieldCheck size={20} />;
  if (icon === 'refresh') return <RotateCcw size={20} />;
  return <Gem size={20} />;
}

export default function HeroSection() {
  const [hero, setHero] = useState(null);
  const [promos, setPromos] = useState(null);
  const [badges, setBadges] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet('/content');
        if (data.hero) setHero(data.hero);
        if (data.promo_cards) setPromos(data.promo_cards);
        if (data.trust_badges) setBadges(data.trust_badges);
      } catch (e) { /* fall back to defaults silently */ }
    }
    load();
  }, []);

  const eyebrow   = hero?.subtitle   || DEFAULTS.eyebrow;
  const title     = hero?.title      || DEFAULTS.title;
  const desc      = hero?.content?.description || DEFAULTS.description;
  const ctaText   = hero?.content?.cta_text    || DEFAULTS.cta_text;
  const ctaLink   = hero?.content?.cta_link    || DEFAULTS.cta_link;
  const badgeList = badges?.content?.badges    || DEFAULTS.badges;
  const promoList = promos?.content?.cards     || DEFAULTS.promo_cards;

  return (
    <section className="hero" id="hero-section">
      <div className="hero-container">
        {/* Main hero area */}
        <div className="hero-main">
          <div className="hero-text animate-fade-in-up">
            <p className="hero-eyebrow">{eyebrow}</p>
            <h1 className="hero-title">{title}</h1>
            <p className="hero-description">{desc}</p>
            <Link to={ctaLink} className="btn btn-primary btn-lg hero-cta" id="hero-cta">
              {ctaText} <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-image">
            <img src="/images/hero/hero_main.png" alt="Premium ethnic wear collection" />
          </div>
        </div>

        {/* Side promo cards */}
        <div className="hero-sidebar">
          {promoList.map((card, i) => (
            <Link
              key={i}
              to={card.link || '/shop'}
              className={`hero-promo-card ${card.cls || (i === 0 ? 'hero-promo-lehenga' : 'hero-promo-men')}`}
            >
              <div className="hero-promo-overlay">
                <h3>{card.title}</h3>
                <span className="hero-promo-cta">{card.cta || 'EXPLORE NOW'} <ArrowRight size={14} /></span>
              </div>
              <img
                src={card.img || (i === 0 ? '/images/products/lehenga.png' : '/images/products/sherwani.png')}
                alt={card.alt || card.title}
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="hero-trust-badges">
        {badgeList.map((badge, i) => (
          <div className="trust-badge" key={i}>
            <BadgeIcon icon={badge.icon} />
            <div>
              <strong>{badge.title}</strong>
              <span>{badge.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
