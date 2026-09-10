import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PulseGuard Enterprise Middleware
 * - Auth0 authentication for protected routes
 * - Rate limiting (10 requests per minute per IP)
 * - Security headers
 */

const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;
  return request.ip || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + 60000,
    });
    return true;
  }

  if (limit.count >= 10) return false;
  limit.count += 1;
  return true;
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  const csp =
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.auth0.com; " +
    "connect-src 'self' https://dev-8zux3342wekcgta1.us.auth0.com https://api.stripe.com https://resend.com; " +
    "frame-src https://auth0.com https://checkout.stripe.com; " +
    "img-src 'self' data: https:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self' data:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "upgrade-insecure-requests";

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(self), usb=()'
  );

  response.headers.delete('server');
  response.headers.delete('x-powered-by');

  return response;
}

async function middleware(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    let response = NextResponse.next();
    response = applySecurityHeaders(response);
    response.headers.set('X-Request-ID', `${Date.now()}-${Math.random()}`);

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    let response = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}

export default withMiddlewareAuthRequired(middleware);

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
