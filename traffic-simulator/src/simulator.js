const { chromium } = require('playwright');
const BrowserSession = require('./browser-session');
const logger = require('./logger');

class TrafficSimulator {
  constructor() {
    this.config = {
      concurrentBrowsers: parseInt(process.env.CONCURRENT_BROWSERS) || 5,
      targetUrl: process.env.TARGET_URL || 'http://frontend:3002',
      restartDelay: parseInt(process.env.RESTART_DELAY) || 2000,
      sessionDurationMin: parseInt(process.env.SESSION_DURATION_MIN) || 30,
      sessionDurationMax: parseInt(process.env.SESSION_DURATION_MAX) || 120
    };

    this.activeSessions = new Set();
    this.isRunning = false;
    this.sessionCounter = 0;
  }

  async start() {
    console.log('TrafficSimulator.start() called');
    console.log('Config:', this.config);

    logger.info('Starting traffic simulator', this.config);
    this.isRunning = true;

    // Launch initial browser sessions
    console.log(`Launching ${this.config.concurrentBrowsers} browser sessions...`);
    for (let i = 0; i < this.config.concurrentBrowsers; i++) {
      this.launchSession();
    }

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());

    console.log('TrafficSimulator.start() completed');
  }

  async launchSession() {
    if (!this.isRunning) return;

    const sessionId = ++this.sessionCounter;
    logger.info(`Launching browser session ${sessionId}`);

    try {
      const browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      const session = new BrowserSession(sessionId, browser, this.config);
      this.activeSessions.add(session);

      // Run the session
      await session.run();

      // Clean up
      this.activeSessions.delete(session);
      await browser.close();

      logger.info(`Session ${sessionId} completed`);

      // Schedule next session after delay
      if (this.isRunning) {
        setTimeout(() => this.launchSession(), this.config.restartDelay);
      }

    } catch (error) {
      logger.error(`Session ${sessionId} failed:`, {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Still schedule next session on error
      if (this.isRunning) {
        setTimeout(() => this.launchSession(), this.config.restartDelay);
      }
    }
  }

  async stop() {
    logger.info('Stopping traffic simulator...');
    this.isRunning = false;

    // Wait for all active sessions to complete
    const sessionPromises = Array.from(this.activeSessions).map(session =>
      session.stop().catch(err => logger.error('Error stopping session:', err))
    );

    await Promise.all(sessionPromises);
    logger.info('Traffic simulator stopped');
    process.exit(0);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeSessions: this.activeSessions.size,
      totalSessionsLaunched: this.sessionCounter,
      config: this.config
    };
  }
}

// Initialize and start simulator
const simulator = new TrafficSimulator();

async function main() {
  try {
    console.log('Starting traffic simulator...');
    await simulator.start();

    // Log status every 30 seconds
    setInterval(() => {
      console.log('Simulator status', simulator.getStatus());
    }, 30000);

  } catch (error) {
    console.error('Failed to start simulator:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TrafficSimulator;