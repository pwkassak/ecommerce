import { Router, Request, Response } from 'express';
import { randomUUID as uuidv4 } from 'crypto';
import { clickHouseService } from '../services/clickhouse.js';

const router = Router();

// Helper function to clean IPv6-formatted IPv4 addresses for ClickHouse
function formatIpAddress(ip: string): string {
  // Convert "::ffff:192.168.65.1" to "192.168.65.1"
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }
  return ip;
}

// Helper function to convert JavaScript ISO timestamp to ClickHouse format
function formatTimestamp(isoString: string): string {
  // Convert "2025-09-12T13:28:53.204Z" to "2025-09-12 13:28:53.204"
  return isoString.replace('T', ' ').replace('Z', '');
}

// POST /api/analytics/events - Track single analytics event
router.post('/events', async (req: Request, res: Response) => {
  try {
    console.log('📊 Single event received:', {
      event_type: req.body.event_type,
      event_name: req.body.event_name,
      page_url: req.body.page_url
    });
    
    const eventData = {
      event_id: uuidv4(),
      timestamp: new Date().toISOString(),
      user_agent: req.get('User-Agent') || '',
      ip_address: formatIpAddress(req.ip || '127.0.0.1'),
      server_timestamp: new Date().toISOString(),
      properties: JSON.stringify(req.body.properties || {}),
      currency: req.body.currency || 'USD',
      ...req.body,
      // Format client_timestamp if present
      ...(req.body.client_timestamp && {
        client_timestamp: formatTimestamp(req.body.client_timestamp)
      })
    };

    await clickHouseService.trackEvent(eventData);

    res.json({
      success: true,
      message: 'Event tracked successfully',
      data: { event_id: eventData.event_id }
    });
  } catch (error: any) {
    console.error('❌ Error tracking single event:', error);
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
    console.log(`📋 Batch events received: ${events?.length || 0} events`);

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'events must be a non-empty array',
        data: null
      });
    }

    // Process events simply
    const processedEvents = events.map(eventData => ({
      event_id: uuidv4(),
      timestamp: new Date().toISOString(),
      user_agent: req.get('User-Agent') || '',
      ip_address: formatIpAddress(req.ip || '127.0.0.1'),
      server_timestamp: new Date().toISOString(),
      properties: JSON.stringify(eventData.properties || {}),
      currency: eventData.currency || 'USD',
      ...eventData,
      // Format client_timestamp if present
      ...(eventData.client_timestamp && {
        client_timestamp: formatTimestamp(eventData.client_timestamp)
      })
    }));

    // Track all events
    for (const event of processedEvents) {
      await clickHouseService.trackEvent(event);
    }

    console.log(`✅ Successfully tracked ${processedEvents.length} events`);
    res.json({
      success: true,
      message: `${processedEvents.length} events tracked successfully`,
      data: { processed_count: processedEvents.length }
    });
  } catch (error: any) {
    console.error('❌ Error tracking batch events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track batch events',
      data: null
    });
  }
});

// POST /api/analytics/page-view - Track dedicated page view events
router.post('/page-view', async (req: Request, res: Response) => {
  try {
    console.log('📄 Page view received:', {
      page_url: req.body.page_url,
      page_title: req.body.page_title
    });
    
    const pageViewData = {
      timestamp: new Date().toISOString(),
      user_agent: req.get('User-Agent') || '',
      ...req.body
    };

    await clickHouseService.trackPageView(pageViewData);

    res.json({
      success: true,
      message: 'Page view tracked successfully',
      data: { tracked: true }
    });
  } catch (error: any) {
    console.error('❌ Error tracking page view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track page view',
      data: null
    });
  }
});

// GET /api/analytics/dashboard - Get dashboard metrics
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const metrics = await clickHouseService.getDashboardMetrics();

    res.json({
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: metrics
    });
  } catch (error: any) {
    console.error('❌ Error getting dashboard metrics:', error);
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
    const funnel = await clickHouseService.getConversionFunnel();

    res.json({
      success: true,
      message: 'Conversion funnel data retrieved successfully',
      data: funnel
    });
  } catch (error: any) {
    console.error('❌ Error getting conversion funnel:', error);
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
    const limit = parseInt(req.query.limit as string) || 10;
    const topProducts = await clickHouseService.getTopProducts({ limit });

    res.json({
      success: true,
      message: 'Top products retrieved successfully',
      data: topProducts
    });
  } catch (error: any) {
    console.error('❌ Error getting top products:', error);
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
    const limit = parseInt(req.query.limit as string) || 50;
    const recentEvents = await clickHouseService.getRecentEvents({ limit });

    res.json({
      success: true,
      message: 'Recent events retrieved successfully',
      data: recentEvents
    });
  } catch (error: any) {
    console.error('❌ Error getting recent events:', error);
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

    res.json({
      success: true,
      message: 'Event counts retrieved successfully',
      data: eventCounts
    });
  } catch (error: any) {
    console.error('❌ Error getting event counts:', error);
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
    console.error('❌ Analytics health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Analytics service health check failed',
      data: { status: 'error', error: error.message }
    });
  }
});

export default router;