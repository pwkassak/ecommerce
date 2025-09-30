import { Request, Response, NextFunction } from 'express';
import { GrowthBook } from '@growthbook/growthbook';
import { featureFlagService } from '../services/featureFlags.js';

// Extend the Request interface to include anonymousId and growthbook
declare module 'express-serve-static-core' {
  interface Request {
    anonymousId?: string;
    growthbook?: GrowthBook;
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

  // Create a request-scoped GrowthBook instance if we have an anonymousId
  if (req.anonymousId) {
    try {
      req.growthbook = featureFlagService.createScopedInstance({
        anonymous_id: req.anonymousId,
        id: req.anonymousId
      });
    } catch (error) {
      console.error('Failed to create scoped GrowthBook instance:', error);
      // Continue without feature flags rather than blocking the request
    }
  }

  next();
};