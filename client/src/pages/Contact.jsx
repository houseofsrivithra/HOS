import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { apiPost } from '../api';
import './Contact.css';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiPost('/contact', form);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Hero Banner */}
      <section className="contact-hero">
        <div className="contact-hero-content animate-fade-in-up">
          <p className="contact-hero-eyebrow">GET IN TOUCH</p>
          <h1 className="contact-hero-title">We'd Love to Hear<br />From You</h1>
          <p className="contact-hero-sub">
            Whether you have a question about our collections, an order, or just want to say hello — our team is here for you.
          </p>
        </div>
      </section>

      <section className="contact-body container">
        {/* Info Cards */}
        <div className="contact-info-grid">
          <div className="contact-info-card">
            <div className="contact-info-icon">
              <MapPin size={22} />
            </div>
            <h3>Visit Us</h3>
            <p>12, Silk Street, T. Nagar<br />Chennai, Tamil Nadu 600017</p>
          </div>
          <div className="contact-info-card">
            <div className="contact-info-icon">
              <Phone size={22} />
            </div>
            <h3>Call Us</h3>
            <p>+91 98765 43210</p>
            <p>Mon – Sat, 10 AM – 7 PM</p>
          </div>
          <div className="contact-info-card">
            <div className="contact-info-icon">
              <Mail size={22} />
            </div>
            <h3>Email Us</h3>
            <p>Houseofsrivithra@gmail.com</p>
          </div>
          <div className="contact-info-card">
            <div className="contact-info-icon">
              <Clock size={22} />
            </div>
            <h3>Store Hours</h3>
            <p>Mon – Sat: 10 AM – 8 PM</p>
            <p>Sunday: 11 AM – 6 PM</p>
          </div>
        </div>

        {/* Form + Aside Row */}
        <div className="contact-main-row">
          {/* Contact Form */}
          <div className="contact-form-card">
            <h2 className="contact-form-title">Send Us a Message</h2>
            <p className="contact-form-sub">Fill out the form below and we'll get back to you within 24 hours.</p>

            {submitted ? (
              <div className="contact-success animate-fade-in-up">
                <CheckCircle size={48} className="contact-success-icon" />
                <h3>Message Sent!</h3>
                <p>Thank you for reaching out. Our team will respond within 24 hours.</p>
                <button className="btn btn-primary" onClick={() => { setSubmitted(false); setError(''); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}>
                  Send Another
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} id="contact-form">
                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="contact-name">Full Name *</label>
                    <input id="contact-name" name="name" type="text" placeholder="Your full name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="contact-field">
                    <label htmlFor="contact-email">Email Address *</label>
                    <input id="contact-email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                  </div>
                </div>
                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="contact-phone">Phone Number *</label>
                    <input id="contact-phone" name="phone" type="tel" placeholder="+91 00000 00000" value={form.phone} onChange={handleChange} required />
                  </div>
                  <div className="contact-field">
                    <label htmlFor="contact-subject">Subject *</label>
                    <select id="contact-subject" name="subject" value={form.subject} onChange={handleChange} required>
                      <option value="">Select a subject</option>
                      <option value="Order Enquiry">Order Enquiry</option>
                      <option value="Product Question">Product Question</option>
                      <option value="Return & Exchange">Return &amp; Exchange</option>
                      <option value="Custom Order">Custom Order</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="contact-field">
                  <label htmlFor="contact-message">Message *</label>
                  <textarea id="contact-message" name="message" rows={5} placeholder="Tell us how we can help you..." value={form.message} onChange={handleChange} required />
                </div>
                {error && (
                  <div className="contact-error">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                <button className="btn btn-primary contact-submit-btn" type="submit" id="contact-submit" disabled={loading}>
                  {loading ? (
                    <span className="contact-spinner" />
                  ) : (
                    <>
                      <Send size={16} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Decorative aside */}
          <div className="contact-aside">
            <div className="contact-aside-inner">
              <div className="contact-aside-decor">✦</div>
              <h3>House of Srivithra</h3>
              <p>
                Crafting timeless ethnic wear since 2010. Every piece carries the heritage of Indian craftsmanship, made with love by skilled artisans.
              </p>
              <div className="contact-aside-divider" />
              <p className="contact-aside-promise">
                <strong>Our Promise:</strong><br />
                Authentic fabrics · Skilled craftsmanship · Dedicated support
              </p>
              <div className="contact-social">
                <a href="https://www.instagram.com/house.of.srivithra?igsh=MWNlZXhpbWtlYzIwaw%3D%3D&utm_source=qr" className="contact-social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">Instagram</a>
                <a href="https://m.youtube.com/@HouseofSrivithra?ra=m" className="contact-social-link" aria-label="YouTube" target="_blank" rel="noopener noreferrer">YouTube</a>
                <a href="#" className="contact-social-link" aria-label="WhatsApp">WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
