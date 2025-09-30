import { GrowthBookClient, GrowthBook } from '@growthbook/growthbook';

class FeatureFlagService {
  private gbClient!: GrowthBookClient;

  async initialize() {
    this.gbClient = new GrowthBookClient({
      apiHost: "http://localhost:3100",
      clientKey: "sdk-0YSHIPiuOSzNPq",
      enableDevMode: true
    });
    await this.gbClient.init({ timeout: 3000 });
    console.log('🚩 Feature flag service initialized with GrowthBookClient');
  }

  createScopedInstance(attributes: Record<string, any>): GrowthBook {
    if (!this.gbClient) {
      console.warn('Feature flag service not initialized');
      throw new Error('Feature flag service not initialized');
    }

    // Create a request-scoped GrowthBook instance
    // trackingCallback is intentionally undefined to suppress automatic tracking
    return this.gbClient.createScopedInstance({
      attributes,
      trackingCallback: undefined  // SUPPRESS automatic tracking
    });
  }
}

export const featureFlagService = new FeatureFlagService();