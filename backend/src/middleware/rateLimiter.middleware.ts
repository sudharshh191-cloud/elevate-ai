import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Creates a rate-limiting middleware
 * @param windowMs Window in milliseconds
 * @param max Max requests allowed in window
 * @param message Client error message
 */
export function createRateLimiter(windowMs: number, max: number, message: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Determine client identifier: authenticated userId or IP address
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const authUserId = (req as AuthRequest).user?.userId;
    const clientKey = authUserId ? `user_${authUserId}_${req.baseUrl}${req.path}` : `ip_${clientIp}_${req.baseUrl}${req.path}`;

    const now = Date.now();
    let record = memoryStore.get(clientKey);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      memoryStore.set(clientKey, record);
      return next();
    }

    record.count++;

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error: message,
        retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

// Pre-configured rate limiters for platform protection
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000,
  30,
  'Too many authentication attempts. Please wait a few minutes before trying again.'
);

export const otpRateLimiter = createRateLimiter(
  15 * 60 * 1000,
  15,
  'Too many verification code requests. Please wait a few minutes before requesting another code.'
);

export const aiRateLimiter = createRateLimiter(
  60 * 1000,
  60,
  'ELEVATE AI request limit reached. Please wait a moment before sending another message.'
);

export const codeExecutionRateLimiter = createRateLimiter(
  60 * 1000,
  60,
  'Code execution rate limit reached. Please wait a moment before running more test cases.'
);
