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

    if (record.count
