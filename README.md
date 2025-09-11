# CubeCraft Ecommerce

A minimal ecommerce application built for testing feature flags and A/B testing platform integrations. This application simulates a puzzle cube store with a complete shopping experience.

## Features

### Frontend (React + TypeScript)
- **Homepage**: Hero section, featured products, category navigation
- **Product Catalog**: Category browsing with filters and sorting  
- **Product Details**: Detailed product pages with specifications and image gallery
- **Shopping Cart**: Add/remove items, quantity management
- **Checkout Flow**: Customer information, payment form, order confirmation
- **Responsive Design**: Mobile-first design with modern UI components

### Backend (Node.js + Express + TypeScript)
- **Product API**: RESTful endpoints for product management
- **Order Management**: Order creation and status tracking
- **Database Integration**: PostgreSQL with comprehensive schema
- **CORS & Security**: Proper security headers and CORS configuration

### Infrastructure
- **Docker Compose**: Multi-service containerized setup
- **HTTPS Support**: SSL certificates and secure communication
- **Database**: PostgreSQL with sample data seeding
- **Development & Production**: Separate configurations for each environment

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Make (optional, for convenience commands)

### Running with Make (Recommended)

```bash
# Start development environment
make dev

# Start production environment  
make prod

# View logs
make logs

# Stop services
make down

# Reset everything
make reset
```

### Manual Docker Commands

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build -d

# Production
docker-compose up --build -d

# Stop services
docker-compose down
```

### Accessing the Application

- **Frontend**: https://localhost:3002 (HTTPS)
- **Backend API**: http://localhost:5001
- **Database**: localhost:5433

## Project Structure

```
├── frontend/           # React TypeScript application
│   ├── src/
│   │   ├── components/ # Reusable React components
│   │   ├── pages/      # Page components
│   │   ├── contexts/   # React context providers
│   │   ├── types/      # TypeScript type definitions
│   │   └── utils/      # Utility functions
│   ├── Dockerfile      # Production container
│   └── Dockerfile.dev  # Development container
├── backend/            # Node.js Express API
│   ├── src/
│   │   ├── routes/     # API route handlers
│   │   ├── models/     # Data models and business logic
│   │   ├── types/      # TypeScript interfaces
│   │   └── middleware/ # Express middleware
│   ├── Dockerfile      # Production container
│   └── Dockerfile.dev  # Development container
├── database/           # PostgreSQL schema and seeds
│   ├── init.sql        # Database schema
│   └── seed.sql        # Sample data
├── docker-compose.yml      # Production services
├── docker-compose.dev.yml  # Development services
└── Makefile               # Convenience commands
```

## API Endpoints

### Products
- `GET /api/products` - List all products with filtering
- `GET /api/products/featured` - Get featured products
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/:id` - Get product details

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders?email=...` - Get orders by customer email

### Health
- `GET /api/health` - API health check

## Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development  
```bash
cd backend
npm install
npm run dev
```

### Database Management
```bash
# Reset database
make db-reset

# View database logs
docker-compose logs postgres
```

## Sample Products

The application includes sample puzzle cube products:

- **Speed Cubes**: GAN 356 M, MoYu Weilong WR M, QiYi Valk 3 Elite M
- **Classic Puzzles**: Original Rubik's Cube, YuXin Little Magic
- **Specialty Cubes**: Megaminx, Pyraminx, Skewb
- **Various Sizes**: 2x2, 3x3, 4x4 cubes

## Testing Feature Flags & A/B Testing

This application is designed to be a testing ground for:

- **Feature Flags**: Toggle features on/off without deployments
- **A/B Testing**: Compare different UI variations or user flows
- **Analytics Integration**: Track user behavior and conversions
- **Performance Monitoring**: Measure load times and user experience

## Environment Variables

### Backend (.env)
```
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://cubes_user:cubes_password@postgres:5432/cubes_db
FRONTEND_URL=https://localhost:3002
CORS_ORIGIN=https://localhost:3002
```

### Frontend
```
VITE_API_URL=http://localhost:5001/api
```

## Security Features

- HTTPS with self-signed certificates
- CORS protection
- Security headers (Helmet.js)
- Input validation and sanitization
- SQL injection prevention

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3002, 5001, and 5433 are available
2. **SSL certificate errors**: The application uses self-signed certificates for development
3. **Database connection**: Wait for PostgreSQL to fully initialize before starting other services
4. **Build failures**: Clear Docker cache with `docker system prune -f`

### Health Checks
```bash
# Check all services
make health

# Manual checks
curl -f http://localhost:5001/api/health
curl -f -k https://localhost:3002/health
```

## Contributing

This is a minimal testing application. Contributions should focus on:

- Feature flag integration points
- A/B testing capabilities  
- Performance monitoring hooks
- Analytics event tracking

## License

MIT License - Built for testing and development purposes.