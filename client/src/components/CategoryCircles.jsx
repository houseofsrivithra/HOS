import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { CATEGORY_IMAGES } from '../api';
import './CategoryCircles.css';

const CATEGORIES = [
  { name: 'Sarees', slug: 'Sarees' },
  { name: 'Kurtas & Suits', slug: 'Kurtas & Suits' },
  { name: 'Lehengas', slug: 'Lehengas' },
  { name: 'Dresses', slug: 'Dresses' },
  { name: 'Men Ethnic', slug: 'Men Ethnic' },
  { name: 'Sherwani', slug: 'Sherwani' },
  { name: 'Accessories', slug: 'Accessories' },
];

export default function CategoryCircles() {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    }
  };

  return (
    <section className="category-circles section" id="category-circles">
      <div className="container">
        <div className="category-circles-wrapper">
          <button className="category-scroll-btn category-scroll-left" onClick={() => scroll(-1)} aria-label="Scroll left">
            <ChevronLeft size={20} />
          </button>
          
          <div className="category-circles-track" ref={scrollRef}>
            {CATEGORIES.map(cat => (
              <Link 
                to={`/shop?category=${encodeURIComponent(cat.slug)}`} 
                key={cat.slug} 
                className="category-circle-item"
              >
                <div className="category-circle-image">
                  <img src={CATEGORY_IMAGES[cat.name] || '/images/products/saree.png'} alt={cat.name} />
                </div>
                <span className="category-circle-name">{cat.name.toUpperCase()}</span>
                <span className="category-circle-explore">Explore</span>
              </Link>
            ))}
          </div>

          <button className="category-scroll-btn category-scroll-right" onClick={() => scroll(1)} aria-label="Scroll right">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
