FROM node:18-slim

# Set working directory
WORKDIR /app

# Install dependencies for Playwright/Chromium
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Create logs directory
RUN mkdir -p /app/logs

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Create non-root user for security
RUN useradd -m -s /bin/bash simulator && \
    chown -R simulator:simulator /app

# Switch to non-root user before installing browsers
USER simulator

# Install Playwright browsers as the simulator user
RUN npx playwright install chromium

# Copy source code (as root to maintain ownership)
USER root
COPY --chown=simulator:simulator src/ ./src/

# Switch back to non-root user
USER simulator

# Health check to ensure simulator is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD pgrep -f "node src/simulator.js" || exit 1

# Set default environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV CONCURRENT_BROWSERS=5
ENV SESSION_DURATION_MIN=30
ENV SESSION_DURATION_MAX=120
ENV RESTART_DELAY=2000
ENV TARGET_URL=http://frontend:3002

# Start the simulator
CMD ["npm", "start"]