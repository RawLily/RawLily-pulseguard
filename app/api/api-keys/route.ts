import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { v4 as uuidv4 } from 'uuid';

export async function GET(_request: NextRequest) {
  try {
    Sentry.addBreadcrumb({
      category: 'api.api-keys',
      message: 'Fetching API key',
      level: 'info',
    });

    const session = await getSession();

    if (!session?.user?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;

    // Get the active API key for the user
    const result = await db.query(
      `SELECT id, key, created_at FROM api_keys 
       WHERE user_id = $1 AND revoked_at IS NULL 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No API key found' }, { status: 404 });
    }

    const apiKey = result.rows[0];

    Sentry.addBreadcrumb({
      category: 'api.api-keys',
      message: 'API key retrieved',
      level: 'info',
    });

    return NextResponse.json({
      id: apiKey.id,
      key: apiKey.key,
      createdAt: apiKey.created_at.toISOString(),
    });
  } catch (error) {
    console.error('[API Keys GET] Error:', error);

    Sentry.captureException(error, {
      tags: { route: '/api/api-keys', method: 'GET' },
    });

    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    Sentry.addBreadcrumb({
      category: 'api.api-keys',
      message: 'Generating new API key',
      level: 'info',
    });

    const session = await getSession();

    if (!session?.user?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;

    // Generate new API key
    const newKey = `pg_${uuidv4().replace(/-/g, '')}`;
    const keyId = uuidv4();

    // Revoke any existing keys for the user
    await db.query(
      `UPDATE api_keys SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );

    // Create new key
    const result = await db.query(
      `INSERT INTO api_keys (id, user_id, key, created_at) 
       VALUES ($1, $2, $3, NOW())
       RETURNING id, key, created_at`,
      [keyId, userId, newKey]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to create API key');
    }

    const apiKey = result.rows[0];

    Sentry.addBreadcrumb({
      category: 'api.api-keys',
      message: 'API key generated successfully',
      level: 'info',
      data: { keyId },
    });

    return NextResponse.json(
      {
        id: apiKey.id,
        key: apiKey.key,
        createdAt: apiKey.created_at.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Keys POST] Error:', error);

    Sentry.captureException(error, {
      tags: { route: '/api/api-keys', method: 'POST' },
    });

    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    );
  }
}
