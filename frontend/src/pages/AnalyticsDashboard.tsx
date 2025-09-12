import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DashboardMetrics {
  total_sessions: number;
  unique_users: number;
  page_views: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversion_rate: number;
  total_revenue: number;
}

interface ConversionFunnel {
  step: string;
  sessions_count: number;
  conversion_rate: number;
  drop_off_rate: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  product_category: string;
  views: number;
  add_to_cart: number;
  purchases: number;
  revenue: number;
  conversion_rate: number;
}

interface RecentEvent {
  timestamp: string;
  event_type: string;
  event_name: string;
  page_url: string;
  product_name?: string;
  properties: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnel[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        metricsRes,
        funnelRes,
        productsRes,
        eventsRes,
        countsRes
      ] = await Promise.all([
        axios.get(`${apiUrl}/analytics/dashboard`),
        axios.get(`${apiUrl}/analytics/funnel`),
        axios.get(`${apiUrl}/analytics/products/top?limit=10`),
        axios.get(`${apiUrl}/analytics/events/recent?limit=20`),
        axios.get(`${apiUrl}/analytics/events/counts`)
      ]);

      setMetrics(metricsRes.data.data);
      setFunnel(funnelRes.data.data);
      setTopProducts(productsRes.data.data);
      setRecentEvents(eventsRes.data.data);
      setEventCounts(countsRes.data.data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return (num * 100).toFixed(1) + '%';
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="container">
          <div className="loading">Loading analytics data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="container">
          <div className="error">
            <h2>Error Loading Analytics</h2>
            <p>{error}</p>
            <button onClick={fetchAnalyticsData} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Analytics Dashboard</h1>
          <button onClick={fetchAnalyticsData} className="btn btn-secondary">
            Refresh Data
          </button>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total Sessions</h3>
              <div className="metric-value">{formatNumber(metrics.total_sessions)}</div>
            </div>
            <div className="metric-card">
              <h3>Unique Users</h3>
              <div className="metric-value">{formatNumber(metrics.unique_users)}</div>
            </div>
            <div className="metric-card">
              <h3>Page Views</h3>
              <div className="metric-value">{formatNumber(metrics.page_views)}</div>
            </div>
            <div className="metric-card">
              <h3>Conversion Rate</h3>
              <div className="metric-value">{formatPercentage(metrics.conversion_rate)}</div>
            </div>
          </div>
        )}

        {/* Event Counts */}
        <div className="section">
          <h2>Event Types (Last 7 Days)</h2>
          <div className="event-counts">
            {Object.entries(eventCounts).map(([eventType, count]) => (
              <div key={eventType} className="event-count-item">
                <span className="event-type">{eventType.replace('_', ' ')}</span>
                <span className="event-count">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        {funnel.length > 0 && (
          <div className="section">
            <h2>Conversion Funnel</h2>
            <div className="funnel-chart">
              {funnel.map((step, index) => (
                <div key={step.step} className="funnel-step">
                  <div className="step-name">{step.step}</div>
                  <div className="step-metrics">
                    <span className="sessions">{formatNumber(step.sessions_count)} sessions</span>
                    <span className="conversion-rate">{formatPercentage(step.conversion_rate)}</span>
                  </div>
                  <div 
                    className="step-bar" 
                    style={{ 
                      width: `${Math.max(step.conversion_rate * 100, 10)}%`,
                      backgroundColor: `hsl(${120 - (index * 20)}, 70%, 50%)`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <div className="section">
            <h2>Top Products (Last 7 Days)</h2>
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Views</th>
                    <th>Add to Cart</th>
                    <th>Purchases</th>
                    <th>Revenue</th>
                    <th>Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product) => (
                    <tr key={product.product_id}>
                      <td>
                        <div className="product-info">
                          <div className="product-name">{product.product_name}</div>
                          <div className="product-category">{product.product_category}</div>
                        </div>
                      </td>
                      <td>{formatNumber(product.views)}</td>
                      <td>{formatNumber(product.add_to_cart)}</td>
                      <td>{formatNumber(product.purchases)}</td>
                      <td>{formatCurrency(product.revenue)}</td>
                      <td>{formatPercentage(product.conversion_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <div className="section">
            <h2>Recent Events</h2>
            <div className="events-list">
              {recentEvents.map((event, index) => (
                <div key={index} className="event-item">
                  <div className="event-time">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                  <div className="event-details">
                    <span className={`event-type event-type-${event.event_type}`}>
                      {event.event_name}
                    </span>
                    <span className="event-page">{event.page_url}</span>
                    {event.product_name && (
                      <span className="event-product">{event.product_name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;