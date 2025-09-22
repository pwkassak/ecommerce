const UserActions = require('./user-actions');
const logger = require('./logger');

class BrowserSession {
  constructor(sessionId, browser, config) {
    this.sessionId = sessionId;
    this.browser = browser;
    this.config = config;
    this.context = null;
    this.page = null;
    this.userActions = null;
    this.isRunning = false;
    this.startTime = Date.now();
    this.actionsCompleted = 0;
  }

  async run() {
    this.isRunning = true;
    const sessionDuration = this.getRandomSessionDuration();
    const endTime = this.startTime + (sessionDuration * 1000);

    logger.info(`Session ${this.sessionId} starting - duration: ${sessionDuration}s`);

    try {
      // Create browser context with user agent and persistent storage
      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        // Enable JavaScript and persistence
        javaScriptEnabled: true,
        // Keep storage and cookies persistent within session
        acceptDownloads: false,
        // Set timezone for consistent behavior
        timezoneId: 'America/New_York'
      });

      // Create new page in context
      this.page = await this.context.newPage();

      // Enable console logging to capture analytics debug logs
      this.page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();

        // Log analytics-related console messages
        if (text.includes('📊') || text.includes('🧪') || text.includes('analytics') || text.includes('DEBUG_ANON_ID')) {
          logger.info(`Session ${this.sessionId} [BROWSER ${type.toUpperCase()}]: ${text}`);
        }
      });

      // Log page errors
      this.page.on('pageerror', error => {
        logger.error(`Session ${this.sessionId} [PAGE ERROR]:`, error.message);
      });

      // Log request failures
      this.page.on('requestfailed', request => {
        logger.warn(`Session ${this.sessionId} [REQUEST FAILED]: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
      });

      // Initialize user actions
      this.userActions = new UserActions(this.page, this.config.targetUrl, this.config.delays);

      // Add script to override analytics API URL configuration
      await this.page.addInitScript(() => {
        // Override analytics configuration to use proxy instead of localhost
        window.overrideAnalyticsConfig = () => {
          const checkForAnalytics = () => {
            if (window.analyticsManager && window.analyticsManager.config) {
              const oldUrl = window.analyticsManager.config.apiUrl;
              window.analyticsManager.config.apiUrl = '/api';
              console.log(`🔧 Analytics API URL changed from ${oldUrl} to ${window.analyticsManager.config.apiUrl}`);
              return true;
            }
            return false;
          };

          // Try immediately
          if (!checkForAnalytics()) {
            // Try again after a short delay
            setTimeout(() => {
              if (!checkForAnalytics()) {
                // Keep trying for up to 5 seconds
                const interval = setInterval(() => {
                  if (checkForAnalytics()) {
                    clearInterval(interval);
                  }
                }, 100);
                setTimeout(() => clearInterval(interval), 5000);
              }
            }, 500);
          }
        };

        // Try when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', window.overrideAnalyticsConfig);
        } else {
          window.overrideAnalyticsConfig();
        }
      });

      // Navigate to homepage initially
      await this.userActions.navigateToHomePage();
      this.actionsCompleted++;

      // Perform random actions until session time expires
      while (this.isRunning && Date.now() < endTime) {
        try {
          await this.performRandomAction();
          this.actionsCompleted++;
          
          // Configurable delay between actions
          const delayRange = this.config.delays.betweenActionsMax - this.config.delays.betweenActionsMin;
          const delay = Math.random() * delayRange + this.config.delays.betweenActionsMin;
          await this.sleep(delay);
          
        } catch (actionError) {
          logger.warn(`Session ${this.sessionId} action failed:`, actionError.message);
          // Continue with next action even if one fails
        }
      }

      const duration = (Date.now() - this.startTime) / 1000;
      logger.info(`Session ${this.sessionId} completed - duration: ${duration.toFixed(1)}s, actions: ${this.actionsCompleted}`);

    } catch (error) {
      logger.error(`Session ${this.sessionId} error:`, {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    } finally {
      // Clean up in correct order: page -> context (browser is reused by simulator)
      if (this.page) {
        await this.page.close().catch(err =>
          logger.debug(`Failed to close page for session ${this.sessionId}:`, err.message)
        );
      }
      if (this.context) {
        await this.context.close().catch(err =>
          logger.warn(`Failed to close context for session ${this.sessionId}:`, err.message)
        );
      }
    }
  }

  async performRandomAction() {
    if (!this.userActions) return;

    const actions = [
      () => this.userActions.browseProducts(),
      () => this.userActions.viewProductDetail(),
      () => this.userActions.addToCart(),
      () => this.userActions.viewCart(),
      () => this.userActions.updateCartQuantity(),
      () => this.userActions.navigateToCategory(),
      () => this.userActions.navigateToHomePage(),
      () => this.userActions.proceedToCheckout(),
      () => this.userActions.completeCheckout()
    ];

    // Choose random action
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    try {
      await action();
    } catch (error) {
      // Some actions may fail if preconditions aren't met (e.g., checkout with empty cart)
      // This is expected behavior, so we log it but don't throw
      logger.debug(`Session ${this.sessionId} action skipped:`, error.message);
    }
  }

  async stop() {
    this.isRunning = false;

    // Minimal delay to allow current action to complete
    await this.sleep(10);

    if (this.page) {
      await this.page.close().catch(err =>
        logger.debug(`Failed to close page during stop for session ${this.sessionId}:`, err.message)
      );
    }
    if (this.context) {
      await this.context.close().catch(err =>
        logger.warn(`Failed to close context during stop for session ${this.sessionId}:`, err.message)
      );
    }
  }

  getRandomSessionDuration() {
    const min = this.config.sessionDurationMin;
    const max = this.config.sessionDurationMax;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      sessionId: this.sessionId,
      isRunning: this.isRunning,
      duration: (Date.now() - this.startTime) / 1000,
      actionsCompleted: this.actionsCompleted
    };
  }
}

module.exports = BrowserSession;