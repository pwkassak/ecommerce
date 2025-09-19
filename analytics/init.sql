-- ClickHouse Analytics Database Schema for Ecommerce Analytics
-- This script initializes the analytics database with tables optimized for OLAP queries

-- Create the analytics database
CREATE DATABASE IF NOT EXISTS analytics;
USE analytics;

-- Main events table - stores all user interactions
CREATE TABLE IF NOT EXISTS events (
    timestamp DateTime64(3) DEFAULT now64(),
    event_id String DEFAULT generateUUIDv4(),
    session_id String,
    user_id Nullable(String),
    anonymous_id String,
    event_type LowCardinality(String),
    event_name String,
    page_url String,
    page_title Nullable(String),
    referrer Nullable(String),
    
    -- Event properties stored as JSON
    properties String DEFAULT '{}',
    
    -- User context
    user_agent String,
    ip_address IPv4,
    country LowCardinality(String) DEFAULT '',
    
    -- Technical metadata
    client_timestamp DateTime64(3),
    server_timestamp DateTime64(3) DEFAULT now64(),
    
    -- E-commerce specific fields (extracted from properties for performance)
    product_id Nullable(String),
    product_name Nullable(String),
    product_category Nullable(String),
    product_price Nullable(Float64),
    quantity Nullable(Int32),
    cart_value Nullable(Float64),
    currency LowCardinality(String) DEFAULT 'USD'
    
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (event_type, toDate(timestamp), timestamp, session_id)
SETTINGS index_granularity = 8192;

-- Sessions table - aggregated session data
CREATE TABLE IF NOT EXISTS sessions (
    session_id String,
    user_id Nullable(String),
    anonymous_id String,
    session_start DateTime64(3),
    session_end DateTime64(3),
    duration_seconds UInt32,
    page_views UInt32,
    events_count UInt32,
    
    -- First and last pages
    landing_page String,
    exit_page String,
    
    -- Traffic source
    referrer Nullable(String),
    utm_source Nullable(String),
    utm_medium Nullable(String),
    utm_campaign Nullable(String),
    
    -- Device info
    user_agent String,
    device_type LowCardinality(String) DEFAULT '',
    browser LowCardinality(String) DEFAULT '',
    os LowCardinality(String) DEFAULT '',
    
    -- Location
    country LowCardinality(String) DEFAULT '',
    
    -- E-commerce metrics
    cart_events UInt32 DEFAULT 0,
    checkout_events UInt32 DEFAULT 0,
    purchase_events UInt32 DEFAULT 0,
    revenue Float64 DEFAULT 0.0,
    
    -- Session quality indicators
    bounce Boolean DEFAULT false,
    converted Boolean DEFAULT false
    
) ENGINE = ReplacingMergeTree(session_end)
PARTITION BY toYYYYMM(session_start)
ORDER BY (session_id, session_start)
SETTINGS index_granularity = 8192;

-- Page views table - optimized for page analytics
CREATE TABLE IF NOT EXISTS page_views (
    timestamp DateTime64(3),
    session_id String,
    user_id Nullable(String),
    page_url String,
    page_title Nullable(String),
    referrer Nullable(String),
    
    -- Page performance metrics
    load_time_ms Nullable(UInt32),
    time_on_page_seconds Nullable(UInt32),
    
    -- Scroll depth and engagement
    scroll_depth_percent Nullable(UInt8),
    clicks_count UInt32 DEFAULT 0,
    
    -- Technical info
    user_agent String,
    viewport_width Nullable(UInt16),
    viewport_height Nullable(UInt16)
    
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (page_url, toDate(timestamp), timestamp)
SETTINGS index_granularity = 8192;

-- Products table - for product analytics
CREATE TABLE IF NOT EXISTS product_events (
    timestamp DateTime64(3),
    session_id String,
    user_id Nullable(String),
    event_type LowCardinality(String),
    
    product_id String,
    product_name String,
    product_category String,
    product_price Float64,
    
    -- Context of the product interaction
    list_name Nullable(String),  -- e.g., 'homepage', 'category-page', 'search-results'
    list_position Nullable(UInt32),
    
    -- For cart events
    quantity Nullable(UInt32),
    cart_value Nullable(Float64)
    
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (product_id, event_type, timestamp)
SETTINGS index_granularity = 8192;

-- Experiment assignments table - tracks which users see which experiment variations
CREATE TABLE IF NOT EXISTS experiment_assignments (
    timestamp DateTime64(3) DEFAULT now64(),
    assignment_id String DEFAULT generateUUIDv4(),
    session_id String,
    user_id Nullable(String),
    anonymous_id String,
    experiment_id String,
    variation_id String,
    experiment_name Nullable(String),
    variation_name Nullable(String),
    
    -- User context
    user_agent String,
    ip_address IPv4,
    country LowCardinality(String) DEFAULT '',
    
    -- Technical metadata
    client_timestamp DateTime64(3),
    server_timestamp DateTime64(3) DEFAULT now64()
    
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (experiment_id, anonymous_id, timestamp)
SETTINGS index_granularity = 8192;

-- Materialized view for real-time hourly aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_events_mv
TO hourly_events
AS SELECT
    toStartOfHour(timestamp) as hour,
    event_type,
    count() as event_count,
    uniq(session_id) as unique_sessions,
    uniq(user_id) as unique_users,
    uniq(anonymous_id) as unique_anonymous_users
FROM events
GROUP BY hour, event_type;

-- Table for materialized view data
CREATE TABLE IF NOT EXISTS hourly_events (
    hour DateTime,
    event_type LowCardinality(String),
    event_count UInt64,
    unique_sessions UInt64,
    unique_users UInt64,
    unique_anonymous_users UInt64
) ENGINE = SummingMergeTree()
ORDER BY (hour, event_type);

-- Daily product analytics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_product_stats_mv
TO daily_product_stats
AS SELECT
    toDate(timestamp) as date,
    product_id,
    product_name,
    product_category,
    event_type,
    count() as event_count,
    uniq(session_id) as unique_sessions,
    sum(quantity) as total_quantity,
    sum(cart_value) as total_cart_value
FROM product_events
GROUP BY date, product_id, product_name, product_category, event_type;

-- Table for daily product stats
CREATE TABLE IF NOT EXISTS daily_product_stats (
    date Date,
    product_id String,
    product_name String,
    product_category String,
    event_type LowCardinality(String),
    event_count UInt64,
    unique_sessions UInt64,
    total_quantity UInt64,
    total_cart_value Float64
) ENGINE = SummingMergeTree()
ORDER BY (date, product_id, event_type);

-- Funnel analysis table for conversion tracking
CREATE TABLE IF NOT EXISTS conversion_funnels (
    date Date,
    funnel_step LowCardinality(String),
    sessions_count UInt64,
    users_count UInt64,
    conversion_rate Float64
) ENGINE = ReplacingMergeTree()
ORDER BY (date, funnel_step);

-- Create some useful functions for analytics
-- Note: ClickHouse doesn't support user-defined functions in SQL, 
-- but we can create this as a view for common conversion funnel analysis

CREATE VIEW IF NOT EXISTS conversion_funnel_daily AS
WITH funnel_steps AS (
    SELECT
        toDate(timestamp) as date,
        session_id,
        groupUniqArray(event_type) as events_array,
        has(events_array, 'page_view') as has_page_view,
        has(events_array, 'product_view') as has_product_view,
        has(events_array, 'add_to_cart') as has_add_to_cart,
        has(events_array, 'checkout_start') as has_checkout_start,
        has(events_array, 'purchase') as has_purchase
    FROM events
    WHERE date >= today() - 30
    GROUP BY date, session_id
)
SELECT
    date,
    'Page View' as funnel_step,
    1 as step_number,
    countIf(has_page_view) as sessions_count,
    countIf(has_page_view) / count() as conversion_rate
FROM funnel_steps
GROUP BY date

UNION ALL

SELECT
    date,
    'Product View' as funnel_step,
    2 as step_number,
    countIf(has_product_view) as sessions_count,
    countIf(has_product_view) / countIf(has_page_view) as conversion_rate
FROM funnel_steps
WHERE has_page_view
GROUP BY date

UNION ALL

SELECT
    date,
    'Add to Cart' as funnel_step,
    3 as step_number,
    countIf(has_add_to_cart) as sessions_count,
    countIf(has_add_to_cart) / countIf(has_product_view) as conversion_rate
FROM funnel_steps
WHERE has_product_view
GROUP BY date

UNION ALL

SELECT
    date,
    'Checkout Start' as funnel_step,
    4 as step_number,
    countIf(has_checkout_start) as sessions_count,
    countIf(has_checkout_start) / countIf(has_add_to_cart) as conversion_rate
FROM funnel_steps
WHERE has_add_to_cart
GROUP BY date

UNION ALL

SELECT
    date,
    'Purchase' as funnel_step,
    5 as step_number,
    countIf(has_purchase) as sessions_count,
    countIf(has_purchase) / countIf(has_checkout_start) as conversion_rate
FROM funnel_steps
WHERE has_checkout_start
GROUP BY date

ORDER BY date, step_number;

-- Insert some sample data for testing
INSERT INTO events (session_id, user_id, anonymous_id, event_type, event_name, page_url, properties, user_agent, ip_address, client_timestamp) VALUES
('session_1', NULL, 'anon_1', 'page_view', 'HomePage Viewed', '/', '{"page_title":"CubeCraft - Home"}', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '127.0.0.1', now64()),
('session_1', NULL, 'anon_1', 'product_view', 'Product Viewed', '/products/1', '{"product_id":"1","product_name":"GAN 356 M 3x3 Speed Cube","product_category":"speed-cubes","product_price":39.99}', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '127.0.0.1', now64()),
('session_1', NULL, 'anon_1', 'add_to_cart', 'Product Added to Cart', '/products/1', '{"product_id":"1","product_name":"GAN 356 M 3x3 Speed Cube","quantity":1,"cart_value":39.99}', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '127.0.0.1', now64());