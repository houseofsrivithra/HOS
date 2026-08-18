import { useState, useEffect } from 'react';
import { Truck, RotateCcw } from 'lucide-react';
import { apiGet } from '../api';
import './AnnouncementBar.css';

const DEFAULT_ITEMS = [
  'Free Shipping on Orders above ₹1999',
  'Cash on Delivery Available',
];

export default function AnnouncementBar() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    apiGet('/content/announcement_bar')
      .then(data => {
        const loaded = data?.content?.items;
        if (Array.isArray(loaded) && loaded.length > 0) setItems(loaded);
      })
      .catch(() => {});
  }, []);

  // Rotate messages every 4 seconds
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items]);

  return (
    <div className="announcement-bar">
      <div className="announcement-content">
        <div className="announcement-item">
          <Truck size={14} />
          <span className="announcement-rotating">{items[current]}</span>
        </div>
        <div className="announcement-divider">|</div>
        <div className="announcement-item">
          <RotateCcw size={14} />
          <span>Cash on Delivery Available</span>
        </div>
        <div className="announcement-right">
          <a href="/contact" className="announcement-link">Help &amp; Support</a>
        </div>
      </div>
    </div>
  );
}
