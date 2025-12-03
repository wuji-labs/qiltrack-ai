import { track } from '@vercel/analytics';

/**
 * Metrics for report generation
 */
export interface ReportMetrics {
  symbol: string;
  language: string;
  tone: string;
  duration: number;
  success: boolean;
  userId: string | null;
  useNewSystem?: boolean;
  error?: string;
}

/**
 * Track successful report generation
 */
export function trackReportGeneration(metrics: ReportMetrics) {
  track('report.generated', {
    symbol: metrics.symbol,
    language: metrics.language,
    tone: metrics.tone,
    duration: metrics.duration,
    success: metrics.success,
    userId: metrics.userId ?? 'anonymous',
    useNewSystem: metrics.useNewSystem ?? false,
  });
}

/**
 * Track report generation errors
 */
export function trackReportError(metrics: Omit<ReportMetrics, 'success'> & { error: string }) {
  track('report.failed', {
    symbol: metrics.symbol,
    language: metrics.language,
    tone: metrics.tone,
    duration: metrics.duration,
    userId: metrics.userId ?? 'anonymous',
    error: metrics.error,
    useNewSystem: metrics.useNewSystem ?? false,
  });
}

/**
 * SLO definitions for report generation
 */
export const reportGenerationSLO = {
  // Availability target: 99.9%
  availability: {
    target: 0.999,
    window: '30d',
    measurement: 'successful_requests / total_requests',
  },

  // Latency targets
  latency: {
    p50: { target: 25000, unit: 'ms' }, // 25s
    p95: { target: 45000, unit: 'ms' }, // 45s
    p99: { target: 60000, unit: 'ms' }, // 60s
  },

  // Success rate target: 99.5%
  successRate: {
    target: 0.995,
    window: '24h',
  },
} as const;
