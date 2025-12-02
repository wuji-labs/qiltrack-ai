/**
 * Alert Rules Configuration
 *
 * Defines when to trigger alerts based on metrics
 */

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'critical' | 'warning' | 'info';
  condition: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    duration?: number; // seconds - alert only if condition persists
  };
  channels: ('email' | 'slack' | 'sentry')[];
  cooldown: number; // seconds - minimum time between alerts
}

/**
 * System health alerts
 */
export const SYSTEM_ALERTS: AlertRule[] = [
  {
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: 'Error rate exceeds 5%',
    enabled: true,
    severity: 'critical',
    condition: {
      metric: 'error_rate',
      operator: '>',
      threshold: 5,
      duration: 300, // 5 minutes
    },
    channels: ['email', 'slack', 'sentry'],
    cooldown: 1800, // 30 minutes
  },
  {
    id: 'slow-response-time',
    name: 'Slow API Response',
    description: 'P95 response time > 10s',
    enabled: true,
    severity: 'warning',
    condition: {
      metric: 'response_time_p95',
      operator: '>',
      threshold: 10000,
      duration: 600, // 10 minutes
    },
    channels: ['email', 'slack'],
    cooldown: 3600, // 1 hour
  },
  {
    id: 'queue-depth-high',
    name: 'Queue Depth High',
    description: 'Queue has >100 pending jobs',
    enabled: true,
    severity: 'warning',
    condition: {
      metric: 'queue_waiting',
      operator: '>',
      threshold: 100,
      duration: 300,
    },
    channels: ['slack'],
    cooldown: 1800,
  },
  {
    id: 'redis-down',
    name: 'Redis Unavailable',
    description: 'Redis health check failing',
    enabled: true,
    severity: 'critical',
    condition: {
      metric: 'redis_health',
      operator: '==',
      threshold: 0,
      duration: 60,
    },
    channels: ['email', 'slack', 'sentry'],
    cooldown: 600,
  },
  {
    id: 'database-down',
    name: 'Database Unavailable',
    description: 'Database health check failing',
    enabled: true,
    severity: 'critical',
    condition: {
      metric: 'database_health',
      operator: '==',
      threshold: 0,
      duration: 60,
    },
    channels: ['email', 'slack', 'sentry'],
    cooldown: 600,
  },
];

/**
 * Business metric alerts
 */
export const BUSINESS_ALERTS: AlertRule[] = [
  {
    id: 'report-generation-failure',
    name: 'Report Generation Failures',
    description: 'Report generation success rate < 90%',
    enabled: true,
    severity: 'warning',
    condition: {
      metric: 'report_success_rate',
      operator: '<',
      threshold: 90,
      duration: 600,
    },
    channels: ['email', 'slack'],
    cooldown: 3600,
  },
  {
    id: 'cache-hit-rate-low',
    name: 'Low Cache Hit Rate',
    description: 'Cache hit rate < 30%',
    enabled: true,
    severity: 'info',
    condition: {
      metric: 'cache_hit_rate',
      operator: '<',
      threshold: 30,
      duration: 1800, // 30 minutes
    },
    channels: ['slack'],
    cooldown: 7200, // 2 hours
  },
  {
    id: 'worker-failure-rate',
    name: 'High Worker Failure Rate',
    description: 'Worker failure rate > 10%',
    enabled: true,
    severity: 'warning',
    condition: {
      metric: 'worker_failure_rate',
      operator: '>',
      threshold: 10,
      duration: 300,
    },
    channels: ['email', 'slack'],
    cooldown: 1800,
  },
  {
    id: 'credit-depletion',
    name: 'User Credit Depletion',
    description: 'Average user credit balance < 5',
    enabled: true,
    severity: 'info',
    condition: {
      metric: 'avg_user_credits',
      operator: '<',
      threshold: 5,
      duration: 3600, // 1 hour
    },
    channels: ['email'],
    cooldown: 86400, // 24 hours
  },
];

/**
 * Alert evaluation engine
 */
