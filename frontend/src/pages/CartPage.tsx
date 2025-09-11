import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <h1>Your Cart</h1>
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <Link to="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Your Cart ({cart.items.length} items)</h1>
          <button 
            className="btn btn-secondary clear-cart"
            onClick={clearCart}
          >
            Clear Cart
          </button>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.product.id} className="cart-item">
                <div className="item-image">
                  <Link to={`/products/${item.product.id}`}>
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-cube.jpg';
                      }}
                    />
                  </Link>
                </div>

                <div className="item-details">
                  <Link 
                    to={`/products/${item.product.id}`}
                    className="item-name"
                  >
                    {item.product.name}
                  </Link>
                  <div className="item-specs">
                    {Object.entries(item.product.specifications).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="spec">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                  <div className="item-price">
                    ${item.product.price.toFixed(2)} each
                  </div>
                </div>

                <div className="item-quantity">
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => 
                      handleQuantityChange(item.product.id, parseInt(e.target.value) || 1)
                    }
                    className="quantity-input"
                  />
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <div className="item-total">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </div>

                <button
                  className="remove-item"
                  onClick={() => removeFromCart(item.product.id)}
                  title="Remove from cart"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3>Order Summary</h3>
              
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping:</span>
                <span>FREE</span>
              </div>
              
              <div className="summary-row">
                <span>Tax (estimated):</span>
                <span>${(cart.total * 0.08).toFixed(2)}</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total">
                <span>Total:</span>
                <span>${(cart.total * 1.08).toFixed(2)}</span>
              </div>

              <button 
                className="btn btn-primary checkout-btn"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </button>

              <Link to="/" className="continue-shopping">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;