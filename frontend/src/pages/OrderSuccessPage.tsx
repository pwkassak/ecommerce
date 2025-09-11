import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const { orderId, orderTotal } = location.state || {};

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