import { Request, Response, NextFunction } from 'express';

// Extend the Request interface to include anonymousId
declare module 'express-serve-static-core' {
  interface Request {
    anonymousId?: string;
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

  next();
};