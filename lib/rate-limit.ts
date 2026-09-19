import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/security';
import { z } from 'zod';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export class RateLimiter {
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}

  check(identifier: string): boolean {
    if (!identifier || identifier === 'unknown') return false;

    const now = Date.now();
    const record = store[identifier];

    if (!record || now > record.resetTime) {
      store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return true;
    }

    if (record.count < this.maxRequests) {
      record.count++;
      return true;
    }

    return false;
  }

  remaining(identifier: string): number {
    if (!identifier || identifier === 'unknown') return 0;

    const record = store[identifier];
    if (!record || Date.now() > record.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - record.count);
  }

  reset(identifier: string): void {
    delete store[identifier];
  }

  getResetTime(identifier: string): number {
    const record = store[identifier];
    if (!record) return 0;
    const remaining = Math.max(0, record.resetTime - Date.now());
    return Math.ceil(remaining / 1000); // ⭐ NEW: Return in seconds
  }

  getStats(): { activeKeys: number; totalRequests: number } {
    const now = Date.now();
    let totalRequests = 0;
    let activeKeys = 0;

    for (const [_, record] of Object.entries(store)) {
      if (now <= record.resetTime) {
        activeKeys++;
        totalRequests += record.count;
      }
    }

    return { activeKeys, totalRequests };
  }
}

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return new RateLimiter(maxRequests, windowMs);
}

export const authLimiter = new RateLimiter(5, 900000); // 5 attempts per 15 minutes
export const apiLimiter = new RateLimiter(100, 60000); // 100 per minute
export const generalLimiter = new RateLimiter(1000, 60000); // 1000 per minute

// Cleanup expired records every minute
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of Object.entries(store)) {
    if (now > value.resetTime) {
      delete store[key];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[RateLimit] Cleaned ${cleaned} expired records`);
  }
}, 60000);

// Middleware helper for Next.js
export function createRateLimitMiddleware(
  limiter: RateLimiter,
  maxRequests: number
) {
  return (req: NextRequest) => {
    const ip = getClientIP(req);
    
    if (!limiter.check(ip)) {
      const resetTime = limiter.getResetTime(ip);
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: resetTime
        }),
        {
          status: 429,
          headers: {
            'Retry-After': String(resetTime),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': String(limiter.remaining(ip))
          }
        }
      );
    }

    return null;
  };
}
