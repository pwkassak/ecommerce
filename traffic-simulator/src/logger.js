const winston = require('winston');

console.log('Loading winston logger...');

// Set up logging paths
const fs = require('fs');
const path = require('path');
const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'traffic-simulator',
    version: '1.0.0'
  },
  transports: [
    // Console output for Docker logs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, service, sessionId, ...meta }) => {
          let logMessage = `${timestamp} [${service}] ${level}: ${message}`;
          
          if (sessionId) {
            logMessage = `${timestamp} [${service}:${sessionId}] ${level}: ${message}`;
          }
          
          // Add metadata if present
          const metaKeys = Object.keys(meta);
          if (metaKeys.length > 0) {
            const metaString = JSON.stringify(meta);
            logMessage += ` ${metaString}`;
          }
          
          return logMessage;
        })
      )
    }),
    
    // File output for persistent logs
    new winston.transports.File({
      filename: `${logsDir}/traffic-simulator.log`,
      format: winston.format.json(),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Error-specific log file
    new winston.transports.File({
      filename: `${logsDir}/errors.log`,
      level: 'error',
      format: winston.format.json(),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: `${logsDir}/exceptions.log`,
      format: winston.format.json()
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: `${logsDir}/rejections.log`,
      format: winston.format.json()
    })
  ]
});

// Create logs directory if it doesn't exist (for development)
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (error) {
    console.warn('Could not create logs directory:', error.message);
  }
}

// Helper functions for session-specific logging
const createSessionLogger = (sessionId) => {
  return {
    info: (message, meta = {}) => logger.info(message, { sessionId, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { sessionId, ...meta }),
    error: (message, meta = {}) => logger.error(message, { sessionId, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { sessionId, ...meta }),
  };
};

// Performance logging helpers
const logPerformance = (operation, duration, metadata = {}) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration_ms: duration,
    ...metadata
  });
};

const createTimer = (operation) => {
  const start = Date.now();
  return {
    end: (metadata = {}) => {
      const duration = Date.now() - start;
      logPerformance(operation, duration, metadata);
      return duration;
    }
  };
};

console.log('Winston logger created successfully');
console.log('Logger methods available:', Object.getOwnPropertyNames(logger));

// Export logger and utilities
module.exports = logger;
module.exports.createSessionLogger = createSessionLogger;
module.exports.logPerformance = logPerformance;
module.exports.createTimer = createTimer;