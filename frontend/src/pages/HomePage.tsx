import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        // Fetch featured products from backend API
        const response = await fetch('http://localhost:5001/api/products?featured=true');
        if (response.ok) {
          const productsData = await response.json();
          setFeaturedProducts(productsData.success ? productsData.data : []);
        } else {
          setFeaturedProducts([]);
        }
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
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
              featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-preview">
        <div className="container">
          <h2>Shop by Category</h2>
          <div className="categories-grid">
            <Link to="/categories/speed-cubes" className="category-card">
              <img src="/images/category-speed.jpg" alt="Speed Cubes" />
              <h3>Speed Cubes</h3>
              <p>Professional racing cubes</p>
            </Link>
            <Link to="/categories/puzzle-cubes" className="category-card">
              <img src="/images/category-puzzle.jpg" alt="Puzzle Cubes" />
              <h3>Puzzle Cubes</h3>
              <p>Classic and specialty puzzles</p>
            </Link>
            <Link to="/categories/megaminx" className="category-card">
              <img src="/images/category-megaminx.jpg" alt="Megaminx" />
              <h3>Megaminx</h3>
              <p>12-sided challenge cubes</p>
            </Link>
            <Link to="/categories/pyraminx" className="category-card">
              <img src="/images/category-pyraminx.jpg" alt="Pyraminx" />
              <h3>Pyraminx</h3>
              <p>Triangular puzzle cubes</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;