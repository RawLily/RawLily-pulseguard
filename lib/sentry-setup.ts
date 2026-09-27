import * as Sentry from '@sentry/nextjs';

export function initializeSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      maxBreadcrumbs: 50,
      
      beforeSend(event, hint) {
        // Enterprise security: Filter sensitive errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            // Log failed HTTP requests
            if (error.message?.includes('fetch') || error.message?.includes('HTTP')) {
              Sentry.addBreadcrumb({
                category: 'http',
                message: `Failed HTTP request: ${error.message}`,
                level: 'error',
              });
            }
            // Filter non-critical errors
            if (
              error.message?.includes('NetworkError') ||
              error.message?.includes('AbortError') ||
              error.message?.includes('ResizeObserver')
            ) {
              return null;
            }
          }
        }
        return event;
      },
      
      initialScope: {
        tags: {
          component: 'pulseguard',
          service: 'nextjs-app',
          tier: 'enterprise'
        }
      }
    });
  }
}

export function captureException(
  error: Error,
  context: Record<string, unknown> = {}
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.captureException(error, {
    extra: context,
    tags: { severity: 'enterprise-tracked' }
  });
}

export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error'
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.captureMessage(message, level);
}

export function addBreadcrumb(
  message: string,
  data: Record<string, unknown> = {},
  category: string = 'event'
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.addBreadcrumb({
    message,
    data,
    category,
    timestamp: Date.now() / 1000
  });
}

export function setUserContext(userId: string, email: string, name?: string) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.setUser({
    id: userId,
    email,
    username: name
  });
}

export function clearUserContext() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.setUser(null);
}

export function setContext(name: string, context: Record<string, unknown>) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.setContext(name, context);
}
