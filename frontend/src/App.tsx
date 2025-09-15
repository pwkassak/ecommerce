import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GrowthBookProvider } from '@growthbook/growthbook-react';
import { CartProvider } from './contexts/CartContext';
import { usePageTracking } from './hooks/usePageTracking';
import growthbook from './services/growthbook';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import './App.css';
import './pages.css';
import './analytics.css';

function AppContent() {
  // Add automatic page tracking
  usePageTracking();

  return (
    <div className="App">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories/:category" element={<CategoryPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <GrowthBookProvider growthbook={growthbook}>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </GrowthBookProvider>
  );
}

export default App
