import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

const StatsResponseSchema = z.object({
  activeMonitors: z.number().int().min(0),
  eventsThisMonth: z.number().int().min(0),
  threatsDetected: z.number().int().min(0),
  uptime: z.number().min(0).max(100),
  recentEvents: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['bug', 'security', 'performance']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      message: z.string(),
      createdAt: z.string().datetime(),
    })
  ),
});

export async function GET(request: NextRequest) {
  try {
    // Breadcrumb for Sentry
    Sentry.addBreadcrumb({
      category: 'api.stats',
      message: 'Fetching stats',
      level: 'info',
    });

    const session = await getSession();

    if (!session?.user?.sub) {
      Sentry.addBreadcrumb({
        category: 'api.stats',
        message: 'Unauthorized access attempt',
        level: 'warning',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;

    // Get this month's start date
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Query 1: Count active monitors (subscriptions with status !== 'canceled')
    const monitorsResult = await db.query(
      `SELECT COUNT(*)::int as count FROM subscriptions WHERE user_id = $1 AND status != 'canceled'`,
      [userId]
    );
    const activeMonitors = monitorsResult.rows[0]?.count || 0;

    // Query 2: Count events this month
    const eventsThisMonthResult = await db.query(
      `SELECT COUNT(*)::int as count FROM events 
       WHERE user_id = $1 AND created_at >= $2`,
      [userId, monthStart]
    );
    const eventsThisMonth = eventsThisMonthResult.rows[0]?.count || 0;

    // Query 3: Count threats detected (severity >= 'high') this month
    const threatsResult = await db.query(
      `SELECT COUNT(*)::int as count FROM events 
       WHERE user_id = $1 AND created_at >= $2 
       AND severity IN ('high', 'critical')`,
      [userId, monthStart]
    );
    const threatsDetected = threatsResult.rows[0]?.count || 0;

    // Query 4: Calculate uptime (placeholder: if any active subscriptions, assume 99.9%)
    const uptime = activeMonitors > 0 ? 99.9 : 0;

    // Query 5: Get recent events (last 5)
    const recentEventsResult = await db.query(
      `SELECT id, type, severity, message, created_at FROM events 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    const recentEvents = recentEventsResult.rows.map((event: any) => ({
      id: event.id,
      type: event.type,
      severity: event.severity,
      message: event.message,
      createdAt: event.created_at.toISOString(),
    }));

    const stats = {
      activeMonitors,
      eventsThisMonth,
      threatsDetected,
      uptime,
      recentEvents,
    };

    // Validate response schema
    const validated = StatsResponseSchema.parse(stats);

    Sentry.addBreadcrumb({
      category: 'api.stats',
      message: 'Stats fetched successfully',
      level: 'info',
      data: { activeMonitors, eventsThisMonth, threatsDetected },
    });

    return NextResponse.json(validated);
  } catch (error) {
    console.error('[Stats API] Error:', error);

    Sentry.captureException(error, {
      tags: { route: '/api/stats' },
      level: 'error',
    });

    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
