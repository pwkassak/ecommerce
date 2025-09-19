import { useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types for analytics events
interface AnalyticsEventData {
  event_type: string;
  event_name: string;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  properties?: Record<string, any>;
  product_id?: string;
  product_name?: string;
  product_category?: string;
  product_price?: number;
  quantity?: number;
  cart_value?: number;
}

interface PageViewData {
  page_url: string;
  page_title?: string;
  referrer?: string;
  load_time_ms?: number;
  viewport_width?: number;
  viewport_height?: number;
}

interface AnalyticsConfig {
  apiUrl: string;
  sessionTimeout: number; // milliseconds
  batchSize: number;
  flushInterval: number; // milliseconds
}

class AnalyticsManager {
  private config: AnalyticsConfig;
  private sessionId: string;
  private anonymousId: string;
  private userId: string | null = null;
  private eventQueue: AnalyticsEventData[] = [];
  private isOnline = true;
  private lastActivity = Date.now();
  private flushTimer: NodeJS.Timeout | null = null;
  private pageStartTime = Date.now();

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      apiUrl: import.meta.env.VITE_API_URL || '/api',
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      ...config
    };

    this.sessionId = this.getOrCreateSessionId();
    this.anonymousId = this.getOrCreateAnonymousId();
    this.setupOnlineOfflineHandlers();
    this.startFlushTimer();

    // Track page load performance
    this.trackPageLoadPerformance();
  }

  private getOrCreateSessionId(): string {
    const existingSession = sessionStorage.getItem('analytics_session_id');
    const sessionStart = sessionStorage.getItem('analytics_session_start');
    
    // Check if session has expired
    if (existingSession && sessionStart) {
      const elapsed = Date.now() - parseInt(sessionStart);
      if (elapsed < this.config.sessionTimeout) {
        return existingSession;
      }
    }

    // Create new session
    const newSessionId = uuidv4();
    sessionStorage.setItem('analytics_session_id', newSessionId);
    sessionStorage.setItem('analytics_session_start', Date.now().toString());
    return newSessionId;
  }

  private getOrCreateAnonymousId(): string {
    const existingId = localStorage.getItem('analytics_anonymous_id');
    if (existingId) {
      // TODO: REMOVE_DEBUG_LOGS - Remove after experiment debugging
      console.log('🔍 DEBUG_ANON_ID: Found existing anonymous ID:', existingId);
      return existingId;
    }

    const newId = uuidv4();
    localStorage.setItem('analytics_anonymous_id', newId);
    // TODO: REMOVE_DEBUG_LOGS - Remove after experiment debugging
    console.log('🔍 DEBUG_ANON_ID: Created new anonymous ID:', newId);
    return newId;
  }

  private setupOnlineOfflineHandlers(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushEvents(); // Send queued events when back online
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Track visibility changes for session management
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.lastActivity = Date.now();
        this.pageStartTime = Date.now();
      } else {
        this.trackPageTimeSpent();
      }
    });

    // Track user activity for session timeout
    ['click', 'scroll', 'keydown', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivity = Date.now();
      });
    });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.config.flushInterval);
  }

  private trackPageLoadPerformance(): void {
    // Wait for page to fully load
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
      
      // Track initial page view with performance data
      this.trackPageView({
        page_url: window.location.pathname + window.location.search,
        page_title: document.title,
        referrer: document.referrer || null,
        load_time_ms: Math.round(loadTime),
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight
      });
    });
  }

  private trackPageTimeSpent(): void {
    const timeSpent = Math.round((Date.now() - this.pageStartTime) / 1000);
    if (timeSpent > 1) { // Only track if more than 1 second
      this.track({
        event_type: 'engagement',
        event_name: 'Time on Page',
        properties: {
          time_spent_seconds: timeSpent,
          page_url: window.location.pathname + window.location.search
        }
      });
    }
  }

  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  track(eventData: AnalyticsEventData): void {
    console.log('📊 Tracking event:', {
      type: eventData.event_type,
      name: eventData.event_name,
      page: eventData.page_url || window.location.pathname
    });
    
    const event = {
      session_id: this.sessionId,
      user_id: this.userId,
      anonymous_id: this.anonymousId,
      client_timestamp: new Date().toISOString(),
      page_url: eventData.page_url || window.location.pathname + window.location.search,
      page_title: eventData.page_title || document.title,
      referrer: eventData.referrer || document.referrer || null,
      ...eventData
    };

    this.eventQueue.push(event);
    console.log(`📋 Event queued. Queue size: ${this.eventQueue.length}`);

    // Flush immediately if queue is full or for important events
    if (
      this.eventQueue.length >= this.config.batchSize ||
      ['purchase', 'signup', 'error'].includes(eventData.event_type)
    ) {
      console.log('🚀 Flushing events immediately');
      this.flushEvents();
    }
  }

  trackPageView(data: PageViewData): void {
    this.track({
      event_type: 'page_view',
      event_name: 'Page Viewed',
      ...data
    });

    // Also send to dedicated page view endpoint for better analytics
    if (this.isOnline) {
      fetch(`${this.config.apiUrl}/analytics/page-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          user_id: this.userId,
          ...data
        })
      }).then(response => {
        if (response.ok) {
          console.log('✅ Dedicated page view tracked successfully');
        } else {
          console.error('❌ Failed to track dedicated page view:', response.status);
        }
      }).catch(error => {
        console.error('❌ Failed to track page view:', error);
      });
    }
  }

  trackProductView(productId: string, productName: string, productCategory: string, productPrice: number): void {
    this.track({
      event_type: 'product_view',
      event_name: 'Product Viewed',
      product_id: productId,
      product_name: productName,
      product_category: productCategory,
      product_price: productPrice,
      properties: {
        product_id: productId,
        product_name: productName,
        product_category: productCategory,
        product_price: productPrice
      }
    });
  }

  trackAddToCart(productId: string, productName: string, quantity: number, cartValue: number): void {
    this.track({
      event_type: 'add_to_cart',
      event_name: 'Product Added to Cart',
      product_id: productId,
      product_name: productName,
      quantity: quantity,
      cart_value: cartValue,
      properties: {
        product_id: productId,
        product_name: productName,
        quantity: quantity,
        cart_value: cartValue
      }
    });
  }

  trackRemoveFromCart(productId: string, productName: string, quantity: number): void {
    this.track({
      event_type: 'remove_from_cart',
      event_name: 'Product Removed from Cart',
      product_id: productId,
      product_name: productName,
      quantity: quantity,
      properties: {
        product_id: productId,
        product_name: productName,
        quantity: quantity
      }
    });
  }

  trackCartView(itemCount: number, cartValue: number): void {
    this.track({
      event_type: 'cart_view',
      event_name: 'Cart Viewed',
      cart_value: cartValue,
      properties: {
        item_count: itemCount,
        cart_value: cartValue
      }
    });
  }

  trackCheckoutStart(cartValue: number, itemCount: number): void {
    this.track({
      event_type: 'checkout_start',
      event_name: 'Checkout Started',
      cart_value: cartValue,
      properties: {
        cart_value: cartValue,
        item_count: itemCount
      }
    });
  }

  trackPurchase(orderId: string, cartValue: number, items: any[]): void {
    this.track({
      event_type: 'purchase',
      event_name: 'Purchase Completed',
      cart_value: cartValue,
      properties: {
        order_id: orderId,
        cart_value: cartValue,
        item_count: items.length,
        items: items
      }
    });
  }

  trackSearch(query: string, resultsCount?: number): void {
    this.track({
      event_type: 'search',
      event_name: 'Search Performed',
      properties: {
        search_query: query,
        results_count: resultsCount
      }
    });
  }

  trackButtonClick(buttonName: string, location?: string): void {
    this.track({
      event_type: 'click',
      event_name: 'Button Clicked',
      properties: {
        button_name: buttonName,
        location: location || window.location.pathname
      }
    });
  }

  trackExperimentAssignment(experimentId: string, variationId: string, experimentName?: string, variationName?: string): void {
    console.log('🧪 Tracking experiment assignment:', {
      experimentId,
      variationId,
      experimentName,
      variationName
    });

    // Send to dedicated experiment assignment endpoint
    if (this.isOnline) {
      fetch(`${this.config.apiUrl}/analytics/experiment-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          user_id: this.userId,
          anonymous_id: this.anonymousId,
          experiment_id: experimentId,
          variation_id: variationId,
          experiment_name: experimentName,
          variation_name: variationName,
          client_timestamp: new Date().toISOString()
        })
      }).then(response => {
        if (response.ok) {
          console.log('✅ Experiment assignment tracked successfully');
        } else {
          console.error('❌ Failed to track experiment assignment:', response.status);
        }
      }).catch(error => {
        console.error('❌ Failed to track experiment assignment:', error);
      });
    }
  }

  private async flushEvents(): Promise<void> {
    if (!this.isOnline) {
      console.log('📴 Offline - skipping event flush');
      return;
    }
    
    if (this.eventQueue.length === 0) {
      console.log('📋 No events to flush');
      return;
    }

    const eventsToSend = this.eventQueue.splice(0, this.config.batchSize);
    console.log(`🚀 Sending ${eventsToSend.length} events to analytics API`);

    try {
      const endpoint = eventsToSend.length === 1 
        ? `${this.config.apiUrl}/analytics/events`
        : `${this.config.apiUrl}/analytics/events/batch`;

      const payload = eventsToSend.length === 1 
        ? eventsToSend[0]
        : { events: eventsToSend };

      console.log(`📌 Endpoint: ${endpoint}`);
      console.log('📄 Payload:', payload);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Analytics events sent successfully:', result);

    } catch (error) {
      console.error('❌ Failed to send analytics events:', error);
      // Re-add failed events to front of queue for retry
      this.eventQueue.unshift(...eventsToSend);
      console.log(`🔄 Re-queued ${eventsToSend.length} events for retry`);
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Send any remaining events
    this.trackPageTimeSpent();
    this.flushEvents();
  }
}

