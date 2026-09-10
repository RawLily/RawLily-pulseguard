import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { sql } from '@neondatabase/serverless';
import * as Sentry from '@sentry/nextjs';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/security';

const limiter = rateLimit(100, 60000);

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    if (!limiter.check(ip)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') as string || 'month';
    const type = searchParams.get('type') as string || 'all';

    if (!['day', 'week', 'month'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period parameter' },
        { status: 400 }
      );
    }

    if (!['bug', 'security', 'all'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }

    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    try {
      const results = await sql<{
        event_type: string;
        severity: string;
        count: number;
        date: string;
      }>`
        SELECT 
          event_type,
          severity,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM events
        WHERE user_id = ${session.user.sub}
          AND created_at >= ${startDate.toISOString()}
          ${type !== 'all' ? sql`AND event_type = ${type}` : sql``}
        GROUP BY event_type, severity, DATE(created_at)
        ORDER BY date DESC
      `;

      const events = results.rows || [];

      const totalEvents = events.reduce((sum: number, e) => sum + Number(e.count), 0);
      const bugCount = events
        .filter((e) => e.event_type === 'bug')
        .reduce((sum: number, e) => sum + Number(e.count), 0);
      const securityCount = events
        .filter((e) => e.event_type === 'security')
        .reduce((sum: number, e) => sum + Number(e.count), 0);
      const criticalCount = events
        .filter((e) => e.severity === 'critical')
        .reduce((sum: number, e) => sum + Number(e.count), 0);
      const highCount = events
        .filter((e) => e.severity === 'high')
        .reduce((sum: number, e) => sum + Number(e.count), 0);

      return NextResponse.json(
        {
          period,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          summary: {
            totalEvents,
            bugCount,
            securityCount,
            criticalCount,
            highCount
          },
          events: events.map((e) => ({
            type: e.event_type,
            severity: e.severity,
            count: e.count,
            date: e.date
          })),
          timestamp: new Date().toISOString()
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'private, max-age=300'
          }
        }
      );
    } catch (dbError) {
      Sentry.captureException(dbError, {
        tags: {
          component: 'stats-api',
          operation: 'database-query',
          period,
          type
        }
      });

      console.error('[Stats API] Database error:', dbError);

      return NextResponse.json(
        { error: 'Failed to retrieve statistics' },
        { status: 500 }
      );
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'stats-api',
        severity: 'high'
      }
    });

    console.error('[Stats API] Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
