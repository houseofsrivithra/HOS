const Database = require('better-sqlite3');
const db = new Database('./store.db');
db.pragma('journal_mode = WAL');

const upsert = db.prepare(`
  INSERT INTO site_content (section_key, title, subtitle, content)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(section_key) DO UPDATE SET
    title = excluded.title,
    subtitle = excluded.subtitle,
    content = excluded.content
`);

upsert.run(
  'announcement_bar',
  'Free Shipping on Orders above ₹1999',
  'Cash on Delivery Available',
  JSON.stringify({
    items: [
      'Free Shipping on Orders above ₹1999',
      'Cash on Delivery Available',
      'Authentic Ethnic Wear — Trusted by 10,000+ Customers'
    ]
  })
);

upsert.run(
  'hero',
  'Crafted for Every Celebration',
  'Timeless. Elegant. You.',
  JSON.stringify({
    description: 'Premium ethnic wear for women & men that blend tradition with contemporary style.',
    cta_text: 'SHOP COLLECTION',
    cta_link: '/shop'
  })
);

upsert.run(
  'trust_badges',
  '',
  '',
  JSON.stringify({
    badges: [
      { icon: 'gem', title: 'Premium Quality', subtitle: 'Finest Fabrics' },
      { icon: 'shield', title: 'Secure Payment', subtitle: '100% Safe & Secure' },
      { icon: 'refresh', title: 'Easy Returns', subtitle: '7 Days Hassle-Free' }
    ]
  })
);

upsert.run(
  'newsletter',
  'Stay in Style',
  '',
  JSON.stringify({
    description: 'Sign up for exclusive offers, new arrivals and style inspiration.',
    button_text: 'SUBSCRIBE'
  })
);

upsert.run(
  'promo_cards',
  '',
  '',
  JSON.stringify({
    cards: [
      { title: 'Lehengas That Speak Elegance', cta: 'EXPLORE NOW', link: '/shop?category=Lehengas' },
      { title: "Men's Ethnic Collection", cta: 'EXPLORE NOW', link: '/shop?category=Men Ethnic' }
    ]
  })
);

db.close();
console.log('Content seeded successfully!');
