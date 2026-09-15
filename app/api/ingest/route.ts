import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const EventSchema = z.object({
  type: z.enum(['bug', 'security', 'performance']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().min(1).max(500),
  stackTrace: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const event = EventSchema.parse(body);

    console.log(`[${event.type.toUpperCase()}] ${event.severity}: ${event.message}`);

    return NextResponse.json(
      { 
        success: true, 
        eventId: `evt_${Date.now()}`,
        message: 'Event ingested successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Ingest API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
