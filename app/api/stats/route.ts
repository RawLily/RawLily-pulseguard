import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock stats - replace with real DB queries later
    const stats = {
      activeMonitors: 0,
      eventsThisMonth: 0,
      threatsDetected: 0,
      uptime: 99.9,
      recentEvents: []
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock stats - replace with real DB queries later
    const stats = {
      activeMonitors: 0,
      eventsThisMonth: 0,
      threatsDetected: 0,
      uptime: 99.9,
      recentEvents: []
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
