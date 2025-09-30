import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useExperimentExposure } from '../hooks/useExperimentExposure';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

const HomePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const categoriesRef = useRef<HTMLElement | null>(null);

  // Track exposure immediately when data loads (not when visible)
  // This ensures both variations are tracked, even if categories aren't shown
  useExperimentExposure(
    categoriesRef,
    data?.experiments?.['remove-quick-links'],
    { trackImmediately: true }
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const anonymousId = localStorage.getItem('analytics_anonymous_id');
        const response = await fetch('/api/products?featured=true', {
          headers: {
            'X-Anonymous-ID': anonymousId || ''
          }
        });

        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="homepage">

      {/* Featured Products Section */}
      <section className="featured-products">
        <div className="container">
          <h2>Featured Products</h2>
          <div className="products-grid">
            {loading ? (
              <div className="loading">Loading featured products...</div>
            ) : (
              data?.data?.products?.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Categories Section - Rendered based on backend data */}
      {data?.data?.categories && data.data.categories.length > 0 && (
        <section className="categories-preview" ref={categoriesRef}>
          <div className="container">
            <h2>Shop by Category</h2>
            <div className="categories-grid">
              {data.data.categories.map((category: any) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.id}`}
                  className="category-card"
                >
                  <img src={`/images/category-${category.id}.jpg`} alt={category.name} />
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;