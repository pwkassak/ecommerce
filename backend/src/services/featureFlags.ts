import { GrowthBookClient } from '@growthbook/growthbook';
import { GrowthBookServerProvider } from './openfeature/index.js';

class FeatureFlagService {
  private gbClient!: GrowthBookClient;

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