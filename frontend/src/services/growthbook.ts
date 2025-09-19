import { GrowthBook } from "@growthbook/growthbook";
import { v4 as uuidv4 } from 'uuid';

// Get access to the analytics manager instance
let analyticsManagerInstance: any = null;

// Function to get the analytics manager instance
const getAnalyticsManager = () => {
  return analyticsManagerInstance;
};

// Function to set the analytics manager (called from the component that uses analytics)
export const setAnalyticsManager = (manager: any) => {
  analyticsManagerInstance = manager;
};

// Function to detect the correct GrowthBook API host based on environment
const getGrowthBookApiHost = (): string => {
  // Check if we're being accessed from inside Docker (traffic simulator)
  if (window.location.hostname === 'frontend') {
    // Traffic simulator browsers - use host.docker.internal to reach host
    return 'http://host.docker.internal:3100';
  }
  // Host browsers - use localhost
  return 'http://localhost:3100';
};

// Function to get or create anonymous ID (similar to useAnalytics.ts)
const getOrCreateAnonymousId = (): string => {
  const existingId = localStorage.getItem('analytics_anonymous_id');
  if (existingId) {
    console.log('🔍 DEBUG_ANON_ID: Found existing anonymous ID for GrowthBook:', existingId);
    return existingId;
  }

  const newId = uuidv4();
  localStorage.setItem('analytics_anonymous_id', newId);
  console.log('🔍 DEBUG_ANON_ID: Created new anonymous ID for GrowthBook:', newId);
  return newId;
};

// Get or create the anonymous ID before initializing GrowthBook
const anonymousId = getOrCreateAnonymousId();

const growthbook = new GrowthBook({
  apiHost: getGrowthBookApiHost(),
  clientKey: "sdk-0YSHIPiuOSzNPq",
  enableDevMode: true,
  attributes: {
    anonymous_id: anonymousId,
    id: anonymousId  // Also set 'id' for compatibility with any experiments that might use it
  },
  trackingCallback: async (experiment, result) => {
    // Integrate with existing ClickHouse analytics
    console.log("🧪 GrowthBook Experiment Viewed", {
      experimentId: experiment.key,
      variationId: result.key,
      experimentName: experiment.name,
      variationName: result.name
    });

    // TODO: REMOVE_DEBUG_LOGS - Remove after experiment debugging
    console.log('🔍 DEBUG_EXPERIMENT: Experiment assignment:', {
      experiment: experiment.key,
      variation: result.key,
      userAttributes: growthbook.getAttributes()
    });

    // Get the analytics manager and track the experiment assignment
    const analytics = getAnalyticsManager();
    if (analytics) {
      // Track the experiment assignment through our dedicated endpoint
      analytics.trackExperimentAssignment(
        experiment.key,
        result.key,
        experiment.name,
        result.name
      );

      // Also track as a general analytics event for broader analysis
      analytics.track({
        event_type: 'experiment_viewed',
        event_name: 'Experiment Viewed',
        properties: {
          experiment_id: experiment.key,
          variation_id: result.key,
          experiment_name: experiment.name || '',
          variation_name: result.name || ''
        }
      });
    } else {
      console.warn('Analytics manager not available for experiment tracking');
    }
  },
});

// Initialize GrowthBook to establish connection with the dashboard
growthbook.init().then((result) => {
  console.log("GrowthBook initialized:", result);
  
  // TODO: REMOVE_DEBUG_LOGS - Remove after experiment debugging
  console.log('🔍 DEBUG_EXPERIMENT: GrowthBook user attributes:', growthbook.getAttributes());
}).catch((error) => {
  console.error("Failed to initialize GrowthBook:", error);
});

export default growthbook;