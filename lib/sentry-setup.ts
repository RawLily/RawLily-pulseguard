import * as Sentry from '@sentry/nextjs';

export function initializeSentry() {
  if (typeof window === 'undefined') {
    // Server-side initialization
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
  } else {
    // Client-side initialization
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        // Session Replay configuration via integration
        new Sentry.Integrations.Replay({
          maskAllText: true,
          blockAllMedia: true,
          maskAllInputs: true
        })
      ],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
}

export function captureException(
  error: Error,
  context: Record<string, unknown> = {}
) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.captureException(error, {
    extra: context,
    tags: { severity: 'enterprise-tracked' }
  });
}

export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error'
) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.captureMessage(message, level);
}

export function addBreadcrumb(
  message: string,
  data: Record<string, unknown> = {},
  category: string = 'event'
) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.addBreadcrumb({
    message,
    data,
    category,
    timestamp: Date.now() / 1000
  });
}

export function setUserContext(userId: string, email: string, name?: string) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.setUser({
    id: userId,
    email,
    username: name
  });
}

export function clearUserContext() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.setUser(null);
}

export function setContext(name: string, context: Record<string, unknown>) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.setContext(name, context);
}
