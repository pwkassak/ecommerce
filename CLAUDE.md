# Ecommerce Testing Site

This is a minimal ecommerce site designed for testing feature flags and A/B testing platform integrations.

## Purpose
- Test feature flag implementations
- Validate A/B testing platform functionality
- Provide a simple storefront for integration testing

## Development Guidelines

### Docker Management
**IMPORTANT:** Always use `docker-compose` commands to manage services, not raw `docker` commands.

**Correct approach:**
```bash
# Restart a service
docker-compose -f docker-compose.dev.yml restart backend

# Rebuild and restart
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml up -d backend

# View logs
docker-compose -f docker-compose.dev.yml logs backend
```

**Avoid:** Raw docker commands like `docker stop`, `docker restart`, etc.

### Documentation Resources

**GrowthBook Documentation:** https://docs.growthbook.io

When implementing or debugging GrowthBook features, Claude should always consult the official documentation first to understand current best practices and API specifications.