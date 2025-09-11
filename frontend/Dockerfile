# Frontend Dockerfile - Multi-stage build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Production stage with Nginx and SSL
FROM nginx:alpine AS production

# Install OpenSSL for generating certificates and curl for health checks
RUN apk add --no-cache openssl curl

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Create directory for SSL certificates
RUN mkdir -p /etc/ssl/certs/app

# Generate self-signed SSL certificate for development
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/certs/app/nginx.key \
    -out /etc/ssl/certs/app/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Create nginx user and set permissions
RUN adduser -D -s /bin/sh nginx || true
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chown -R nginx:nginx /etc/ssl/certs/app

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f -k https://localhost:443 || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]