// Global analytics instance
let analyticsManager: AnalyticsManager | null = null;

export const useAnalytics = () => {
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      analyticsManager = new AnalyticsManager();
      initRef.current = true;

      // Cleanup on page unload
      const handleBeforeUnload = () => {
        analyticsManager?.destroy();
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, []);

  const track = useCallback((eventData: AnalyticsEventData) => {
    analyticsManager?.track(eventData);
  }, []);

  const trackPageView = useCallback((data: PageViewData) => {
    analyticsManager?.trackPageView(data);
  }, []);

  const trackProductView = useCallback((productId: string, productName: string, productCategory: string, productPrice: number) => {
    analyticsManager?.trackProductView(productId, productName, productCategory, productPrice);
  }, []);

  const trackAddToCart = useCallback((productId: string, productName: string, quantity: number, cartValue: number) => {
    analyticsManager?.trackAddToCart(productId, productName, quantity, cartValue);
  }, []);

  const trackRemoveFromCart = useCallback((productId: string, productName: string, quantity: number) => {
    analyticsManager?.trackRemoveFromCart(productId, productName, quantity);
  }, []);

  const trackCartView = useCallback((itemCount: number, cartValue: number) => {
    analyticsManager?.trackCartView(itemCount, cartValue);
  }, []);

  const trackCheckoutStart = useCallback((cartValue: number, itemCount: number) => {
    analyticsManager?.trackCheckoutStart(cartValue, itemCount);
  }, []);

  const trackPurchase = useCallback((orderId: string, cartValue: number, items: any[]) => {
    analyticsManager?.trackPurchase(orderId, cartValue, items);
  }, []);

  const trackSearch = useCallback((query: string, resultsCount?: number) => {
    analyticsManager?.trackSearch(query, resultsCount);
  }, []);

  const trackButtonClick = useCallback((buttonName: string, location?: string) => {
    analyticsManager?.trackButtonClick(buttonName, location);
  }, []);

  const trackExperimentAssignment = useCallback((experimentId: string, variationId: string, experimentName?: string, variationName?: string) => {
    analyticsManager?.trackExperimentAssignment(experimentId, variationId, experimentName, variationName);
  }, []);

  const setUserId = useCallback((userId: string | null) => {
    analyticsManager?.setUserId(userId);
  }, []);

  return {
    track,
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackCartView,
    trackCheckoutStart,
    trackPurchase,
    trackSearch,
    trackButtonClick,
    trackExperimentAssignment,
    setUserId
  };
};