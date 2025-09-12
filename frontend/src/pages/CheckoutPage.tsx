import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { Customer } from '../types';

const CheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const { trackPurchase } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer>({
    email: '',
    firstName: '',
    lastName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    }
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Customer validation
    if (!customer.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!customer.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!customer.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    // Address validation
    if (!customer.address.street.trim()) newErrors.street = 'Street address is required';
    if (!customer.address.city.trim()) newErrors.city = 'City is required';
    if (!customer.address.state.trim()) newErrors.state = 'State is required';
    if (!customer.address.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    
    // Payment validation (basic)
    if (!paymentInfo.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
    else if (paymentInfo.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }
    
    if (!paymentInfo.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
    if (!paymentInfo.cvv.trim()) newErrors.cvv = 'CVV is required';
    if (!paymentInfo.nameOnCard.trim()) newErrors.nameOnCard = 'Name on card is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Allow checkout without validating so we can mock conversions.
    // if (!validateForm()) {
    //   return;
    // }

    if (cart.items.length === 0) {
      navigate('/cart');
      return;
    }

    setLoading(true);

    try {
      // Mock order submission - in real app would call API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock order
      const order = {
        id: Date.now().toString(),
        customer,
        items: cart.items,
        total: cart.total * 1.08, // Including tax
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };

      // Track purchase analytics
      trackPurchase(order.id, order.total, cart.items);

      // Navigate to success page (cart will be cleared there)
      navigate('/order-success', { 
        state: { orderId: order.id, orderTotal: order.total } 
      });
    } catch (error) {
      console.error('Order submission failed:', error);
      setErrors({ submit: 'Order submission failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (field: keyof Customer | string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1] as keyof Customer['address'];
      setCustomer(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setCustomer(prev => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePaymentChange = (field: keyof typeof paymentInfo, value: string) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        
        <div className="checkout-content">
          <div className="checkout-form">
            <form onSubmit={handleSubmit}>
              {/* Customer Information */}
              <section className="form-section">
                <h2>Contact Information</h2>
                
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    value={customer.email}
                    onChange={(e) => handleCustomerChange('email', e.target.value)}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      id="firstName"
                      type="text"
                      value={customer.firstName}
                      onChange={(e) => handleCustomerChange('firstName', e.target.value)}
                      className={errors.firstName ? 'error' : ''}
                    />
                    {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      id="lastName"
                      type="text"
                      value={customer.lastName}
                      onChange={(e) => handleCustomerChange('lastName', e.target.value)}
                      className={errors.lastName ? 'error' : ''}
                    />
                    {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section className="form-section">
                <h2>Shipping Address</h2>
                
                <div className="form-group">
                  <label htmlFor="street">Street Address *</label>
                  <input
                    id="street"
                    type="text"
                    value={customer.address.street}
                    onChange={(e) => handleCustomerChange('address.street', e.target.value)}
                    className={errors.street ? 'error' : ''}
                  />
                  {errors.street && <span className="error-text">{errors.street}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      id="city"
                      type="text"
                      value={customer.address.city}
                      onChange={(e) => handleCustomerChange('address.city', e.target.value)}
                      className={errors.city ? 'error' : ''}
                    />
                    {errors.city && <span className="error-text">{errors.city}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input
                      id="state"
                      type="text"
                      value={customer.address.state}
                      onChange={(e) => handleCustomerChange('address.state', e.target.value)}
                      className={errors.state ? 'error' : ''}
                    />
                    {errors.state && <span className="error-text">{errors.state}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code *</label>
                    <input
                      id="zipCode"
                      type="text"
                      value={customer.address.zipCode}
                      onChange={(e) => handleCustomerChange('address.zipCode', e.target.value)}
                      className={errors.zipCode ? 'error' : ''}
                    />
                    {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
                  </div>
                </div>
              </section>

              {/* Payment Information */}
              <section className="form-section">
                <h2>Payment Information</h2>
                
                <div className="form-group">
                  <label htmlFor="nameOnCard">Name on Card *</label>
                  <input
                    id="nameOnCard"
                    type="text"
                    value={paymentInfo.nameOnCard}
                    onChange={(e) => handlePaymentChange('nameOnCard', e.target.value)}
                    className={errors.nameOnCard ? 'error' : ''}
                  />
                  {errors.nameOnCard && <span className="error-text">{errors.nameOnCard}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="cardNumber">Card Number *</label>
                  <input
                    id="cardNumber"
                    type="text"
                    value={paymentInfo.cardNumber}
                    onChange={(e) => handlePaymentChange('cardNumber', e.target.value.replace(/\D/g, ''))}
                    placeholder="1234 5678 9012 3456"
                    className={errors.cardNumber ? 'error' : ''}
                    maxLength={16}
                  />
                  {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expiryDate">Expiry Date *</label>
                    <input
                      id="expiryDate"
                      type="text"
                      value={paymentInfo.expiryDate}
                      onChange={(e) => handlePaymentChange('expiryDate', e.target.value)}
                      placeholder="MM/YY"
                      className={errors.expiryDate ? 'error' : ''}
                      maxLength={5}
                    />
                    {errors.expiryDate && <span className="error-text">{errors.expiryDate}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cvv">CVV *</label>
                    <input
                      id="cvv"
                      type="text"
                      value={paymentInfo.cvv}
                      onChange={(e) => handlePaymentChange('cvv', e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      className={errors.cvv ? 'error' : ''}
                      maxLength={4}
                    />
                    {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                  </div>
                </div>
              </section>

              {errors.submit && (
                <div className="form-error">
                  {errors.submit}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary submit-order"
                disabled={loading}
              >
                {loading ? 'Processing...' : `Place Order - $${(cart.total * 1.08).toFixed(2)}`}
              </button>
            </form>
          </div>

          <div className="order-summary">
            <h3>Order Summary</h3>
            
            <div className="summary-items">
              {cart.items.map((item) => (
                <div key={item.product.id} className="summary-item">
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder-cube.jpg';
                    }}
                  />
                  <div className="item-info">
                    <div className="item-name">{item.product.name}</div>
                    <div className="item-quantity">Qty: {item.quantity}</div>
                  </div>
                  <div className="item-price">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>FREE</span>
              </div>
              <div className="summary-row">
                <span>Tax:</span>
                <span>${(cart.total * 0.08).toFixed(2)}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>${(cart.total * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;