export class AlertEvaluator {
  private lastAlerts: Map<string, number> = new Map();

  /**
   * Evaluate a single rule against current metrics
   */
  shouldAlert(rule: AlertRule, currentValue: number, timestamp: number): boolean {
    if (!rule.enabled) return false;

    // Check if in cooldown
    const lastAlert = this.lastAlerts.get(rule.id);
    if (lastAlert && timestamp - lastAlert < rule.cooldown * 1000) {
      return false;
    }

    // Evaluate condition
    const conditionMet = this.evaluateCondition(
      currentValue,
      rule.condition.operator,
      rule.condition.threshold
    );

    if (conditionMet) {
      this.lastAlerts.set(rule.id, timestamp);
      return true;
    }

    return false;
  }

  /**
   * Evaluate comparison
   */
  private evaluateCondition(
    value: number,
    operator: AlertRule['condition']['operator'],
    threshold: number
  ): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      case '!=':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Reset cooldown for a rule (for testing)
   */
  resetCooldown(ruleId: string) {
    this.lastAlerts.delete(ruleId);
  }
}

/**
 * Alert notification channels
 */
export const ALERT_CHANNELS = {
  email: {
    enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
    from: process.env.ALERT_EMAIL_FROM || 'alerts@example.com',
    to: process.env.ALERT_EMAIL_TO?.split(',') || ['admin@example.com'],
  },
  slack: {
    enabled: !!process.env.SLACK_WEBHOOK_URL,
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: process.env.SLACK_ALERT_CHANNEL || '#alerts',
  },
  sentry: {
    enabled: !!process.env.SENTRY_DSN,
    dsn: process.env.SENTRY_DSN,
  },
};

/**
 * Send alert via configured channels
 */
export async function sendAlert(
  rule: AlertRule,
  value: number,
  timestamp: string
) {
  const message = formatAlertMessage(rule, value, timestamp);

  const promises = rule.channels.map(async (channel) => {
    try {
      switch (channel) {
        case 'email':
          if (ALERT_CHANNELS.email.enabled) {
            await sendEmailAlert(message);
          }
          break;
        case 'slack':
          if (ALERT_CHANNELS.slack.enabled) {
            await sendSlackAlert(message);
          }
          break;
        case 'sentry':
          if (ALERT_CHANNELS.sentry.enabled) {
            await sendSentryAlert(rule, value);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to send alert via ${channel}:`, error);
    }
  });

  await Promise.allSettled(promises);
}

function formatAlertMessage(rule: AlertRule, value: number, timestamp: string) {
  return {
    title: `[${rule.severity.toUpperCase()}] ${rule.name}`,
    description: rule.description,
    details: {
      metric: rule.condition.metric,
      currentValue: value,
      threshold: rule.condition.threshold,
      timestamp,
    },
  };
}

async function sendEmailAlert(message: any) {
  // Implementation depends on email service (SendGrid, AWS SES, etc.)
  console.log('[Email Alert]', message);
}

async function sendSlackAlert(message: any) {
  if (!ALERT_CHANNELS.slack.webhookUrl) return;

  await fetch(ALERT_CHANNELS.slack.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: ALERT_CHANNELS.slack.channel,
      text: message.title,
      attachments: [
        {
          color: message.details.severity === 'critical' ? 'danger' : 'warning',
          fields: [
            { title: 'Description', value: message.description },
            { title: 'Current Value', value: message.details.currentValue },
            { title: 'Threshold', value: message.details.threshold },
            { title: 'Time', value: message.details.timestamp },
          ],
        },
      ],
    }),
  });
}

async function sendSentryAlert(rule: AlertRule, value: number) {
  const { captureMessage } = await import('./sentry');
  captureMessage(
    `Alert: ${rule.name} (${rule.condition.metric}: ${value})`,
    rule.severity === 'critical' ? 'error' : 'warning',
    {
      tags: {
        alert_id: rule.id,
        severity: rule.severity,
      },
      extra: {
        metric: rule.condition.metric,
        value,
        threshold: rule.condition.threshold,
      },
    }
  );
}
