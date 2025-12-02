/**
 * Sentry Configuration
 *
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

/**
 * Initialize Sentry for error tracking
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Adjust sample rates based on environment
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration({
        tracePropagationTargets: ['localhost', /^https:\/\/[^/]*\.vercel\.app/],
      }),
      Sentry.replayIntegration(),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      // Remove sensitive URL parameters
      if (event.request?.url) {
        const url = new URL(event.request.url);
        url.searchParams.delete('token');
        url.searchParams.delete('key');
        event.request.url = url.toString();
      }

      return event;
    },

    // Ignore common noise
    ignoreErrors: [
      // Browser extensions
      /top\.GLOBALS/,
      // Network errors
      'NetworkError',
      'Failed to fetch',
      // Supabase connection errors (handled gracefully)
      'FetchError',
    ],
  });

  console.info('[Sentry] Initialized successfully');
}

/**
 * Capture error with context
 */
export function captureError(
  error: Error,
  context?: {
    userId?: string;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  if (!SENTRY_DSN) {
    console.error('[Error]', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture message (non-error events)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  if (!SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    Sentry.captureMessage(message, level);
  });
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  if (!SENTRY_DSN) return null;

  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Add breadcrumb (for debugging context)
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, any>,
  level: 'info' | 'warning' | 'error' = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}
