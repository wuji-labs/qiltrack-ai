/**
 * Structured Logging with Pino
 *
 * Provides fast, structured JSON logging for production
 */

import pino from 'pino';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Create logger instance
 */
export const logger = pino({
  level: LOG_LEVEL,

  // Use pretty print in development
  transport:
    NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,

  // Production formatting
  formatters: {
    level: (label) => {
      return { level: label };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        hostname: bindings.hostname,
        env: NODE_ENV,
      };
    },
  },

  // Add timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
});

/**
 * Log levels:
 * - trace: Very detailed debugging
 * - debug: Debugging information
 * - info: General information
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Critical errors (will exit process)
 */

/**
 * Helper: Log with context
 */
export function logWithContext(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context?: Record<string, any>
) {
  logger[level](context || {}, message);
}

/**
 * Helper: Log request
 */
export function logRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  context?: Record<string, any>
) {
  logger.info(
    {
      type: 'request',
      method,
      url,
      statusCode,
      duration,
      ...context,
    },
    `${method} ${url} ${statusCode} ${duration}ms`
  );
}

/**
 * Helper: Log error with stack trace
 */
export function logError(
  error: Error,
  message: string,
  context?: Record<string, any>
) {
  logger.error(
    {
      type: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    },
    message
  );
}

/**
 * Helper: Log business metric
 */
export function logMetric(
  metric: string,
  value: number,
  unit: string,
  context?: Record<string, any>
) {
  logger.info(
    {
      type: 'metric',
      metric,
      value,
      unit,
      ...context,
    },
    `Metric: ${metric} = ${value} ${unit}`
  );
}

/**
 * Helper: Log performance
 */
export function logPerformance(
  operation: string,
  duration: number,
  context?: Record<string, any>
) {
  const level = duration > 5000 ? 'warn' : 'info';

  logger[level](
    {
      type: 'performance',
      operation,
      duration,
      ...context,
    },
    `Performance: ${operation} took ${duration}ms`
  );
}

/**
 * Create child logger with default context
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}
