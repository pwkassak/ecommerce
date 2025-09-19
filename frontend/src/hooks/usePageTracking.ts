import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from './useAnalytics';
import { setAnalyticsManager } from '../services/growthbook';

export const usePageTracking = () => {
  const location = useLocation();
  const analytics = useAnalytics();
  const { trackPageView } = analytics;

  // Set up analytics manager for GrowthBook integration
  useEffect(() => {
    setAnalyticsManager(analytics);
    
    // TODO: REMOVE_DEBUG_LOGS - Remove after experiment debugging
    // Connect anonymous ID to GrowthBook for proper experiment targeting
    const anonymousId = localStorage.getItem('analytics_anonymous_id');
    if (anonymousId) {
      console.log('🔍 DEBUG_EXPERIMENT: Setting GrowthBook anonymous_id:', anonymousId);
      // Import GrowthBook to set user attributes
      import('../services/growthbook').then(({ default: growthbook }) => {
        growthbook.setAttributes({
          anonymous_id: anonymousId,
          id: anonymousId  // Some experiments might use 'id' instead
        });
        console.log('🔍 DEBUG_EXPERIMENT: Updated GrowthBook attributes:', growthbook.getAttributes());
      });
    }
  }, [analytics]);

  useEffect(() => {
    // Track page view when route changes
    const trackCurrentPage = () => {
      trackPageView({
        page_url: location.pathname + location.search,
        page_title: document.title,
        referrer: document.referrer || undefined,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight
      });
    };

    // Small delay to ensure the page title has been updated
    const timer = setTimeout(trackCurrentPage, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search, trackPageView]);
};