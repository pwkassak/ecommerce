import { GrowthBook } from '@growthbook/growthbook';

class FeatureFlagService {
  private gb!: GrowthBook;

  async initialize() {
    this.gb = new GrowthBook({
      apiHost: "http://localhost:3100",
      clientKey: "sdk-0YSHIPiuOSzNPq",
      trackingCallback: undefined,  // SUPPRESS automatic tracking
      enableDevMode: true
    });
    await this.gb.loadFeatures();
    console.log('🚩 Feature flag service initialized');
  }

  evaluateFeatures(anonymousId: string) {
    if (!this.gb) {
      console.warn('Feature flag service not initialized');
      return {};
    }

    // Set user context
    this.gb.setAttributes({
      anonymous_id: anonymousId,
      id: anonymousId
    });

    // Evaluate features without tracking
    return {
      'remove-quick-links': {
        experiment_id: 'remove-quick-links',
        variation_id: this.gb.isOn('remove-quick-links') ? 'true' : 'false',
        value: this.gb.isOn('remove-quick-links')
      }
    };
  }
}

export const featureFlagService = new FeatureFlagService();