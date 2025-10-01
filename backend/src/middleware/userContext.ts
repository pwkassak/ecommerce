import { Request, Response, NextFunction } from 'express';
import { EvaluationContext } from '@openfeature/server-sdk';

// Extend the Request interface to include anonymousId and evaluationContext
declare module 'express-serve-static-core' {
  interface Request {
    anonymousId?: string;
    evaluationContext?: EvaluationContext;
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

  // Build evaluation context for this specific request
  // This context will be passed per flag evaluation to avoid race conditions
  // OpenFeature client (singleton) will be accessed directly via OpenFeature.getClient() in route handlers
  if (req.anonymousId) {
    req.evaluationContext = {
      targetingKey: req.anonymousId,
      anonymous_id: req.anonymousId,
      id: req.anonymousId
    };
  }

  next();
};