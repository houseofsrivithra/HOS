const { getDb, initializeDatabase } = require('./schema');
const bcrypt = require('bcryptjs');

function seedDatabase() {
  initializeDatabase();
  const db = getDb();

  // Check if already seeded
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount > 0) {
    console.log('Database already seeded. Skipping...');
    db.close();
    return;
  }

  console.log('Seeding database...');

  // --- CATEGORIES ---
  const categories = [
    { name: 'Sarees', slug: 'sarees', display_order: 1 },
    { name: 'Kurtas & Suits', slug: 'kurtas-suits', display_order: 2 },
    { name: 'Lehengas', slug: 'lehengas', display_order: 3 },
    { name: 'Dresses', slug: 'dresses', display_order: 4 },
    { name: 'Men Ethnic', slug: 'men-ethnic', display_order: 5 },
    { name: 'Sherwani', slug: 'sherwani', display_order: 6 },
    { name: 'Accessories', slug: 'accessories', display_order: 7 },
  ];

  const insertCategory = db.prepare('INSERT INTO categories (name, slug, display_order) VALUES (?, ?, ?)');
  categories.forEach(c => insertCategory.run(c.name, c.slug, c.display_order));

  // --- PRODUCTS ---
  const products = [
    {
      name: 'Pure Georgette Saree',
      description: 'Elegant pure georgette saree with intricate golden zari border work. Perfect for weddings and festive occasions. Features a beautiful pallu with traditional motifs and comes with an unstitched blouse piece.',
      short_description: 'Elegant georgette saree with golden zari border',
      price: 2799,
      original_price: 4999,
      category_name: 'Sarees',
      sku: 'SAR-001',
      sizes: ['Free Size'],
      colors: ['Maroon', 'Navy Blue', 'Green'],
      stock: 25,
      featured: 1,
      is_new_arrival: 1,
      is_best_seller: 0,
      material: 'Pure Georgette',
      care_instructions: 'Dry clean only'
    },
    {
      name: 'Banarasi Silk Saree',
      description: 'Luxurious Banarasi silk saree handwoven by skilled artisans. Features traditional Mughal-inspired motifs with real gold zari work. A timeless piece for your ethnic wardrobe.',
      short_description: 'Handwoven Banarasi silk with gold zari work',
      price: 4899,
      original_price: 7999,
      category_name: 'Sarees',
      sku: 'SAR-002',
      sizes: ['Free Size'],
      colors: ['Red', 'Pink', 'Purple'],
      stock: 15,
      featured: 1,
      is_new_arrival: 0,
      is_best_seller: 1,
      material: 'Pure Banarasi Silk',
      care_instructions: 'Dry clean only'
    },
    {
      name: 'Embroidered Kurta Set',
      description: 'Stunning embroidered kurta set featuring delicate chikankari work on premium cotton fabric. Includes matching palazzo pants and dupatta. Ideal for casual gatherings and daily wear.',
      short_description: 'Chikankari embroidered cotton kurta with palazzo',
      price: 2299,
      original_price: 3499,
      category_name: 'Kurtas & Suits',
      sku: 'KUR-001',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Light Blue', 'Peach'],
      stock: 40,
      featured: 1,
      is_new_arrival: 1,
      is_best_seller: 0,
      material: 'Premium Cotton',
      care_instructions: 'Hand wash in cold water'
    },
    {
      name: 'Designer Lehenga',
      description: 'Show-stopping designer lehenga in rich velvet with heavy thread and sequin embroidery. The flared skirt features an intricate paisley pattern, paired with a matching choli and sheer dupatta with scattered sequins.',
      short_description: 'Heavy embroidered velvet lehenga with sequin work',
      price: 6499,
      original_price: 12999,
      category_name: 'Lehengas',
      sku: 'LEH-001',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Wine Red', 'Royal Blue', 'Emerald Green'],
      stock: 10,
      featured: 1,
      is_new_arrival: 1,
      is_best_seller: 1,
      material: 'Velvet with Net Dupatta',
      care_instructions: 'Dry clean only'
    },
    {
      name: 'Anarkali Suit Set',
      description: 'Graceful Anarkali suit set in flowing georgette with mirror and thread work. The floor-length silhouette creates a regal look perfect for festivals and celebrations. Includes matching churidar and dupatta.',
      short_description: 'Mirror work georgette Anarkali with churidar',
      price: 6499,
      original_price: 8999,
      category_name: 'Kurtas & Suits',
      sku: 'KUR-002',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Teal', 'Dusty Rose', 'Mustard'],
      stock: 20,
      featured: 0,
      is_new_arrival: 1,
      is_best_seller: 0,
      material: 'Faux Georgette',
      care_instructions: 'Dry clean recommended'
    },
    {
      name: 'Premium Sherwani',
      description: 'Regal premium sherwani crafted from rich jacquard fabric with intricate self-design patterns. Features mandarin collar, ornate buttons, and subtle embroidery. Perfect for groom wear and special occasions.',
      short_description: 'Jacquard sherwani with intricate self-design',
      price: 9999,
      original_price: 15999,
      category_name: 'Sherwani',
      sku: 'SHR-001',
      sizes: ['36', '38', '40', '42', '44'],
      colors: ['Ivory', 'Gold', 'Maroon'],
      stock: 12,
      featured: 1,
      is_new_arrival: 1,
      is_best_seller: 0,
      material: 'Jacquard Silk',
      care_instructions: 'Dry clean only'
    },
    {
      name: 'Printed Kurta Set',
      description: 'Trendy printed kurta set with abstract geometric patterns. Made from breathable rayon fabric, this comfortable set includes a straight-cut kurta and matching pants. Great for office and casual wear.',
      short_description: 'Geometric printed rayon kurta with pants',
      price: 1899,
      original_price: 2499,
      category_name: 'Kurtas & Suits',
      sku: 'KUR-003',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Blue', 'Rust', 'Olive'],
      stock: 50,
      featured: 0,
      is_new_arrival: 1,
      is_best_seller: 0,
      material: 'Rayon',
      care_instructions: 'Machine wash cold'
    },
    {
      name: 'Cotton Kurta Set',
      description: 'Classic cotton kurta set with traditional block print design. Lightweight and comfortable, this everyday essential features side slits and a relaxed fit. Includes matching cotton trousers.',
      short_description: 'Block printed cotton kurta set',
      price: 1999,
      original_price: 2999,
      category_name: 'Kurtas & Suits',
      sku: 'KUR-004',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Indigo', 'Rust', 'Sage Green'],
      stock: 35,
      featured: 0,
      is_new_arrival: 0,
      is_best_seller: 1,
      material: 'Pure Cotton',
      care_instructions: 'Hand wash or machine wash cold'
    },
    {
      name: 'Embroidered Sherwani',
      description: 'Exquisitely embroidered sherwani with heavy bullion and zardozi work. This masterpiece features a classic straight cut with side slits, ornamental buttons, and a rich inner lining. A showstopper for weddings.',
      short_description: 'Heavy zardozi embroidered wedding sherwani',
      price: 8999,
      original_price: 18999,
      category_name: 'Sherwani',
      sku: 'SHR-002',
      sizes: ['36', '38', '40', '42', '44'],
      colors: ['Champagne', 'Navy', 'Black'],
      stock: 8,
      featured: 1,
      is_new_arrival: 0,
      is_best_seller: 1,
      material: 'Raw Silk with Zardozi',
      care_instructions: 'Dry clean only'
    },
    {
      name: 'Silk Saree Collection',
      description: 'Premium Kanjivaram-style silk saree with contrast border and pallu. Woven with pure mulberry silk, this saree features traditional temple border designs and a rich, lustrous finish.',
      short_description: 'Kanjivaram-style pure silk saree',
      price: 5499,
      original_price: 8999,
      category_name: 'Sarees',
      sku: 'SAR-003',
      sizes: ['Free Size'],
      colors: ['Magenta', 'Royal Blue', 'Golden Yellow'],
      stock: 18,
      featured: 0,
      is_new_arrival: 0,
      is_best_seller: 1,
      material: 'Pure Mulberry Silk',
      care_instructions: 'Dry clean only'
    },
    {
      name: 'Bridal Lehenga Set',
      description: 'Magnificent bridal lehenga set featuring heavy hand-embroidered motifs with zari, sequins, and stones. The voluminous flared skirt, detailed blouse, and heavy dupatta make this a perfect bridal ensemble.',
      short_description: 'Heavy bridal lehenga with zari and stone work',
      price: 15999,
      original_price: 29999,
      category_name: 'Lehengas',
      sku: 'LEH-002',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Maroon', 'Pink'],
      stock: 5,
      featured: 1,
      is_new_arrival: 0,
      is_best_seller: 1,
      material: 'Velvet and Net',
      care_instructions: 'Dry clean only, store in muslin cloth'
    },
    {
      name: 'Festive Lehenga Choli',
      description: 'Beautiful festive lehenga choli with mirror work and gota patti embellishments. The A-line skirt features a gorgeous flare, while the crop-top style choli adds a modern touch. Comes with a matching dupatta.',
      short_description: 'Mirror work festive lehenga with gota patti',
      price: 4999,
      original_price: 7499,
      category_name: 'Lehengas',
      sku: 'LEH-003',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Coral', 'Turquoise', 'Lavender'],
      stock: 15,
      featured: 0,
      is_new_arrival: 1,
      is_best_seller: 0,
      material: 'Georgette with Mirror Work',
      care_instructions: 'Dry clean only'
    },
    {
      name: 'Men\'s Nehru Jacket',
      description: 'Sophisticated Nehru jacket in premium cotton silk blend. Features a mandarin collar, front button closure, and subtle self-design pattern. Versatile enough to pair with kurta or shirt for various occasions.',
      short_description: 'Premium cotton silk Nehru jacket',
      price: 2499,
      original_price: 3999,
      category_name: 'Men Ethnic',
      sku: 'MEN-001',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Navy', 'Maroon', 'Olive'],
      stock: 30,
      featured: 0,
      is_new_arrival: 1,
      is_best_seller: 0,
      material: 'Cotton Silk Blend',
      care_instructions: 'Dry clean or hand wash'
    },
    {
      name: 'Men\'s Kurta Pajama Set',
      description: 'Classic men\'s kurta pajama set in premium cotton with subtle embroidery on the neckline and placket. The comfortable straight-cut kurta pairs perfectly with the matching pajama for a complete ethnic look.',
      short_description: 'Embroidered cotton kurta pajama for men',
      price: 1799,
      original_price: 2999,
      category_name: 'Men Ethnic',
      sku: 'MEN-002',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Light Pink', 'Sky Blue'],
      stock: 45,
      featured: 0,
      is_new_arrival: 0,
      is_best_seller: 1,
      material: 'Premium Cotton',
      care_instructions: 'Machine wash cold'
    },
    {
      name: 'Embellished Clutch Bag',
      description: 'Stunning hand-embellished clutch bag with intricate bead work and sequin detailing. Features a removable chain strap, satin lining, and magnetic closure. The perfect accessory for weddings and parties.',
      short_description: 'Hand-embellished beaded clutch bag',
      price: 999,
      original_price: 1999,
      category_name: 'Accessories',
      sku: 'ACC-001',
      sizes: ['One Size'],
      colors: ['Gold', 'Silver', 'Rose Gold'],
      stock: 60,
      featured: 0,
      is_new_arrival: 1,
      is_best_seller: 0,
      material: 'Satin with Bead Work',
      care_instructions: 'Wipe with soft cloth'
    },
    {
      name: 'Kundan Jewelry Set',
      description: 'Exquisite Kundan jewelry set including a statement necklace, matching earrings, and maang tikka. Crafted with high-quality kundan stones set in gold-plated metal, this set elevates any ethnic outfit.',
      short_description: 'Kundan necklace set with earrings and maang tikka',
      price: 1499,
      original_price: 2999,
      category_name: 'Accessories',
      sku: 'ACC-002',
      sizes: ['One Size'],
      colors: ['Gold-Red', 'Gold-Green', 'Gold-White'],
      stock: 40,
      featured: 1,
      is_new_arrival: 0,
      is_best_seller: 1,
      material: 'Gold-plated Kundan',
      care_instructions: 'Store in airtight pouch, avoid perfume contact'
    },
    {
      name: 'Chiffon Party Dress',
      description: 'Elegant chiffon party dress with a flattering A-line silhouette. Features delicate ruffle detailing, a V-neckline, and flowing layers that move beautifully. Perfect for cocktail parties and evening events.',
      short_description: 'Ruffle detail chiffon A-line party dress',
      price: 3299,
      original_price: 5499,
      category_name: 'Dresses',
      sku: 'DRS-001',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Blush', 'Black', 'Sage Green'],
      stock: 20,
      featured: 0,
      is_new_arrival: 1,
      is_best_seller: 0,
      material: 'Premium Chiffon',
      care_instructions: 'Hand wash cold or dry clean'
    },
    {
      name: 'Palazzo Kurta Set',
      description: 'Trendy palazzo kurta set with contemporary floral prints. The straight-cut kurta features a round neck with tassel details, paired with wide-leg palazzo pants and a light dupatta for a breezy ethnic look.',
      short_description: 'Floral printed kurta with palazzo and dupatta',
      price: 2599,
      original_price: 3999,
      category_name: 'Kurtas & Suits',
      sku: 'KUR-005',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Yellow', 'Pink', 'Blue'],
      stock: 30,
      featured: 0,
      is_new_arrival: 1,
      is_best_seller: 0,
      material: 'Rayon',
      care_instructions: 'Hand wash cold'
    },
    {
      name: 'Men\'s Pathani Suit',
      description: 'Traditional Pathani suit in premium linen cotton blend. Features a clean, minimalist design with a mandarin collar and subtle pintuck detailing. Comfortable and breathable for all-day wear.',
      short_description: 'Linen cotton Pathani suit with pintuck detail',
      price: 2199,
      original_price: 3499,
      category_name: 'Men Ethnic',
      sku: 'MEN-003',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Black', 'Beige'],
      stock: 25,
      featured: 0,
      is_new_arrival: 0,
      is_best_seller: 0,
      material: 'Linen Cotton',
      care_instructions: 'Machine wash cold'
    },
    {
      name: 'Organza Saree',
      description: 'Ethereal organza saree with beautiful floral print and scallop embroidered border. The sheer, lightweight fabric drapes gracefully, making it ideal for summer celebrations and daytime events.',
      short_description: 'Floral print organza saree with embroidered border',
      price: 3499,
      original_price: 5999,
      category_name: 'Sarees',
      sku: 'SAR-004',
      sizes: ['Free Size'],
      colors: ['Pastel Pink', 'Mint Green', 'Lavender'],
      stock: 22,
      featured: 0,
      is_new_arrival: 1,
      is_best_seller: 0,
      material: 'Pure Organza',
      care_instructions: 'Dry clean only'
    },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, short_description, price, original_price,
      category_name, sku, images, sizes, colors, stock, featured,
      is_new_arrival, is_best_seller, material, care_instructions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  products.forEach((p, i) => {
    insertProduct.run(
      p.name, p.description, p.short_description, p.price, p.original_price,
      p.category_name, p.sku, JSON.stringify([]),
      JSON.stringify(p.sizes), JSON.stringify(p.colors), p.stock, p.featured,
      p.is_new_arrival, p.is_best_seller, p.material, p.care_instructions
    );
  });

  // --- ADMIN USER ---
  const password_hash = bcrypt.hashSync('Hos@2025', 10);
  db.prepare(
    'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)'
  ).run('Admin', 'Houseofsrivithra@gmail.com', password_hash, '+91 9876543210', 'admin');

  // --- SITE CONTENT ---
  const contentItems = [
    {
      section_key: 'announcement_bar',
      title: 'Free Shipping on Orders above ₹1999',
      subtitle: 'Cash on Delivery Available',
      content: {
        items: [
          'Free Shipping on Orders above ₹1999',
          'Cash on Delivery Available',
          'Easy 7-Day Returns'
        ]
      }
    },
    {
      section_key: 'hero',
      title: 'Crafted for Every Celebration',
      subtitle: 'Timeless. Elegant. You.',
      content: {
        description: 'Premium ethnic wear for women & men that blend tradition with contemporary style.',
        cta_text: 'SHOP COLLECTION',
        cta_link: '/shop',
        side_cards: [
          {
            title: 'Lehengas That Speak Elegance',
            cta: 'EXPLORE NOW',
            link: '/shop?category=Lehengas'
          },
          {
            title: "Men's Ethnic Collection",
            cta: 'EXPLORE NOW',
            link: '/shop?category=Men Ethnic'
          }
        ]
      }
    },
    {
      section_key: 'trust_badges',
      title: 'Why Shop With Us',
      subtitle: '',
      content: {
        badges: [
          { icon: 'gem', title: 'Premium Quality', subtitle: 'Finest Fabrics' },
          { icon: 'shield', title: 'Secure Payment', subtitle: '100% Safe & Secure' },
          { icon: 'refresh', title: 'Easy Returns', subtitle: '7 Days Hassle-Free' }
        ]
      }
    },
    {
      section_key: 'footer_badges',
      title: 'Our Promises',
      subtitle: '',
      content: {
        badges: [
          { icon: 'globe', title: 'Worldwide Shipping', subtitle: 'Across India' },
          { icon: 'star', title: 'Premium Quality', subtitle: 'Finest Fabrics' },
          { icon: 'package', title: 'Secure Packaging', subtitle: 'Safe Delivery' },
          { icon: 'headphones', title: '24/7 Support', subtitle: "We're here to help" }
        ]
      }
    }
  ];

  const insertContent = db.prepare(
    'INSERT INTO site_content (section_key, title, subtitle, content) VALUES (?, ?, ?, ?)'
  );
  contentItems.forEach(c => {
    insertContent.run(c.section_key, c.title, c.subtitle, JSON.stringify(c.content));
  });

  // --- SAMPLE ORDERS ---
  const sampleOrders = [
    {
      order_number: 'HOS-A1B2C3-X1Y2',
      user_name: 'Priya Sharma',
      user_email: 'priya@example.com',
      items: [
        { product_id: 1, name: 'Pure Georgette Saree', price: 2799, quantity: 1, size: 'Free Size', color: 'Maroon', total: 2799 },
        { product_id: 3, name: 'Embroidered Kurta Set', price: 2299, quantity: 2, size: 'M', color: 'White', total: 4598 }
      ],
      subtotal: 7397,
      shipping: 0,
      tax: 369.85,
      total: 7766.85,
      status: 'delivered',
      shipping_address: { name: 'Priya Sharma', address: '42 MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', phone: '+91 9876543210' },
      payment_method: 'upi'
    },
    {
      order_number: 'HOS-D4E5F6-G7H8',
      user_name: 'Rahul Verma',
      user_email: 'rahul@example.com',
      items: [
        { product_id: 6, name: 'Premium Sherwani', price: 9999, quantity: 1, size: '40', color: 'Ivory', total: 9999 }
      ],
      subtotal: 9999,
      shipping: 0,
      tax: 499.95,
      total: 10498.95,
      status: 'shipped',
      shipping_address: { name: 'Rahul Verma', address: '15 Sector 22', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301', phone: '+91 9123456789' },
      payment_method: 'card'
    },
    {
      order_number: 'HOS-I9J0K1-L2M3',
      user_name: 'Anjali Patel',
      user_email: 'anjali@example.com',
      items: [
        { product_id: 4, name: 'Designer Lehenga', price: 6499, quantity: 1, size: 'M', color: 'Wine Red', total: 6499 },
        { product_id: 16, name: 'Kundan Jewelry Set', price: 1499, quantity: 1, size: 'One Size', color: 'Gold-Red', total: 1499 }
      ],
      subtotal: 7998,
      shipping: 0,
      tax: 399.90,
      total: 8397.90,
      status: 'processing',
      shipping_address: { name: 'Anjali Patel', address: '7 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', phone: '+91 9012345678' },
      payment_method: 'cod'
    },
    {
      order_number: 'HOS-N4O5P6-Q7R8',
      user_name: 'Vikram Singh',
      user_email: 'vikram@example.com',
      items: [
        { product_id: 14, name: "Men's Kurta Pajama Set", price: 1799, quantity: 3, size: 'L', color: 'White', total: 5397 }
      ],
      subtotal: 5397,
      shipping: 0,
      tax: 269.85,
      total: 5666.85,
      status: 'confirmed',
      shipping_address: { name: 'Vikram Singh', address: '23 Civil Lines', city: 'Jaipur', state: 'Rajasthan', pincode: '302006', phone: '+91 9234567890' },
      payment_method: 'upi'
    },
    {
      order_number: 'HOS-S9T0U1-V2W3',
      user_name: 'Meera Iyer',
      user_email: 'meera@example.com',
      items: [
        { product_id: 11, name: 'Bridal Lehenga Set', price: 15999, quantity: 1, size: 'S', color: 'Red', total: 15999 }
      ],
      subtotal: 15999,
      shipping: 0,
      tax: 799.95,
      total: 16798.95,
      status: 'pending',
      shipping_address: { name: 'Meera Iyer', address: '8 Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034', phone: '+91 9345678901' },
      payment_method: 'card'
    }
  ];

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, user_name, user_email, items, subtotal, shipping, tax, total, status, shipping_address, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  sampleOrders.forEach(o => {
    insertOrder.run(o.order_number, o.user_name, o.user_email, JSON.stringify(o.items), o.subtotal, o.shipping, o.tax, o.total, o.status, JSON.stringify(o.shipping_address), o.payment_method);
  });

  db.close();
  console.log('Database seeded successfully!');
  console.log(`  - ${products.length} products`);
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${sampleOrders.length} sample orders`);
  console.log(`  - 1 admin user (houseofsrivithra@gmail.com / admin123)`);
  console.log(`  - ${contentItems.length} content sections`);
}

// Run if called directly
seedDatabase();

module.exports = { seedDatabase };
