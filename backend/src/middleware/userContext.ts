import { Request, Response, NextFunction } from 'express';
import { OpenFeature, Client } from '@openfeature/server-sdk';

// Extend the Request interface to include anonymousId and openFeatureClient
declare module 'express-serve-static-core' {
  interface Request {
    anonymousId?: string;
    openFeatureClient?: Client;
  }
}

export const userContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract anonymous_id from multiple sources
  req.anonymousId = req.headers['x-anonymous-id'] as string ||
                     req.cookies?.anonymous_id ||
                     null;

  // Create an OpenFeature client with evaluation context if we have an anonymousId
  if (req.anonymousId) {
    try {
      const client = OpenFeature.getClient();

      // Set evaluation context for this request
      // Note: Context is set synchronously on the client, not as a promise
      client.setContext({
        targetingKey: req.anonymousId,
        anonymous_id: req.anonymousId,
        id: req.anonymousId
      });

      req.openFeatureClient = client;
    } catch (error) {
      console.error('Failed to create OpenFeature client:', error);
      // Continue without feature flags rather than blocking the request
    }
  }

  next();
};