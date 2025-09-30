import { useEffect, RefObject } from 'react';
import { experimentTracker } from '../services/experimentTracking';

interface ExperimentData {
  experiment_id: string;
  variation_id: string;
  value?: any;
}

interface UseExperimentExposureOptions {
  threshold?: number;
  rootMargin?: string;
  trackImmediately?: boolean;
}

export const useExperimentExposure = (
  elementRef: RefObject<HTMLElement | null>,
  experimentData: ExperimentData | null,
  options?: UseExperimentExposureOptions
) => {
  useEffect(() => {
    if (!experimentData) {
      return;
    }

    // If trackImmediately is true, track without IntersectionObserver
    if (options?.trackImmediately) {
      experimentTracker.trackExposure(experimentData);
      return;
    }

    // Otherwise, use IntersectionObserver for visibility-based tracking
    if (!elementRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          experimentTracker.trackExposure(experimentData);
          observer.disconnect();
        }
      },
      {
        threshold: options?.threshold || 0.5,  // 50% visible by default
        rootMargin: options?.rootMargin || '0px'
      }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [experimentData, elementRef, options?.threshold, options?.rootMargin, options?.trackImmediately]);
};