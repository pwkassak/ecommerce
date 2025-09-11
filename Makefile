# CubeCraft Ecommerce Makefile

.PHONY: help dev prod build up down logs clean reset

# Default target
help:
	@echo "CubeCraft Ecommerce Commands:"
	@echo ""
	@echo "  dev      - Start development environment"
	@echo "  prod     - Start production environment"
	@echo "  build    - Build all Docker images"
	@echo "  up       - Start all services"
	@echo "  down     - Stop all services"
	@echo "  logs     - View logs from all services"
	@echo "  clean    - Remove containers and images"
	@echo "  reset    - Reset everything (clean + rebuild)"
	@echo "  ssl      - Generate SSL certificates"
	@echo ""

# Development environment
dev:
	@echo "🚀 Starting CubeCraft development environment..."
	docker-compose -f docker-compose.dev.yml up --build -d
	@echo "✅ Development environment started!"
	@echo "🌐 Frontend: https://localhost:3002"
	@echo "🔗 Backend API: http://localhost:5001"
	@echo "🗄️  Database: localhost:5432"

# Production environment
prod:
	@echo "🚀 Starting CubeCraft production environment..."
	docker-compose up --build -d
	@echo "✅ Production environment started!"
	@echo "🌐 Frontend: https://localhost:3002"
	@echo "🔗 Backend API: http://localhost:5001"

# Build all images
build:
	@echo "🔨 Building all Docker images..."
	docker-compose build
	docker-compose -f docker-compose.dev.yml build
	@echo "✅ All images built!"

# Start services
up:
	docker-compose up -d

# Stop services
down:
	@echo "🛑 Stopping all services..."
	docker-compose down
	docker-compose -f docker-compose.dev.yml down
	@echo "✅ All services stopped!"

# View logs
logs:
	docker-compose logs -f

# Clean up containers and images
clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v --rmi local
	docker-compose -f docker-compose.dev.yml down -v --rmi local
	docker system prune -f
	@echo "✅ Cleanup complete!"

# Reset everything
reset: clean
	@echo "🔄 Resetting everything..."
	$(MAKE) build
	@echo "✅ Reset complete!"

# Generate SSL certificates
ssl:
	@echo "🔐 Generating SSL certificates..."
	mkdir -p ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout ssl/nginx.key \
		-out ssl/nginx.crt \
		-subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
	@echo "✅ SSL certificates generated!"

# Development shortcuts
dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-down:
	docker-compose -f docker-compose.dev.yml down

# Database operations
db-reset:
	@echo "🗄️  Resetting database..."
	docker-compose down postgres
	docker volume rm cubes_postgres_data || true
	docker volume rm cubes_postgres_data_dev || true
	docker-compose up -d postgres
	@echo "✅ Database reset complete!"

# Health checks
health:
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:5001/api/health && echo "✅ Backend healthy" || echo "❌ Backend unhealthy"
	@curl -f -k https://localhost:3002/health && echo "✅ Frontend healthy" || echo "❌ Frontend unhealthy"