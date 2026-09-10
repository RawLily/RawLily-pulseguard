import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

const handler = handleAuth({
  callback: async (req: NextRequest) => {
    try {
      const response = await handleCallback(req);
      
      if (response && response.status >= 400) {
        console.error(`[Auth0] Callback error: ${response.status}`);
        Sentry.captureMessage(`Auth0 callback failed with status ${response.status}`, 'warning');
        return NextResponse.redirect(new URL('/error?type=auth_failed', req.url));
      }

      return response;
    } catch (error) {
      console.error('[Auth0] Callback exception:', error);
      Sentry.captureException(error, {
        tags: { component: 'auth0-callback' }
      });
      return NextResponse.redirect(new URL('/error?type=auth_error', req.url));
    }
  },

  onError: async (req: NextRequest, error) => {
    console.error('[Auth0] Authentication error:', error);
    Sentry.captureException(error, {
      tags: { component: 'auth0', severity: 'high' }
    });
    return NextResponse.redirect(new URL('/error?type=auth_failed', req.url));
  }
});

export const GET = handler;
export const POST = handler;
