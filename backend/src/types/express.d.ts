// Extend Express Request interface for analytics
declare global {
  namespace Express {
    interface Request {
      analytics?: {
        timestamp: string;
        user_agent: string;
        ip_address: string;
        server_timestamp: string;
      };
    }
  }
}