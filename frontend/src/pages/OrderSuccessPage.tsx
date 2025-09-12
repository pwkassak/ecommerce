import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { useCart } from '../contexts/CartContext';

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const { orderId, orderTotal } = location.state || {};
  const { track } = useAnalytics();
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart after successful order
    clearCart();
    
    // Track order success page view
    track({
      event_type: 'order_success',
      event_name: 'Order Success Viewed',
      properties: {
        order_id: orderId,
        order_total: orderTotal
      }
    });
  }, [orderId, orderTotal, track, clearCart]);

  return (
    <div className="order-success-page">
      <div className="container">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h1>Order Placed Successfully!</h1>
          
          {orderId && (
            <div className="order-details">
              <p>Thank you for your order!</p>
              <div className="order-info">
                <div className="info-row">
                  <strong>Order ID:</strong> #{orderId}
                </div>
                {orderTotal && (
                  <div className="info-row">
                    <strong>Total:</strong> ${orderTotal.toFixed(2)}
                  </div>
                )}
              </div>
              <p className="order-note">
                You'll receive an email confirmation shortly with your order details and tracking information.
              </p>
            </div>
          )}
          
          <div className="success-actions">
            <Link to="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;