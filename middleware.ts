import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PulseGuard Enterprise Middleware
 * Features:
 * - Auth0 authentication for protected routes
 * - Rate limiting (10 requests per minute per IP)
 * - Security headers (HSTS, CSP, X-Frame-Options)
 * - Request logging and monitoring
 * - Graceful error handling
 */

// Rate limiting store (in-memory for single instance; use Redis for distributed)
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

/**
 * Get client IP address from request
 * Handles X-Forwarded-For, CloudFlare, and direct IP
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return request.ip || 'unknown';
}

/**
 * Rate limiting middleware
 * Limits: 10 requests per minute per IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(ip);

  if (!limit || now > limit.resetTime) {
    // Create new rate limit window (60 seconds)
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + 60000,
    });
    return true;
  }

  if (limit.count >= 10) {
    return false; // Rate limit exceeded
  }

  limit.count += 1;
  return true;
}

/**
 * Clean up old rate limit entries (every 5 minutes)
 */
function cleanupRateLimit() {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime + 300000) {
      // Clean up entries older than 5 minutes
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  // HSTS: Enforce HTTPS for 1 year
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // CSP: Content Security Policy (as single string, not array)
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

  // Clickjacking protection
  response.headers.set('X-Frame-Options', 'DENY');

  // MIME type sniffing protection
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (modern alternative to Feature-Policy)
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(self), usb=()'
  );

  // Remove server header
  response.headers.delete('server');
  response.headers.delete('x-powered-by');

  return response;
}

/**
 * Main middleware function
 */
async function middleware(request: NextRequest) {
  const clientIp = getClientIp(request);
  const { pathname } = request.nextUrl;

  try {
    // Cleanup rate limit store periodically
    if (Math.random() < 0.1) {
      cleanupRateLimit();
    }

    // Check rate limiting
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message:
            'You have exceeded the rate limit. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      );
    }

    // Apply Auth0 authentication for protected routes
    const authMiddleware = withMiddlewareAuthRequired();
    let response = await authMiddleware(request);

    // If auth middleware didn't return a response, create one
    if (!response) {
      response = NextResponse.next();
    }

    // Apply security headers to all responses
    response = applySecurityHeaders(response);

    // Add custom headers for monitoring
    response.headers.set('X-Request-ID', `${Date.now()}-${Math.random()}`);
    response.headers.set('X-Protected-Route', 'true');

    return response;
  } catch (error) {
    console.error('Middleware error:', {
      path: pathname,
      ip: clientIp,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    // Return error response with security headers
    let response = NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An error occurred processing your request',
      },
      { status: 500 }
    );

    response = applySecurityHeaders(response);
    return response;
  }
}

/**
 * Apply middleware to protected routes only
 * - /dashboard/* - Protected dashboard pages
 * - /api/* - Protected API routes
 * Auth0 handles the actual authentication
 */
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};

export { middleware };
