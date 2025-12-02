import { NextResponse } from 'next/server';
import { performHealthCheck } from '@/lib/observability/uptime';

/**
 * Health Check Endpoint
 *
 * GET /api/health - System health status
 *
 * Used by:
 * - Uptime monitoring services (BetterStack, UptimeRobot)
 * - Load balancers
 * - Internal monitoring
 */

export async function GET() {
  try {
    const health = await performHealthCheck();

    const statusCode =
      health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: false,
          redis: false,
          queue: false,
          external_apis: false,
        },
        error: String(error),
      },
      { status: 503 }
    );
  }
}
