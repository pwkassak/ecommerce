import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const Navigation: React.FC = () => {
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="logo">
          <h1>CubeCraft</h1>
        </Link>
        
        <div className={`nav-menu ${isMenuOpen ? 'nav-menu-open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <div className="nav-dropdown">
            <span className="nav-link">Categories</span>
            <div className="dropdown-content">
              <Link to="/categories/speed-cubes" onClick={() => setIsMenuOpen(false)}>
                Speed Cubes
              </Link>
              <Link to="/categories/puzzle-cubes" onClick={() => setIsMenuOpen(false)}>
                Puzzle Cubes
              </Link>
              <Link to="/categories/megaminx" onClick={() => setIsMenuOpen(false)}>
                Megaminx
              </Link>
              <Link to="/categories/pyraminx" onClick={() => setIsMenuOpen(false)}>
                Pyraminx
              </Link>
              <Link to="/categories/skewb" onClick={() => setIsMenuOpen(false)}>
                Skewb
              </Link>
            </div>
          </div>
          <Link to="/about" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            About
          </Link>
          <Link to="/analytics" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Analytics
          </Link>
        </div>

        <div className="nav-actions">
          <Link to="/cart" className="cart-link">
            <span className="cart-icon">🛒</span>
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </Link>
          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;