import { GrowthBook } from "@growthbook/growthbook";
import { autoAttributesPlugin } from "@growthbook/growthbook/plugins";

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

const growthbook = new GrowthBook({
  apiHost: getGrowthBookApiHost(),
  clientKey: "sdk-0YSHIPiuOSzNPq",
  enableDevMode: true,
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
  plugins: [autoAttributesPlugin()],
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