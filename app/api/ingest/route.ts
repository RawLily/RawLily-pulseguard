import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { sql } from '@neondatabase/serverless';
import * as Sentry from '@sentry/nextjs';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIP, isSuspiciousInput } from '@/lib/security';

interface IngestPayload {
  type: 'bug' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  stackTrace?: string;
  sourceFile?: string;
  lineNumber?: number;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

const limiter = rateLimit(100, 60000); // 100 requests per minute

function validatePayload(data: unknown): IngestPayload | null {
  if (!data || typeof data !== 'object') return null;

  const payload = data as Record<string, unknown>;

  if (!['bug', 'security'].includes(payload.type as string)) return null;
  if (!['low', 'medium', 'high', 'critical'].includes(payload.severity as string)) return null;
  
  const title = payload.title as string;
  const description = payload.description as string;
  
  if (typeof title !== 'string' || title.length < 1 || title.length > 255) return null;
  if (typeof description !== 'string' || description.length < 1 || description.length > 5000) return null;

  // Security check for suspicious input
  if (isSuspiciousInput(title) || isSuspiciousInput(description)) {
    return null;
  }

  return {
    type: payload.type as 'bug' | 'security',
    severity: payload.severity as 'low' | 'medium' | 'high' | 'critical',
    title: title.trim(),
    description: description.trim(),
    stackTrace: typeof payload.stackTrace === 'string' ? payload.stackTrace.substring(0, 10000) : undefined,
    sourceFile: typeof payload.sourceFile === 'string' ? payload.sourceFile.substring(0, 500) : undefined,
    lineNumber: typeof payload.lineNumber === 'number' && payload.lineNumber > 0 ? payload.lineNumber : undefined,
    timestamp: typeof payload.timestamp === 'string' ? payload.timestamp : new Date().toISOString(),
    metadata: typeof payload.metadata === 'object' ? (payload.metadata as Record<string, unknown>) : undefined
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  
  try {
    // Rate limiting
    if (!limiter.check(ip)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: { 'Retry-After': '60', 'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString() }
        }
      );
    }

    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // Parse request body with error handling
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // Validate payload
    const validated = validatePayload(payload);
    if (!validated) {
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      );
    }

    // Store in database with transaction
    try {
      const result = await sql`
        INSERT INTO events (
          user_id,
          event_type,
          severity,
          title,
          description,
          stack_trace,
          source_file,
          line_number,
          timestamp,
          metadata,
          created_at
        ) VALUES (
          ${session.user.sub},
          ${validated.type},
          ${validated.severity},
          ${validated.title},
          ${validated.description},
          ${validated.stackTrace || null},
          ${validated.sourceFile || null},
          ${validated.lineNumber || null},
          ${validated.timestamp},
          ${JSON.stringify(validated.metadata || {})},
          NOW()
        )
        RETURNING id, created_at;
      `;

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to insert event');
      }

      const event = result.rows[0];

      return NextResponse.json(
        {
          success: true,
          eventId: event.id,
          timestamp: event.created_at
        },
        {
          status: 201,
          headers: {
            'X-Event-ID': String(event.id),
            'Cache-Control': 'no-store'
          }
        }
      );
    } catch (dbError) {
      Sentry.captureException(dbError, {
        tags: {
          component: 'ingest-api',
          operation: 'database-insert',
          userId: session.user.sub
        }
      });

      return NextResponse.json(
        { error: 'Failed to process event' },
        { status: 500 }
      );
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'ingest-api',
        severity: 'high'
      }
    });

    console.error('[Ingest] Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  const allowedOrigins = ['https://pulseguardhq.xyz', 'https://www.pulseguardhq.xyz'];

  if (allowedOrigins.includes(origin || '')) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600'
      }
    });
  }

  return new NextResponse(null, { status: 403 });
}
