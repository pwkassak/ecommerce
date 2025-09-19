import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID as uuidv4 } from 'crypto';
import { clickHouseService } from '../services/clickhouse.js';
import type { AnalyticsEvent, PageViewEvent, ProductEvent, AnalyticsQuery, ExperimentAssignment } from '../types/analytics.js';
import { ApiResponse } from '../types/index.js';

// Helper function to clean IPv6-formatted IPv4 addresses for ClickHouse
const formatIpAddress = (ip: string): string => {
  // Convert "::ffff:192.168.65.1" to "192.168.65.1"
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }
  return ip;
};

const router = Router();

// Extend Request interface to include analytics data
declare module 'express-serve-static-core' {
  interface Request {
    analytics?: {
      timestamp: string;
      user_agent: string;
      ip_address: string;
      server_timestamp: string;
    };
  }
}

// Middleware for parsing analytics events
const parseAnalyticsRequest = (req: Request, res: Response, next: NextFunction) => {
  // Extract common fields from headers and request
  req.analytics = {
    timestamp: new Date().toISOString(),
    user_agent: req.get('User-Agent') || '',
    ip_address: formatIpAddress(req.ip || '127.0.0.1'),
    server_timestamp: new Date().toISOString()
  };
  next();
};

router.use(parseAnalyticsRequest);

// POST /api/analytics/events - Track analytics events
router.post('/events', async (req: Request, res: Response) => {
  try {
    const {
      session_id,
      user_id = null,
      anonymous_id,
      event_type,
      event_name,
      page_url,
      page_title = null,
      referrer = null,
      properties = {},
      client_timestamp,
      
      // E-commerce specific fields
      product_id = null,
      product_name = null,
      product_category = null,
      product_price = null,
      quantity = null,
      cart_value = null,
      currency = 'USD'
    } = req.body;

    // Validate required fields
    if (!session_id || !anonymous_id || !event_type || !event_name || !page_url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: session_id, anonymous_id, event_type, event_name, page_url',
        data: null
      });
    }

    const event: AnalyticsEvent = {
      event_id: uuidv4(),
      timestamp: req.analytics.timestamp,
      session_id,
      user_id,
      anonymous_id,
      event_type,
      event_name,
      page_url,
      page_title,
      referrer,
      properties: JSON.stringify(properties),
      user_agent: req.analytics.user_agent,
      ip_address: req.analytics.ip_address,
      client_timestamp: client_timestamp || req.analytics.timestamp,
      server_timestamp: req.analytics.server_timestamp,
      
      // E-commerce fields
      product_id,
      product_name,
      product_category,
      product_price,
      quantity,
      cart_value,
      currency
    };

    await clickHouseService.trackEvent(event);

    const response: ApiResponse<{ event_id: string }> = {
      success: true,
      message: 'Event tracked successfully',
      data: { event_id: event.event_id! }
    };

    res.json(response);
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
      data: null
    });
  }
});

// POST /api/analytics/events/batch - Track multiple events in batch
router.post('/events/batch', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'events must be a non-empty array',
        data: null
      });
    }

    const processedEvents: AnalyticsEvent[] = events.map(eventData => ({
      event_id: uuidv4(),
      timestamp: req.analytics.timestamp,
      user_agent: req.analytics.user_agent,
      ip_address: req.analytics.ip_address,
      server_timestamp: req.analytics.server_timestamp,
      properties: JSON.stringify(eventData.properties || {}),
      currency: eventData.currency || 'USD',
      ...eventData
    }));

    // Track all events
    for (const event of processedEvents) {
      await clickHouseService.trackEvent(event);
    }

    const response: ApiResponse<{ processed_count: number }> = {
      success: true,
      message: `${processedEvents.length} events tracked successfully`,
      data: { processed_count: processedEvents.length }
    };

    res.json(response);
  } catch (error) {
    console.error('Error tracking batch events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track batch events',
      data: null
    });
  }
});

// POST /api/analytics/page-view - Track page view
router.post('/page-view', async (req: Request, res: Response) => {
  try {
    const {
      session_id,
      user_id = null,
      page_url,
      page_title = null,
      referrer = null,
      load_time_ms = null,
      time_on_page_seconds = null,
      scroll_depth_percent = null,
      clicks_count = 0,
      viewport_width = null,
      viewport_height = null
    } = req.body;

    if (!session_id || !page_url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: session_id, page_url',
        data: null
      });
    }

    const pageView: PageViewEvent = {
      timestamp: req.analytics.timestamp,
      session_id,
      user_id,
      page_url,
      page_title,
      referrer,
      load_time_ms,
      time_on_page_seconds,
      scroll_depth_percent,
      clicks_count,
      user_agent: req.analytics.user_agent,
      viewport_width,
      viewport_height
    };

    await clickHouseService.trackPageView(pageView);

    const response: ApiResponse<{ tracked: boolean }> = {
      success: true,
      message: 'Page view tracked successfully',
      data: { tracked: true }
    };

    res.json(response);
  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track page view',
      data: null
    });
  }
});

