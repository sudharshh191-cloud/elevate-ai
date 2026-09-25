import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Strict authentication middleware: Rejects unauthenticated requests with 401 Unauthorized
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please sign in to access this feature.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string; email: string };
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Your session has expired. Please sign in again.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }
    res.status(401).json({
      error: 'Invalid authentication token.',
      code: 'INVALID_TOKEN',
    });
  }
};

/**
 * Optional authentication middleware: Attaches user if token is valid, but does not block guests
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string; email: string };
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch {
      // Ignore token verification errors for optional auth
    }
  }

  next();
};
