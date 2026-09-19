import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

// Validate Sentry DSN
const SentryDsnSchema = z.string().startsWith('https://').optional();
const sentryDsn = SentryDsnSchema.parse(process.env.NEXT_PUBLIC_SENTRY_DSN);

export function initializeSentry() {
  if (process.env.NODE_ENV === 'production' && sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
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
      }
    });
  }
}

export function captureException(
  error: Error,
  context: Record<string, unknown> = {}
) {
  if (!sentryDsn) return;

  Sentry.captureException(error, {
    extra: context,
    tags: {
      severity: 'enterprise-tracked'
    }
  });
}

export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error'
) {
  if (!sentryDsn) return;

  Sentry.captureMessage(message, level);
}

export function addBreadcrumb(
  message: string,
  data: Record<string, unknown> = {},
  category: string = 'event'
) {
  if (!sentryDsn) return;

  Sentry.addBreadcrumb({
    message,
    data,
    category,
    timestamp: Date.now() / 1000
  });
}

export function setUserContext(userId: string, email: string, name?: string) {
  if (!sentryDsn) return;

  Sentry.setUser({
    id: userId,
    email,
    username: name
  });
}

export function clearUserContext() {
  if (!sentryDsn) return;

  Sentry.setUser(null);
}

export function setContext(name: string, context: Record<string, unknown>) {
  if (!sentryDsn) return;

  Sentry.setContext(name, context);
}
