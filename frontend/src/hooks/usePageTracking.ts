import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from './useAnalytics';

export const usePageTracking = () => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();

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