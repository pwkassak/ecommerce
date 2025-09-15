import { GrowthBook } from "@growthbook/growthbook";
import { autoAttributesPlugin } from "@growthbook/growthbook/plugins";

// Import the analytics manager to integrate with existing analytics
let analyticsManager: any = null;

// Lazy load analytics manager to avoid circular dependencies
const getAnalyticsManager = async () => {
  if (!analyticsManager) {
    const { useAnalytics } = await import('../hooks/useAnalytics');
    // Note: In a real app, you'd want to get the actual manager instance
    // For now, we'll use console.log as fallback and the analytics can be integrated later
  }
  return analyticsManager;
};

const growthbook = new GrowthBook({
  apiHost: "http://localhost:3100",
  clientKey: "sdk-0YSHIPiuOSzNPq",
  enableDevMode: true,
  trackingCallback: async (experiment, result) => {
    // Integrate with existing ClickHouse analytics
    console.log("Viewed Experiment", {
      experimentId: experiment.key,
      variationId: result.key,
      experimentName: experiment.name,
      variationName: result.name
    });

    // TODO: Later we can integrate this with the analytics system like:
    // const analytics = await getAnalyticsManager();
    // if (analytics) {
    //   analytics.track({
    //     event_type: 'experiment',
    //     event_name: 'Experiment Viewed',
    //     properties: {
    //       experiment_id: experiment.key,
    //       variation_id: result.key,
    //       experiment_name: experiment.name,
    //       variation_name: result.name
    //     }
    //   });
    // }
  },
  plugins: [autoAttributesPlugin()],
});

export default growthbook;