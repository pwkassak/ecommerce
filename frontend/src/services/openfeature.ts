import { OpenFeature } from '@openfeature/web-sdk';
import { GrowthbookClientProvider } from '@openfeature/growthbook-client-provider';
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
    console.log('🔍 DEBUG_ANON_ID: Found existing anonymous ID for OpenFeature:', existingId);
    return existingId;
  }

  const newId = uuidv4();
  localStorage.setItem('analytics_anonymous_id', newId);
  console.log('🔍 DEBUG_ANON_ID: Created new anonymous ID for OpenFeature:', newId);
  return newId;
};

// Get or create the anonymous ID before initializing OpenFeature
const anonymousId = getOrCreateAnonymousId();

// Configure GrowthBook context
const gbContext = {
  apiHost: getGrowthBookApiHost(),
  clientKey: "sdk-0YSHIPiuOSzNPq",
  attributes: {
    anonymous_id: anonymousId,
    id: anonymousId  // Also set 'id' for compatibility with any experiments that might use it
  },
  trackingCallback: async (experiment: any, result: any) => {
    // Integrate with existing ClickHouse analytics
    console.log("🧪 OpenFeature Experiment Viewed", {
      experimentId: experiment.key,
      variationId: result.key,
      experimentName: experiment.name,
      variationName: result.name
    });

    // TODO: REMOVE_DEBUG_LOGS - Remove after experiment debugging
    console.log('🔍 DEBUG_EXPERIMENT: OpenFeature experiment assignment:', {
      experiment: experiment.key,
      variation: result.key,
      userAttributes: { anonymous_id: anonymousId, id: anonymousId }
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
};

// Optional init options
const initOptions = {
  timeout: 2000,
  streaming: true,
};

// Initialize GrowthBook client provider
const growthBookProvider = new GrowthbookClientProvider(gbContext, initOptions);

// Set the OpenFeature provider
OpenFeature.setProvider(growthBookProvider);

// Log when provider is ready
const client = OpenFeature.getClient();
client.addHandler('PROVIDER_READY', () => {
  console.log("OpenFeature GrowthBook client provider initialized successfully");

  // TODO: REMOVE_DEBUG_LOGS - Remove after experiment debugging
  console.log('🔍 DEBUG_EXPERIMENT: OpenFeature provider ready with attributes:', { anonymous_id: anonymousId, id: anonymousId });
});

client.addHandler('PROVIDER_ERROR', (error) => {
  console.error("Failed to initialize OpenFeature GrowthBook client provider:", error);
});

// Get the OpenFeature client
export const openFeatureClient = OpenFeature.getClient();

export { setAnalyticsManager as setOpenFeatureAnalyticsManager };