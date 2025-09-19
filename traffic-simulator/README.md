# Traffic Simulator

A headless browser traffic simulator for testing the ecommerce application with realistic user behavior patterns.

## Features

- **Configurable concurrent browsers**: Run multiple browser sessions simultaneously
- **Realistic user behavior**: Random browsing, shopping, and checkout actions
- **Session management**: Short-lived sessions with configurable duration
- **Comprehensive logging**: Structured logging with session tracking
- **Docker integration**: Runs as a service in docker-compose
- **Resource management**: Proper cleanup and resource limits

## Quick Start

### Using Docker Compose (Recommended)

The simulator is already configured in `docker-compose.dev.yml` and will start automatically:

```bash
# Start all services including the traffic simulator
docker-compose -f docker-compose.dev.yml up -d

# View simulator logs
docker-compose -f docker-compose.dev.yml logs traffic-simulator

# Stop the simulator
docker-compose -f docker-compose.dev.yml stop traffic-simulator
```

### Manual Configuration

To modify the simulator settings, edit the environment variables in `docker-compose.dev.yml`:

```yaml
environment:
  CONCURRENT_BROWSERS: 3        # Number of parallel browser sessions
  SESSION_DURATION_MIN: 30      # Minimum session length (seconds)
  SESSION_DURATION_MAX: 90      # Maximum session length (seconds)
  TARGET_URL: http://frontend:3002
  RESTART_DELAY: 3000          # Delay between session launches (ms)
  LOG_LEVEL: info              # Logging verbosity (debug, info, warn, error)
```

## User Behaviors

Each browser session randomly performs these actions:

### Navigation Actions
- Browse homepage
- Navigate to product categories
- View product detail pages

### Shopping Actions
- Add items to cart (1-3 items per action)
- View cart contents
- Update item quantities
- Remove items from cart

### Checkout Actions
- Proceed to checkout
- Fill checkout form with test data
- Complete order (simulated)

## Monitoring

### Log Output
The simulator provides structured logging with:
- Session lifecycle events
- Action completion tracking
- Performance metrics
- Error handling and recovery

### Log Files
Logs are persisted to `./traffic-simulator/logs/`:
- `traffic-simulator.log` - Main application logs
- `errors.log` - Error-specific logs
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

### Health Monitoring
The container includes a health check that monitors the simulator process.

## Development

### Running Locally

```bash
cd traffic-simulator
npm install
npm start
```

Set environment variables for local development:
```bash
export TARGET_URL=http://localhost:3002
export CONCURRENT_BROWSERS=2
export LOG_LEVEL=debug
npm start
```

### Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `CONCURRENT_BROWSERS` | 5 | Number of parallel browser sessions |
| `SESSION_DURATION_MIN` | 30 | Minimum session duration (seconds) |
| `SESSION_DURATION_MAX` | 120 | Maximum session duration (seconds) |
| `TARGET_URL` | http://frontend:3002 | Application URL to test |
| `RESTART_DELAY` | 2000 | Delay between session launches (ms) |
| `LOG_LEVEL` | info | Logging level (debug/info/warn/error) |
| `NODE_ENV` | production | Node environment |

## Architecture

### Components

- **`simulator.js`** - Main orchestrator that manages browser sessions
- **`browser-session.js`** - Individual browser session handler
- **`user-actions.js`** - Defines realistic user behavior patterns
- **`logger.js`** - Structured logging with session tracking

### Resource Management

- **Memory limit**: 2GB maximum, 512MB reserved
- **CPU limit**: 1.0 CPU maximum, 0.5 CPU reserved
- **Session cleanup**: Automatic browser cleanup on session end
- **Graceful shutdown**: Handles SIGTERM/SIGINT for clean exits

## Use Cases

### Feature Flag Testing
The simulator generates realistic traffic patterns for testing:
- A/B testing scenarios
- Feature rollout validation
- GrowthBook integration testing

### Performance Testing
- Load testing with realistic user patterns
- Analytics data generation
- Database performance under load

### System Validation
- End-to-end testing in staging environments
- Integration testing with external services
- Monitoring and alerting validation

## Troubleshooting

### Common Issues

**Simulator not starting:**
- Check that frontend service is running and accessible
- Verify network connectivity between containers
- Check logs for browser launch errors

**High resource usage:**
- Reduce `CONCURRENT_BROWSERS` setting
- Increase `RESTART_DELAY` to reduce session frequency
- Monitor container resource limits

**Test failures:**
- Verify frontend application is fully loaded
- Check for changes in CSS selectors
- Review error logs for specific failures

### Log Analysis

```bash
# Follow live logs
docker-compose -f docker-compose.dev.yml logs -f traffic-simulator

# Search for errors
docker-compose -f docker-compose.dev.yml logs traffic-simulator | grep ERROR

# View session statistics
docker-compose -f docker-compose.dev.yml logs traffic-simulator | grep "Simulator status"
```