// POST /api/analytics/experiment-assignment - Track experiment assignment
router.post('/experiment-assignment', async (req: Request, res: Response) => {
  try {
    const {
      session_id,
      user_id = null,
      anonymous_id,
      experiment_id,
      variation_id,
      experiment_name = null,
      variation_name = null,
      client_timestamp
    } = req.body;

    // Validate required fields
    if (!session_id || !anonymous_id || !experiment_id || !variation_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: session_id, anonymous_id, experiment_id, variation_id',
        data: null
      });
    }

    const assignment: ExperimentAssignment = {
      assignment_id: uuidv4(),
      timestamp: req.analytics.timestamp,
      session_id,
      user_id,
      anonymous_id,
      experiment_id,
      variation_id,
      experiment_name,
      variation_name,
      user_agent: req.analytics.user_agent,
      ip_address: req.analytics.ip_address,
      client_timestamp: client_timestamp || req.analytics.timestamp,
      server_timestamp: req.analytics.server_timestamp
    };

    await clickHouseService.trackExperimentAssignment(assignment);

    const response: ApiResponse<{ assignment_id: string }> = {
      success: true,
      message: 'Experiment assignment tracked successfully',
      data: { assignment_id: assignment.assignment_id! }
    };

    res.json(response);
  } catch (error) {
    console.error('Error tracking experiment assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track experiment assignment',
      data: null
    });
  }
});

// GET /api/analytics/dashboard - Get dashboard metrics
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const query: AnalyticsQuery = {
      start_date: req.query.start_date as string || '7 days',
      end_date: req.query.end_date as string || 'now()',
    };

    const metrics = await clickHouseService.getDashboardMetrics(query);

    const response: ApiResponse<typeof metrics> = {
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: metrics
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard metrics',
      data: null
    });
  }
});

// GET /api/analytics/funnel - Get conversion funnel data
router.get('/funnel', async (req: Request, res: Response) => {
  try {
    const query: AnalyticsQuery = {
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    const funnel = await clickHouseService.getConversionFunnel(query);

    const response: ApiResponse<typeof funnel> = {
      success: true,
      message: 'Conversion funnel data retrieved successfully',
      data: funnel
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting conversion funnel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversion funnel',
      data: null
    });
  }
});

// GET /api/analytics/products/top - Get top products
router.get('/products/top', async (req: Request, res: Response) => {
  try {
    const query: AnalyticsQuery = {
      limit: parseInt(req.query.limit as string) || 10,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    const topProducts = await clickHouseService.getTopProducts(query);

    const response: ApiResponse<typeof topProducts> = {
      success: true,
      message: 'Top products retrieved successfully',
      data: topProducts
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting top products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top products',
      data: null
    });
  }
});

// GET /api/analytics/events/recent - Get recent events
router.get('/events/recent', async (req: Request, res: Response) => {
  try {
    const query: AnalyticsQuery = {
      limit: parseInt(req.query.limit as string) || 50,
    };

    const recentEvents = await clickHouseService.getRecentEvents(query);

    const response: ApiResponse<typeof recentEvents> = {
      success: true,
      message: 'Recent events retrieved successfully',
      data: recentEvents
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting recent events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent events',
      data: null
    });
  }
});

// GET /api/analytics/events/counts - Get event type counts
router.get('/events/counts', async (req: Request, res: Response) => {
  try {
    const eventCounts = await clickHouseService.getEventCounts();

    const response: ApiResponse<typeof eventCounts> = {
      success: true,
      message: 'Event counts retrieved successfully',
      data: eventCounts
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting event counts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event counts',
      data: null
    });
  }
});

// GET /api/analytics/health - Health check for analytics service
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await clickHouseService.ping();

    if (isHealthy) {
      res.json({
        success: true,
        message: 'Analytics service is healthy',
        data: { status: 'healthy', timestamp: new Date().toISOString() }
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Analytics service is unhealthy',
        data: { status: 'unhealthy', timestamp: new Date().toISOString() }
      });
    }
  } catch (error: any) {
    console.error('Analytics health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Analytics service health check failed',
      data: { status: 'error', error: error.message }
    });
  }
});

export default router;