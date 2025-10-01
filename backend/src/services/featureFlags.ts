import { GrowthBookClient } from '@growthbook/growthbook';
import { GrowthBookServerProvider } from './openfeature/index.js';

class FeatureFlagService {
  private gbClient!: GrowthBookClient;
  private pollingInterval?: NodeJS.Timeout;

  async initialize() {
    // Use host.docker.internal to access GrowthBook running on host machine from Docker container
    const apiHost = process.env.GROWTHBOOK_API_HOST || "http://host.docker.internal:3100";

    this.gbClient = new GrowthBookClient({
      apiHost,
      clientKey: "sdk-0YSHIPiuOSzNPq",
      enableDevMode: true
    });

    console.log(`🚩 Initializing GrowthBook with API host: ${apiHost}`);
    await this.gbClient.init({ timeout: 3000 });
    console.log('✅ Feature flag service initialized with GrowthBookClient');

    // Start polling for feature updates
    this.startPolling();
  }

  private startPolling() {
    // Refresh features every 1 minute
    this.pollingInterval = setInterval(async () => {
      try {
        console.log('🔄 Refreshing GrowthBook features...');
        await this.gbClient.refreshFeatures();
        console.log('✅ GrowthBook features refreshed successfully');
      } catch (error) {
        console.error('❌ Failed to refresh GrowthBook features:', error);
      }
    }, 60 * 1000); // 1 minute = 60,000ms

    console.log('⏰ GrowthBook polling started (1 minute interval)');
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
      console.log('⏰ GrowthBook polling stopped');
    }
  }

  getProvider(): GrowthBookServerProvider {
    if (!this.gbClient) {
      console.warn('Feature flag service not initialized');
      throw new Error('Feature flag service not initialized');
    }

    return new GrowthBookServerProvider(this.gbClient);
  }
}

export const featureFlagService = new FeatureFlagService();