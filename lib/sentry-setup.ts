import * as Sentry from '@sentry/nextjs';

export function initializeSentry() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      maxBreadcrumbs: 50,
      
      integrations: [
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
          maskAllInputs: true
        })
      ],

      beforeSend(event, hint) {
        // Enterprise security: Track all HTTP errors
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

            // Filter only non-critical errors
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
      },

      // Enterprise security settings
      attachStacktrace: true,
      captureUnhandledRejections: true,
      denyUrls: [/extensions\//i, /^chrome:\/\//i],
      allowUrls: [/^https:\/\/pulseguardhq\.xyz/i]
    });
  }
}

export function captureException(
  error: Error,
  context: Record<string, unknown> = {}
) {
  Sentry.captureException(error, {
    extra: context,
    timestamp: new Date().toISOString(),
    tags: {
      severity: 'enterprise-tracked'
    }
  });
}

export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error'
) {
  Sentry.captureMessage(message, level);
}

export function addBreadcrumb(
  message: string,
  data: Record<string, unknown> = {},
  category: string = 'event'
) {
  Sentry.addBreadcrumb({
    message,
    data,
    category,
    timestamp: Date.now() / 1000
  });
}

export function setUserContext(userId: string, email: string, name?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username: name
  });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export function setContext(name: string, context: Record<string, unknown>) {
  Sentry.setContext(name, context);
}
