// Analytics types for ClickHouse integration

export interface AnalyticsEvent {
  event_id?: string;
  timestamp?: string;
  session_id: string;
  user_id?: string | null;
  anonymous_id: string;
  event_type: string;
  event_name: string;
  page_url: string;
  page_title?: string | null;
  referrer?: string | null;
  properties?: string; // JSON string
  user_agent: string;
  ip_address: string;
  client_timestamp: string;
  server_timestamp?: string;
  
  // E-commerce specific fields
  product_id?: string | null;
  product_name?: string | null;
  product_category?: string | null;
  product_price?: number | null;
  quantity?: number | null;
  cart_value?: number | null;
  currency?: string;
}

export interface PageViewEvent {
  timestamp: string;
  session_id: string;
  user_id?: string | null;
  page_url: string;
  page_title?: string | null;
  referrer?: string | null;
  load_time_ms?: number | null;
  time_on_page_seconds?: number | null;
  scroll_depth_percent?: number | null;
  clicks_count?: number;
  user_agent: string;
  viewport_width?: number | null;
  viewport_height?: number | null;
}

export interface ProductEvent {
  timestamp: string;
  session_id: string;
  user_id?: string | null;
  event_type: string;
  product_id: string;
  product_name: string;
  product_category: string;
  product_price: number;
  list_name?: string | null;
  list_position?: number | null;
  quantity?: number | null;
  cart_value?: number | null;
}

export interface SessionData {
  session_id: string;
  user_id?: string | null;
  anonymous_id: string;
  session_start: string;
  session_end: string;
  duration_seconds: number;
  page_views: number;
  events_count: number;
  landing_page: string;
  exit_page: string;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  user_agent: string;
  device_type?: string;
  browser?: string;
  os?: string;
  country?: string;
  cart_events?: number;
  checkout_events?: number;
  purchase_events?: number;
  revenue?: number;
  bounce?: boolean;
  converted?: boolean;
}

export interface AnalyticsQuery {
  start_date?: string;
  end_date?: string;
  event_types?: string[];
  user_id?: string;
  session_id?: string;
  page_url?: string;
  product_id?: string;
  limit?: number;
  offset?: number;
}

export interface DashboardMetrics {
  total_sessions: number;
  unique_users: number;
  page_views: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversion_rate: number;
  total_revenue: number;
}

export interface ConversionFunnel {
  step: string;
  sessions_count: number;
  conversion_rate: number;
  drop_off_rate: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  product_category: string;
  views: number;
  add_to_cart: number;
  purchases: number;
  revenue: number;
  conversion_rate: number;
}

export interface EventBatch {
  events: AnalyticsEvent[];
  batch_id: string;
  timestamp: string;
  count: number;
}