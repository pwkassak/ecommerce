import React from 'react';
import { Link } from 'react-router-dom';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAnalytics } from '../hooks/useAnalytics';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { trackAddToCart, trackButtonClick, trackProductView } = useAnalytics();

  // GrowthBook feature flag to conditionally disable add to cart button
  const removeSomeCarts = useFeatureIsOn('remove-some-carts');

  // When feature flag is true, randomly disable 50% of add to cart buttons
  const shouldDisableCart = removeSomeCarts && Math.random() < 0.5;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Track analytics event
    trackAddToCart(product.id, product.name, 1, product.price);
    trackButtonClick('Add to Cart', `Product Card - ${product.name}`);
    
    addToCart(product);
  };

  const handleProductClick = () => {
    // Track product view when user clicks on product
    trackProductView(product.id, product.name, product.category, product.price);
  };

  return (
    <div className="product-card">
      <Link 
        to={`/products/${product.id}`} 
        className="product-link"
        onClick={handleProductClick}
      >
        <div className="product-image">
          <img src={product.imageUrl} alt={product.name} />
          {!product.inStock && <div className="out-of-stock">Out of Stock</div>}
        </div>
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-description">{product.description}</p>
          <div className="product-price">${product.price.toFixed(2)}</div>
          <div className="product-specs">
            {Object.entries(product.specifications).slice(0, 2).map(([key, value]) => (
              <span key={key} className="spec">
                {key}: {value}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <div className="product-actions">
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock || shouldDisableCart}
          className="btn btn-primary add-to-cart"
        >
          {!product.inStock ? 'Out of Stock' : shouldDisableCart ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;