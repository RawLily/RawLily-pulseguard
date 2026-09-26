import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Zod schema for event validation
const EventPayloadSchema = z.object({
  type: z.enum(['bug', 'security', 'performance']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().min(1).max(1000),
  stackTrace: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

type EventPayload = z.infer<typeof EventPayloadSchema>;

// In-memory rate limit store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(apiKey: string, maxPerMinute: number = 100): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(apiKey);

  if (!limit || now > limit.resetAt) {
    // Reset or create new limit
    rateLimitStore.set(apiKey, {
      count: 1,
      resetAt: now + 60000, // 1 minute from now
    });
    return true;
  }

  if (limit.count >= maxPerMinute) {
    return false; // Rate limit exceeded
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    Sentry.addBreadcrumb({
      category: 'api.ingest',
      message: 'Event ingestion started',
      level: 'info',
    });

    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      Sentry.addBreadcrumb({
        category: 'api.ingest',
        message: 'Missing or invalid API key',
        level: 'warning',
      });
      return NextResponse.json(
        { error: 'Missing or invalid API key' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.slice(7); // Remove "Bearer " prefix

    // Check rate limit
    if (!checkRateLimit(apiKey)) {
      Sentry.captureMessage('API key rate limited', 'warning', {
        tags: { component: 'ingest-api' },
      });
      return NextResponse.json(
        { error: 'Rate limit exceeded (100 events/minute)' },
        { status: 429 }
      );
    }

    // Validate API key exists and get user_id
    const apiKeyResult = await db.query(
      `SELECT user_id FROM api_keys WHERE key = $1 AND revoked_at IS NULL`,
      [apiKey]
    );

    if (apiKeyResult.rows.length === 0) {
      Sentry.addBreadcrumb({
        category: 'api.ingest',
        message: 'Invalid API key',
        level: 'warning',
      });
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const userId = apiKeyResult.rows[0].user_id;

    // Parse and validate request body
    let payload: EventPayload;
    try {
      const body = await request.json();
      payload = EventPayloadSchema.parse(body);
    } catch (error) {
      Sentry.addBreadcrumb({
        category: 'api.ingest',
        message: 'Invalid event payload',
        level: 'warning',
      });
      return NextResponse.json(
        { error: 'Invalid event payload', details: (error as Error).message },
        { status: 400 }
      );
    }

    // Generate event ID
    const eventId = `evt_${uuidv4()}`;

    // Insert event into database
    const insertResult = await db.query(
      `INSERT INTO events 
       (id, user_id, type, severity, message, stack_trace, metadata, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, created_at`,
      [
        eventId,
        userId,
        payload.type,
        payload.severity,
        payload.message,
        payload.stackTrace || null,
        payload.metadata ? JSON.stringify(payload.metadata) : null,
      ]
    );

    if (insertResult.rows.length === 0) {
      throw new Error('Failed to insert event');
    }

    const event = insertResult.rows[0];

    Sentry.addBreadcrumb({
      category: 'api.ingest',
      message: 'Event inserted successfully',
      level: 'info',
      data: {
        eventId: event.id,
        type: payload.type,
        severity: payload.severity,
      },
    });

    // If critical or high-severity security threat, capture in Sentry immediately
    if (payload.type === 'security' && ['high', 'critical'].includes(payload.severity)) {
      Sentry.captureMessage(
        `Security threat detected: ${payload.message}`,
        'error',
        {
          tags: {
            component: 'ingest-api',
            eventId: event.id,
            severity: payload.severity,
          },
          extra: {
            stackTrace: payload.stackTrace,
            metadata: payload.metadata,
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        eventId: event.id,
        createdAt: event.created_at.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Ingest API] Error:', error);

    Sentry.captureException(error, {
      tags: { route: '/api/ingest' },
      level: 'error',
    });

    return NextResponse.json(
      { error: 'Failed to ingest event' },
      { status: 500 }
    );
  }
}
