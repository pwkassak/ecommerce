import { createClient, ClickHouseClient } from '@clickhouse/client';
import type { 
  AnalyticsEvent, 
  PageViewEvent, 
  ProductEvent, 
  SessionData,
  AnalyticsQuery,
  DashboardMetrics,
  ConversionFunnel,
  TopProduct,
  EventBatch,
  ExperimentAssignment
} from '../types/analytics.js';

class ClickHouseService {
  private client: ClickHouseClient | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5 seconds
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Don't initialize client immediately - wait for first use
    // Don't start batch processing immediately to avoid connection issues
  }

  // Helper function to convert JavaScript ISO timestamp to ClickHouse format
  private formatTimestamp(isoString: string): string {
    // Convert "2025-09-12T13:28:53.204Z" to "2025-09-12 13:28:53.204"
    // Handle both ISO string and already formatted timestamps
    if (!isoString) return new Date().toISOString().replace('T', ' ').replace('Z', '');

    // If already formatted, return as-is
    if (isoString.includes(' ') && !isoString.includes('T')) {
      return isoString;
    }

    // Convert ISO to ClickHouse DateTime64 format
    return isoString.replace('T', ' ').replace('Z', '');
  }

  // Helper function to clean IPv6-formatted IPv4 addresses for ClickHouse
  private formatIpAddress(ip: string): string {
    // Convert "::ffff:192.168.65.1" to "192.168.65.1"
    if (ip.startsWith('::ffff:')) {
      return ip.replace('::ffff:', '');
    }
    return ip;
  }

  private initializeClient(): ClickHouseClient {
    const clientId = this.client ? `existing-${Date.now()}` : `new-${Date.now()}`;
    console.log('DEBUG: ClickHouse client:', this.client ? 'reusing existing' : 'creating new', 'ID:', clientId);
    console.log('DEBUG: Client connection state:', this.client ? 'active' : 'inactive');
    console.log('DEBUG: Batch timer running:', !!this.batchTimer);
    
    if (!this.client) {
      const config = {
        host: process.env.CLICKHOUSE_HOST || 'http://clickhouse:8123',
        username: process.env.CLICKHOUSE_USER || 'analytics_user',
        password: process.env.CLICKHOUSE_PASSWORD || 'analytics_password',
        database: process.env.CLICKHOUSE_DATABASE || 'analytics',
      };
      console.log('DEBUG: Actual env vars:', {
        host: process.env.CLICKHOUSE_HOST,
        user: process.env.CLICKHOUSE_USER,
        db: process.env.CLICKHOUSE_DATABASE
      });
      console.log('DEBUG: Final config:', config);
      
      this.client = createClient({
        ...config,
        clickhouse_settings: {
          async_insert: 1,
          wait_for_async_insert: 1,
        }
      });
      
      // Start batch processing only after client is initialized
      if (!this.batchTimer) {
        this.startBatchProcessing();
      }
    }
    return this.client;
  }

  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      this.flushEventQueue();
    }, this.flushInterval);
  }

  private async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToProcess = this.eventQueue.splice(0, this.batchSize);
    
    try {
      await this.insertEventsBatch(eventsToProcess);
      console.log(`✅ Inserted ${eventsToProcess.length} events to ClickHouse`);
    } catch (error) {
      console.error('❌ Failed to insert events batch:', error);
      // Re-add events to front of queue for retry
      this.eventQueue.unshift(...eventsToProcess);
    }
  }

  private async insertEventsBatch(events: AnalyticsEvent[]): Promise<void> {
    const timestamp = Date.now();
    console.log('DEBUG: === insertEventsBatch START ===', timestamp, 'events:', events.length);
    if (events.length === 0) return;

    const client = this.initializeClient();
    console.log('DEBUG: Client state before batch insert:', !!this.client, 'at', Date.now());

    try {
      // Log the first event for debugging
      if (events.length > 0) {
        console.log('DEBUG: Sample event structure:', JSON.stringify(events[0], null, 2));
      }

      await client.insert({
        table: 'events',
        values: events,
        format: 'JSONEachRow',
      });
      console.log('DEBUG: Batch insert successful at', Date.now());
    } catch (error: any) {
      console.error('DEBUG: Batch insert failed at', Date.now());
      console.error('ERROR Details:', error.message);
      console.error('ERROR Type:', error.constructor.name);

      // Log problematic events for debugging
      if (events.length > 0) {
        console.error('First event that failed:', JSON.stringify(events[0], null, 2));
      }

      throw error;
    }
    console.log('DEBUG: === insertEventsBatch END ===', Date.now());
  }

  // Public API methods

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Add server timestamp and defaults with proper formatting
      const now = new Date().toISOString();

      const enrichedEvent: AnalyticsEvent = {
        ...event,
        timestamp: event.timestamp ? this.formatTimestamp(event.timestamp) : this.formatTimestamp(now),
        server_timestamp: this.formatTimestamp(now),
        ip_address: this.formatIpAddress(event.ip_address),
        currency: event.currency || 'USD',
        properties: event.properties || '{}',
        // Ensure client_timestamp is properly formatted if present
        client_timestamp: event.client_timestamp ? this.formatTimestamp(event.client_timestamp) : this.formatTimestamp(now)
      };

      console.log('DEBUG: Enriched event before queueing:', {
        eventId: enrichedEvent.event_id,
        timestamp: enrichedEvent.timestamp,
        server_timestamp: enrichedEvent.server_timestamp,
        client_timestamp: enrichedEvent.client_timestamp
      });

      // Add to queue for batch processing
      this.eventQueue.push(enrichedEvent);

      // If queue is full, flush immediately
      if (this.eventQueue.length >= this.batchSize) {
        await this.flushEventQueue();
      }
    } catch (error) {
      console.error('ERROR: trackEvent failed:', error);
      console.error('ERROR: Problematic event:', JSON.stringify(event, null, 2));
      throw error;
    }
  }

  async trackPageView(pageView: PageViewEvent): Promise<void> {
    const timestamp = Date.now();
    console.log('DEBUG: === trackPageView START ===', timestamp);
    console.log('DEBUG: Page view input:', pageView);
    
    // Format timestamp for ClickHouse compatibility
    const formattedPageView = {
      ...pageView,
      timestamp: this.formatTimestamp(pageView.timestamp)
    };
    console.log('DEBUG: Formatted page view:', formattedPageView);
    
    const client = this.initializeClient();
    console.log('DEBUG: Client state before page view insert:', !!this.client, 'at', Date.now());
    
    try {
      await client.insert({
        table: 'page_views',
        values: [formattedPageView],
        format: 'JSONEachRow',
      });
      console.log('DEBUG: Page view insert successful at', Date.now());
    } catch (error) {
      console.error('DEBUG: Page view insert failed at', Date.now(), ':', error);
      throw error;
    }
    console.log('DEBUG: === trackPageView END ===', Date.now());
  }

  async trackProductEvent(productEvent: ProductEvent): Promise<void> {
    // Format timestamp for ClickHouse compatibility
    const formattedProductEvent = {
      ...productEvent,
      timestamp: this.formatTimestamp(productEvent.timestamp)
    };
    
    const client = this.initializeClient();
    await client.insert({
      table: 'product_events',
      values: [formattedProductEvent],
      format: 'JSONEachRow',
    });
  }

  async trackExperimentAssignment(assignment: ExperimentAssignment): Promise<void> {
    const timestamp = Date.now();
    console.log('DEBUG: === trackExperimentAssignment START ===', timestamp);
    console.log('DEBUG: Experiment assignment input:', assignment);
    
    // Add server timestamp and defaults with proper formatting
    const now = new Date().toISOString();
    const enrichedAssignment: ExperimentAssignment = {
      assignment_id: assignment.assignment_id,
      session_id: assignment.session_id,
      user_id: assignment.user_id,
      anonymous_id: assignment.anonymous_id,
      experiment_id: assignment.experiment_id,
      variation_id: assignment.variation_id,
      experiment_name: assignment.experiment_name,
      variation_name: assignment.variation_name,
      user_agent: assignment.user_agent,
      country: assignment.country || '',
      timestamp: assignment.timestamp ? this.formatTimestamp(assignment.timestamp) : this.formatTimestamp(now),
      server_timestamp: this.formatTimestamp(now),
      client_timestamp: assignment.client_timestamp ? this.formatTimestamp(assignment.client_timestamp) : this.formatTimestamp(now),
      ip_address: this.formatIpAddress(assignment.ip_address)
    };
    console.log('DEBUG: Formatted assignment:', enrichedAssignment);

    const client = this.initializeClient();
    console.log('DEBUG: Client state before experiment assignment insert:', !!this.client, 'at', Date.now());
    
    try {
      await client.insert({
        table: 'experiment_assignments',
        values: [enrichedAssignment],
        format: 'JSONEachRow',
      });
      console.log('DEBUG: Experiment assignment insert successful at', Date.now());
    } catch (error) {
      console.error('DEBUG: Experiment assignment insert failed at', Date.now(), ':', error);
      throw error;
    }
    console.log('DEBUG: === trackExperimentAssignment END ===', Date.now());
  }

  async getDashboardMetrics(query: AnalyticsQuery = {}): Promise<DashboardMetrics> {
    const client = this.initializeClient();
    
    // Simple queries for basic metrics
    try {
      const [sessionsResult, usersResult, pageViewsResult] = await Promise.all([
        client.query({
          query: "SELECT count(DISTINCT session_id) as total_sessions FROM events WHERE timestamp >= now() - INTERVAL 7 DAY",
          format: 'JSONEachRow'
        }),
        client.query({
          query: "SELECT count(DISTINCT coalesce(user_id, anonymous_id)) as unique_users FROM events WHERE timestamp >= now() - INTERVAL 7 DAY",
          format: 'JSONEachRow'
        }),
        client.query({
          query: "SELECT count() as page_views FROM events WHERE event_type = 'page_view' AND timestamp >= now() - INTERVAL 7 DAY",
          format: 'JSONEachRow'
        })
      ]);

      const sessions = await sessionsResult.json() as any[];
      const users = await usersResult.json() as any[];  
      const pageViews = await pageViewsResult.json() as any[];

      return {
        total_sessions: sessions[0]?.total_sessions || 0,
        unique_users: users[0]?.unique_users || 0,
        page_views: pageViews[0]?.page_views || 0,
        bounce_rate: 0, // Placeholder
        avg_session_duration: 0, // Placeholder  
        conversion_rate: 0, // Placeholder
        total_revenue: 0 // Placeholder
      };
    } catch (error) {
      console.error('Dashboard metrics query error:', error);
      return {
        total_sessions: 0,
        unique_users: 0,
        page_views: 0,
        bounce_rate: 0,
        avg_session_duration: 0,
        conversion_rate: 0,
        total_revenue: 0
      };
    }
  }

  async getConversionFunnel(query: AnalyticsQuery = {}): Promise<ConversionFunnel[]> {
    // Return empty funnel for now since we don't have conversion funnel data
    return [];
  }

  async getTopProducts(query: AnalyticsQuery = {}): Promise<TopProduct[]> {
    // Return empty products for now since we don't have product event data
    return [];
  }

  async getRecentEvents(query: AnalyticsQuery = {}): Promise<AnalyticsEvent[]> {
    const client = this.initializeClient();
    const limit = query.limit || 50;
    
    try {
      const result = await client.query({
        query: `SELECT * FROM events ORDER BY timestamp DESC LIMIT ${limit}`,
        format: 'JSONEachRow',
      });
      
      return await result.json() as AnalyticsEvent[];
    } catch (error) {
      console.error('Recent events query error:', error);
      return [];
    }
  }

  async getEventCounts(query: AnalyticsQuery = {}): Promise<Record<string, number>> {
    const client = this.initializeClient();
    
    try {
      const result = await client.query({
        query: "SELECT event_type, count() as count FROM events WHERE timestamp >= now() - INTERVAL 7 DAY GROUP BY event_type ORDER BY count DESC",
        format: 'JSONEachRow',
      });

      const rows = await result.json() as { event_type: string; count: number }[];
      
      return rows.reduce((acc, row) => {
        acc[row.event_type] = row.count;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.error('Event counts query error:', error);
      return {};
    }
  }

  async close(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    // Flush any remaining events
    await this.flushEventQueue();
    
    if (this.client) {
      await this.client.close();
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const client = this.initializeClient();
      const result = await client.query({
        query: 'SELECT 1',
        format: 'JSONEachRow',
      });
      return true;
    } catch (error) {
      console.error('ClickHouse ping failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const clickHouseService = new ClickHouseService();
export default ClickHouseService;