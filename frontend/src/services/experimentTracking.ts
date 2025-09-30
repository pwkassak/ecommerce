interface ExperimentData {
  experiment_id: string;
  variation_id: string;
  value?: any;
}

class ExperimentTracker {
  private trackedExperiments = new Set<string>();

  private getSessionId(): string {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getAnonymousId(): string {
    return localStorage.getItem('analytics_anonymous_id') || '';
  }

  async trackExposure(experimentData: ExperimentData) {
    const key = `${experimentData.experiment_id}-${experimentData.variation_id}`;

    // Prevent duplicate tracking per session
    if (this.trackedExperiments.has(key)) {
      console.log(`🧪 Experiment ${key} already tracked in this session`);
      return;
    }

    try {
      // Track with GrowthBook schema
      await fetch('/api/analytics/experiment-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Anonymous-ID': this.getAnonymousId()
        },
        body: JSON.stringify({
          session_id: this.getSessionId(),
          anonymous_id: this.getAnonymousId(),
          experiment_id: experimentData.experiment_id,
          variation_id: experimentData.variation_id,
          experiment_name: null,
          variation_name: null,
          client_timestamp: new Date().toISOString()
        })
      });

      this.trackedExperiments.add(key);
      console.log(`🧪 Tracked exposure for experiment: ${key}`);
    } catch (error) {
      console.error('Failed to track experiment exposure:', error);
    }
  }

  reset() {
    // Clear tracked experiments (useful for testing or new sessions)
    this.trackedExperiments.clear();
  }
}

export const experimentTracker = new ExperimentTracker();