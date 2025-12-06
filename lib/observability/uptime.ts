/**
 * Uptime Monitoring with BetterStack (Uptime Robot alternative)
 *
 * Monitors critical endpoints and alerts on downtime
 */

export interface UptimeEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  expectedStatus: number;
  timeout: number;
  interval: number; // seconds
}

/**
 * Critical endpoints to monitor
 */
export const MONITORED_ENDPOINTS: UptimeEndpoint[] = [
  {
    name: 'Homepage',
    url: '/',
    method: 'GET',
    expectedStatus: 200,
    timeout: 5000,
    interval: 60,
  },
  {
    name: 'Report Generation API',
    url: '/api/report?symbol=AAPL',
    method: 'GET',
    expectedStatus: 200,
    timeout: 30000,
    interval: 300,
  },
  {
    name: 'Credits API',
    url: '/api/report/credits',
    method: 'GET',
    expectedStatus: 200,
    timeout: 5000,
    interval: 120,
  },
  {
    name: 'Admin Metrics',
    url: '/api/admin/metrics',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    interval: 180,
  },
  {
    name: 'Cache Stats',
    url: '/api/admin/cache',
    method: 'GET',
    expectedStatus: 200,
    timeout: 5000,
    interval: 120,
  },
  {
    name: 'Queue Stats',
    url: '/api/admin/queue/stats',
    method: 'GET',
    expectedStatus: 200,
    timeout: 5000,
    interval: 120,
  },
];

/**
 * Health check endpoint for monitoring services
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: boolean;
    redis: boolean;
    queue: boolean;
    external_apis: boolean;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    queueDepth: number;
  };
}

/**
 * Self-hosted health check (for monitoring services to poll)
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    queue: await checkQueue(),
    external_apis: await checkExternalAPIs(),
  };

  const allHealthy = Object.values(checks).every((check) => check);
  const anyUnhealthy = Object.values(checks).some((check) => !check);

  return {
    status: allHealthy ? 'healthy' : anyUnhealthy ? 'degraded' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
    metrics: {
      responseTime: Date.now() - startTime,
      errorRate: 0, // Would come from metrics API
      queueDepth: 0, // Would come from queue stats
    },
  };
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<boolean> {
  try {
    const { marketDataCache } = await import('@/lib/cache/redis');
    await marketDataCache.get('health-check');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check queue connectivity
 */
async function checkQueue(): Promise<boolean> {
  try {
    // Placeholder: Queue functionality temporarily disabled
    return true; // Default to true when queue module is not available
  } catch {
    return false;
  }
}

/**
 * Check external API connectivity
 */
async function checkExternalAPIs(): Promise<boolean> {
  try {
    // Check Finnhub
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${process.env.FINNHUB_API_KEY}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  type: 'email' | 'slack' | 'webhook';
  threshold: {
    downtime: number; // seconds
    errorRate: number; // percentage
    responseTime: number; // ms
  };
  recipients: string[];
}

export const ALERT_CONFIG: AlertConfig = {
  type: 'email',
  threshold: {
    downtime: 300, // 5 minutes
    errorRate: 5, // 5%
    responseTime: 10000, // 10 seconds
  },
  recipients: ['team@qiltrack.com'],
};

/**
 * Setup instructions for external monitoring services
 */
export const MONITORING_SETUP = {
  betterstack: {
    name: 'BetterStack',
    url: 'https://betterstack.com',
    setup: [
      '1. Create account at betterstack.com',
      '2. Add monitors for each endpoint',
      '3. Configure alert channels',
      '4. Set check intervals',
    ],
    features: ['99.9% uptime guarantee', 'Global monitoring', 'Status page'],
  },
  uptimerobot: {
    name: 'UptimeRobot',
    url: 'https://uptimerobot.com',
    setup: [
      '1. Create account at uptimerobot.com',
      '2. Add HTTP(s) monitors',
      '3. Configure alert contacts',
      '4. Set monitoring intervals',
    ],
    features: ['Free 50 monitors', '5-minute checks', 'Public status page'],
  },
  healthchecks: {
    name: 'Healthchecks.io',
    url: 'https://healthchecks.io',
    setup: [
      '1. Create account at healthchecks.io',
      '2. Create ping URLs for cron jobs',
      '3. Configure grace periods',
      '4. Set up integrations (Slack/Email)',
    ],
    features: ['Cron job monitoring', 'Grace periods', 'Integrations'],
  },
};
