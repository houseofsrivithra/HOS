import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice, getProductImage, CATEGORY_IMAGES } from '../api';
import './Cart.css';

export default function Cart() {
  const { items, total, itemCount, updateQuantity, removeFromCart } = useCart();

  const shipping = total >= 1999 ? 0 : 99;
  const tax = Math.round(total * 0.05);
  const grandTotal = total + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="cart-page container">
        <div className="cart-empty">
          <ShoppingBag size={64} strokeWidth={1} />
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet. Let's find something beautiful!</p>
          <Link to="/shop" className="btn btn-primary btn-lg">
            Continue Shopping <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="cart-title">Shopping Cart <span className="cart-item-count">({itemCount} items)</span></h1>

        <div className="cart-layout">
          {/* Cart items */}
          <div className="cart-items">
            {items.map(item => {
              const imgUrl = item.images && item.images.length > 0
                ? getProductImage(item.images)
                : CATEGORY_IMAGES[item.category_name] || '/images/products/saree.png';

              return (
                <div key={item.id} className="cart-item">
                  <Link to={`/product/${item.product_id}`} className="cart-item-image">
                    <img src={imgUrl} alt={item.name} />
                  </Link>
                  <div className="cart-item-info">
                    <Link to={`/product/${item.product_id}`} className="cart-item-name">{item.name}</Link>
                    {item.size && <p className="cart-item-variant">Size: {item.size}</p>}
                    {item.color && <p className="cart-item-variant">Color: {item.color}</p>}
                    <div className="cart-item-price-mobile">{formatPrice(item.price)}</div>
                  </div>
                  <div className="cart-item-quantity">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease">
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase">
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="cart-item-price">{formatPrice(item.price * item.quantity)}</div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.id)} aria-label="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          <div className="cart-summary">
            <div className="cart-summary-card">
              <h3 className="cart-summary-title">Order Summary</h3>
              <div className="cart-summary-row">
                <span>Subtotal ({itemCount} items)</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'cart-free-shipping' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Tax (GST 5%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              {total < 1999 && (
                <p className="cart-shipping-note">
                  <Tag size={14} /> Add {formatPrice(1999 - total)} more for free shipping!
                </p>
              )}
              <div className="cart-summary-total">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
              <Link to="/checkout" className="btn btn-gold btn-lg cart-checkout-btn" id="checkout-btn">
                Proceed to Checkout <ArrowRight size={18} />
              </Link>
              <Link to="/shop" className="cart-continue-link">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
