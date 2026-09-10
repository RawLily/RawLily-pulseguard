import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/security';

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
    return record ? record.resetTime : Date.now();
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
