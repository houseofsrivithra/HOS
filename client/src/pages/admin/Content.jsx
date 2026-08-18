import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { apiGet, apiPut } from '../../api';
import './Admin.css';

function SaveBtn({ sectionKey, saved, saving, onSave }) {
  return (
    <button
      className={`btn ${saved === sectionKey ? 'btn-primary' : 'btn-outline'} btn-sm`}
      onClick={onSave}
      disabled={saving}
    >
      {saved === sectionKey ? '✓ Saved!' : <><Save size={14} /> Save</>}
    </button>
  );
}

export default function Content() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    apiGet('/content')
      .then(data => setContent(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveSection = async (key, data) => {
    setSaving(true);
    try {
      await apiPut(`/content/${key}`, data);
      setSaved(key);
      setTimeout(() => setSaved(''), 2500);
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const setField = (section, field, value) =>
    setContent(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

  const setContentField = (section, field, value) =>
    setContent(prev => ({
      ...prev,
      [section]: { ...prev[section], content: { ...prev[section]?.content, [field]: value } }
    }));

  if (loading) return (
    <div>
      <div className="admin-page-header"><h1 className="admin-page-title">Content Management</h1></div>
      <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
    </div>
  );

  // ── Announcement items ──────────────────────────────────────────────────
  const announceItems = content.announcement_bar?.content?.items || ['Free Shipping on Orders above ₹1999', 'Cash on Delivery Available'];

  const setAnnounceItem = (idx, val) => {
    const items = [...announceItems];
    items[idx] = val;
    setContent(prev => ({ ...prev, announcement_bar: { ...prev.announcement_bar, content: { ...prev.announcement_bar?.content, items } } }));
  };
  const addAnnounceItem = () => {
    const items = [...announceItems, 'New message'];
    setContent(prev => ({ ...prev, announcement_bar: { ...prev.announcement_bar, content: { ...prev.announcement_bar?.content, items } } }));
  };
  const removeAnnounceItem = (idx) => {
    const items = announceItems.filter((_, i) => i !== idx);
    setContent(prev => ({ ...prev, announcement_bar: { ...prev.announcement_bar, content: { ...prev.announcement_bar?.content, items } } }));
  };

  // ── Trust badges ─────────────────────────────────────────────────────────
  const badges = content.trust_badges?.content?.badges || [];
  const setBadgeField = (idx, field, val) => {
    const updated = badges.map((b, i) => i === idx ? { ...b, [field]: val } : b);
    setContent(prev => ({ ...prev, trust_badges: { ...prev.trust_badges, content: { ...prev.trust_badges?.content, badges: updated } } }));
  };

  // ── Promo cards ───────────────────────────────────────────────────────────
  const promoCards = content.promo_cards?.content?.cards || [];
  const setPromoField = (idx, field, val) => {
    const updated = promoCards.map((c, i) => i === idx ? { ...c, [field]: val } : c);
    setContent(prev => ({ ...prev, promo_cards: { ...prev.promo_cards, content: { ...prev.promo_cards?.content, cards: updated } } }));
  };

  // ── Featured Dresses ─────────────────────────────────────────────────────
  const featuredDresses = content.featured_dresses?.content?.dresses || [];
  const setDressField = (idx, field, val) => {
    const updated = featuredDresses.map((d, i) => i === idx ? { ...d, [field]: val } : d);
    setContent(prev => ({ ...prev, featured_dresses: { ...prev.featured_dresses, content: { ...prev.featured_dresses?.content, dresses: updated } } }));
  };
  const addDress = () => {
    const newDress = { id: Date.now(), image: '', title: 'New Style', description: 'Describe this piece...', link: '/shop', badge: '' };
    const updated = [...featuredDresses, newDress];
    setContent(prev => ({ ...prev, featured_dresses: { ...prev.featured_dresses, content: { ...prev.featured_dresses?.content, dresses: updated } } }));
  };
  const removeDress = (idx) => {
    const updated = featuredDresses.filter((_, i) => i !== idx);
    setContent(prev => ({ ...prev, featured_dresses: { ...prev.featured_dresses, content: { ...prev.featured_dresses?.content, dresses: updated } } }));
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Content Management</h1>
          <p className="admin-page-subtitle">Edit content displayed on the public storefront — changes go live immediately</p>
        </div>
      </div>

      {/* ── 1. ANNOUNCEMENT BAR ── */}
      <div className="admin-table-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-table-header">
          <h3 className="admin-table-title">📢 Announcement Bar</h3>
          <SaveBtn sectionKey="announcement_bar" saved={saved} saving={saving}
            onSave={() => saveSection('announcement_bar', content.announcement_bar)} />
        </div>
        <div style={{ padding: 'var(--space-5)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            These messages rotate in the top bar every 4 seconds.
          </p>
          {announceItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={item}
                onChange={e => setAnnounceItem(i, e.target.value)}
                placeholder={`Message ${i + 1}`}
                style={{ flex: 1 }}
              />
              {announceItems.length > 1 && (
                <button onClick={() => removeAnnounceItem(i)} style={{ color: 'var(--danger)', padding: '0 8px' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-outline btn-sm" style={{ marginTop: 4 }} onClick={addAnnounceItem}>
            <Plus size={13} /> Add Message
          </button>
        </div>
      </div>

      {/* ── 2. HERO SECTION ── */}
      <div className="admin-table-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-table-header">
          <h3 className="admin-table-title">🖼️ Hero Section</h3>
          <SaveBtn sectionKey="hero" saved={saved} saving={saving}
            onSave={() => saveSection('hero', content.hero)} />
        </div>
        <div style={{ padding: 'var(--space-5)' }}>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Eyebrow Text (small text above title)</label>
              <input value={content.hero?.subtitle || ''} onChange={e => setField('hero', 'subtitle', e.target.value)} placeholder="Timeless. Elegant. You." />
            </div>
            <div className="admin-form-group">
              <label>Main Headline</label>
              <input value={content.hero?.title || ''} onChange={e => setField('hero', 'title', e.target.value)} placeholder="Crafted for Every Celebration" />
            </div>
            <div className="admin-form-group admin-form-full">
              <label>Description</label>
              <textarea value={content.hero?.content?.description || ''} onChange={e => setContentField('hero', 'description', e.target.value)} placeholder="Premium ethnic wear for women & men..." rows={3} />
            </div>
            <div className="admin-form-group">
              <label>CTA Button Text</label>
              <input value={content.hero?.content?.cta_text || ''} onChange={e => setContentField('hero', 'cta_text', e.target.value)} placeholder="SHOP COLLECTION" />
            </div>
            <div className="admin-form-group">
              <label>CTA Button Link</label>
              <input value={content.hero?.content?.cta_link || ''} onChange={e => setContentField('hero', 'cta_link', e.target.value)} placeholder="/shop" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. PROMO CARDS (sidebar) ── */}
      <div className="admin-table-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-table-header">
          <h3 className="admin-table-title">🃏 Hero Promo Cards (Sidebar)</h3>
          <SaveBtn sectionKey="promo_cards" saved={saved} saving={saving}
            onSave={() => saveSection('promo_cards', content.promo_cards)} />
        </div>
        <div style={{ padding: 'var(--space-5)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>The two side cards shown next to the main hero image.</p>
          {promoCards.map((card, i) => (
            <div key={i} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: i < promoCards.length - 1 ? '1px solid var(--sand-beige-light)' : 'none' }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--charcoal-light)' }}>Card {i + 1}</p>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Title</label>
                  <input value={card.title || ''} onChange={e => setPromoField(i, 'title', e.target.value)} placeholder="Lehengas That Speak Elegance" />
                </div>
                <div className="admin-form-group">
                  <label>CTA Button Text</label>
                  <input value={card.cta || ''} onChange={e => setPromoField(i, 'cta', e.target.value)} placeholder="EXPLORE NOW" />
                </div>
                <div className="admin-form-group admin-form-full">
                  <label>Link (URL)</label>
                  <input value={card.link || ''} onChange={e => setPromoField(i, 'link', e.target.value)} placeholder="/shop?category=Lehengas" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. TRUST BADGES ── */}
      <div className="admin-table-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-table-header">
          <h3 className="admin-table-title">🛡️ Trust Badges</h3>
          <SaveBtn sectionKey="trust_badges" saved={saved} saving={saving}
            onSave={() => saveSection('trust_badges', content.trust_badges)} />
        </div>
        <div style={{ padding: 'var(--space-5)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>The 3 badges shown at the bottom of the hero section.</p>
          {badges.map((badge, i) => (
            <div key={i} className="admin-form-grid" style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--sand-beige-light)' }}>
              <div className="admin-form-group">
                <label>Badge {i + 1} — Title</label>
                <input value={badge.title || ''} onChange={e => setBadgeField(i, 'title', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label>Subtitle</label>
                <input value={badge.subtitle || ''} onChange={e => setBadgeField(i, 'subtitle', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. NEWSLETTER ── */}
      <div className="admin-table-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-table-header">
          <h3 className="admin-table-title">📬 Newsletter Section</h3>
          <SaveBtn sectionKey="newsletter" saved={saved} saving={saving}
            onSave={() => saveSection('newsletter', content.newsletter)} />
        </div>
        <div style={{ padding: 'var(--space-5)' }}>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Heading</label>
              <input value={content.newsletter?.title || ''} onChange={e => setField('newsletter', 'title', e.target.value)} placeholder="Stay in Style" />
            </div>
            <div className="admin-form-group">
              <label>Subscribe Button Text</label>
              <input value={content.newsletter?.content?.button_text || ''} onChange={e => setContentField('newsletter', 'button_text', e.target.value)} placeholder="SUBSCRIBE" />
            </div>
            <div className="admin-form-group admin-form-full">
              <label>Description</label>
              <textarea value={content.newsletter?.content?.description || ''} onChange={e => setContentField('newsletter', 'description', e.target.value)} placeholder="Sign up for exclusive offers..." rows={2} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 'var(--space-4)', background: 'rgba(126, 140, 84, 0.08)', borderRadius: 8, fontSize: 13, color: 'var(--charcoal-light)' }}>
        💡 <strong>Tip:</strong> Click <strong>Save</strong> next to each section individually. Changes go live on the public storefront immediately after the page is refreshed.
      </div>

      {/* ── 6. FEATURED DRESSES ── */}
      <div className="admin-table-card" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="admin-table-header">
          <h3 className="admin-table-title">👗 Featured Dresses (Home Page)</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={addDress}><Plus size={13} /> Add Dress</button>
            <SaveBtn sectionKey="featured_dresses" saved={saved} saving={saving}
              onSave={() => saveSection('featured_dresses', content.featured_dresses)} />
          </div>
        </div>
        <div style={{ padding: 'var(--space-5)' }}>
          <div className="admin-form-grid" style={{ marginBottom: 20 }}>
            <div className="admin-form-group">
              <label>Section Title</label>
              <input value={content.featured_dresses?.title || ''} onChange={e => setField('featured_dresses', 'title', e.target.value)} placeholder="Featured Collection" />
            </div>
            <div className="admin-form-group">
              <label>Section Subtitle</label>
              <input value={content.featured_dresses?.subtitle || ''} onChange={e => setField('featured_dresses', 'subtitle', e.target.value)} placeholder="Handpicked styles for every occasion" />
            </div>
          </div>

          {featuredDresses.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No dress cards yet. Click "Add Dress" to create one.</p>
          )}

          {featuredDresses.map((dress, i) => (
            <div key={dress.id || i} style={{ marginBottom: 24, padding: 20, border: '1px solid var(--sand-beige)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Dress Card {i + 1}</p>
                <button onClick={() => removeDress(i)} style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="admin-form-group">
                  <label>Image URL or Upload Path</label>
                  <input value={dress.image || ''} onChange={e => setDressField(i, 'image', e.target.value)} placeholder="/images/products/saree.png or https://..." />
                </div>
                <div className="admin-form-group">
                  <label>Badge Text (optional)</label>
                  <input value={dress.badge || ''} onChange={e => setDressField(i, 'badge', e.target.value)} placeholder="New Arrival, Best Seller..." />
                </div>
                <div className="admin-form-group">
                  <label>Title</label>
                  <input value={dress.title || ''} onChange={e => setDressField(i, 'title', e.target.value)} placeholder="Bridal Silk Saree" />
                </div>
                <div className="admin-form-group">
                  <label>Shop Link (URL)</label>
                  <input value={dress.link || ''} onChange={e => setDressField(i, 'link', e.target.value)} placeholder="/shop?category=Sarees" />
                </div>
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <textarea value={dress.description || ''} onChange={e => setDressField(i, 'description', e.target.value)} placeholder="Describe this outfit..." rows={3} />
                </div>
                {dress.image && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Preview</label>
                    <img src={dress.image} alt="preview" style={{ height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--sand-beige)' }}
                      onError={e => e.target.style.display='none'} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 'var(--space-4)', background: 'rgba(126, 140, 84, 0.08)', borderRadius: 8, fontSize: 13, color: 'var(--charcoal-light)' }}>
        💡 <strong>Tip:</strong> Click <strong>Save</strong> next to each section individually. Changes go live on the public storefront immediately after the page is refreshed.
      </div>
    </div>
  );
}
