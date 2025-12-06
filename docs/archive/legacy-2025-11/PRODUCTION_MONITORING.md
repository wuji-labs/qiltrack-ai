# Production Monitoring & Alerting Configuration

**Purpose**: Real-time monitoring for Report Generation System v2
**Last Updated**: 2025-12-03
**Owner**: Engineering Team

---

## 🎯 Monitoring Objectives

### Service Level Objectives (SLO)

| Metric | Target | Measurement Window |
|--------|--------|-------------------|
| **Availability** | 99.9% | 30 days |
| **P50 Latency** | < 25s | 24 hours |
| **P95 Latency** | < 45s | 24 hours |
| **P99 Latency** | < 60s | 24 hours |
| **Success Rate** | > 99.5% | 24 hours |
| **Error Rate** | < 0.5% | 1 hour |

### Alert Severity Levels

- 🔴 **P0 - Critical**: Immediate action required (page on-call)
- 🟠 **P1 - High**: Respond within 30 minutes
- 🟡 **P2 - Medium**: Respond within 4 hours
- 🔵 **P3 - Low**: Review during business hours

---

## 📊 Monitoring Dashboards

### 1. Vercel Analytics Dashboard

**URL**: `https://vercel.com/YOUR_ORG/YOUR_PROJECT/analytics`

**Key Metrics**:
- Request count
- Response time distribution
- Error rate
- Geographic distribution
- Device breakdown

**Access**:
```bash
# View real-time analytics
vercel logs --prod --follow

# View specific function logs
vercel logs --prod --follow /api/report
```

---

### 2. Inngest Dashboard

**URL**: `https://app.inngest.com/env/production/functions`

**Key Metrics**:
- Function execution count
- Success/failure rate
- Average duration
- Queue depth
- Retry attempts

**Monitored Functions**:
- `generate-embeddings` - Report embedding generation

**Access**: Login via GitHub OAuth

---

### 3. Supabase Dashboard

**URL**: `https://app.supabase.com/project/YOUR_PROJECT`

**Key Metrics**:
- Database CPU usage
- Connection pool status
- Query performance
- Storage usage
- RLS policy violations

**Monitored Tables**:
- `report_posts` - Report records
- `audit_logs` - Audit trail
- `report_runs` - Generation metadata

---

### 4. Sentry Error Tracking

**URL**: `https://sentry.io/organizations/YOUR_ORG/issues/`

**Configuration**: Already integrated in `lib/observability/sentry.ts`

**Key Features**:
- Error grouping
- Stack traces
- User context
- Breadcrumbs
- Release tracking

**Access**: Login with team credentials

---

## 🚨 Alert Configuration

### Critical Alerts (P0) 🔴

#### 1. High Error Rate
```yaml
Name: High Error Rate - Report Generation
Condition: error_rate > 5% for 5 minutes
Action: Page on-call engineer
Query: |
  SELECT
    COUNT(*) FILTER (WHERE success = false) * 100.0 / COUNT(*) as error_rate
  FROM report_runs
  WHERE created_at > NOW() - INTERVAL '5 minutes'
Notification: PagerDuty, Slack #critical-alerts
```

#### 2. Service Down
```yaml
Name: Report API Down
Condition: health_check_failures > 3 consecutive
Action: Page on-call engineer
Check: curl https://YOUR_DOMAIN/api/health
Frequency: Every 60 seconds
Notification: PagerDuty, Slack #critical-alerts
```

#### 3. Database Connection Failure
```yaml
Name: Database Connection Pool Exhausted
Condition: connection_pool_usage > 95%
Action: Page on-call engineer + DBA
Query: |
  SELECT
    (active_connections * 100.0 / max_connections) as usage_pct
  FROM pg_stat_database
  WHERE datname = 'postgres'
Notification: PagerDuty, Slack #critical-alerts
```

---

### High Priority Alerts (P1) 🟠

#### 4. Latency Spike
```yaml
Name: P95 Latency Exceeds Target
Condition: p95_latency > 60s for 10 minutes
Action: Notify on-call engineer
Metric: report_generation_duration_p95
Threshold: 60000ms
Notification: Slack #eng-alerts
```

#### 5. Inngest Queue Backup
```yaml
Name: Inngest Queue Backing Up
Condition: queue_depth > 100 for 5 minutes
Action: Notify on-call engineer
Metric: inngest.queue.embeddings.depth
Threshold: 100 jobs
Notification: Slack #eng-alerts
```

#### 6. Storage Quota Warning
```yaml
Name: Storage Quota Approaching Limit
Condition: storage_usage > 80%
Action: Notify DevOps team
Query: |
  SELECT
    (used_bytes * 100.0 / quota_bytes) as usage_pct
  FROM storage.buckets
  WHERE name = 'report-storage'
Notification: Slack #devops-alerts
```

---

### Medium Priority Alerts (P2) 🟡

#### 7. Success Rate Below Target
```yaml
Name: Success Rate Below SLO
Condition: success_rate < 99.5% for 1 hour
Action: Investigate root cause
Metric: report_generation_success_rate
Threshold: 0.995
Notification: Slack #eng-monitoring
```

#### 8. Feature Flag Inconsistency
```yaml
Name: Feature Flag Mismatch Detected
Condition: flag_value != expected_value
Action: Review deployment
Check: Compare NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM across environments
Notification: Slack #eng-monitoring
```

---

### Low Priority Alerts (P3) 🔵

#### 9. Unusual Traffic Pattern
```yaml
Name: Unusual Report Generation Volume
Condition: hourly_reports > 2x average
Action: Monitor for abuse
Metric: reports_per_hour
Threshold: Dynamic (2x 7-day average)
Notification: Slack #eng-monitoring
```

#### 10. Slow Inngest Function
```yaml
Name: Slow Embedding Generation
Condition: avg_duration > 30s for 1 hour
Action: Review performance
Metric: inngest.function.generate-embeddings.duration_avg
Threshold: 30000ms
Notification: Slack #eng-monitoring
```

---

## 🔧 Alert Implementation

### Vercel Deployment Notifications

**Setup via Vercel Integrations**:
```bash
# Install Slack integration
1. Go to https://vercel.com/integrations/slack
2. Click "Add Integration"
3. Select channel: #deployment-alerts
4. Enable notifications for:
   - Deployment Started
   - Deployment Ready
   - Deployment Failed
```

---

### Sentry Alert Rules

**Configure in Sentry Dashboard**:
```yaml
# Rule 1: High Error Volume
conditions:
  - type: event.count
    value: 10
    interval: 1m
    comparison: gte
actions:
  - type: slack
    workspace: YOUR_WORKSPACE
    channel: #sentry-alerts
    tags: report-generation, critical

# Rule 2: New Error Type
conditions:
  - type: event.type
    value: error
    match: first_seen
actions:
  - type: slack
    workspace: YOUR_WORKSPACE
    channel: #sentry-new-issues
```

---

### Custom Monitoring Script

**Location**: `scripts/monitor-production.sh`

```bash
#!/bin/bash
# Production Monitoring Script
# Runs health checks and reports to Slack

set -e

SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
PRODUCTION_URL="https://YOUR_DOMAIN"

# Health check
health_check() {
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/health")

  if [ "$HTTP_CODE" != "200" ]; then
    send_alert "🔴 CRITICAL: Health check failed (HTTP $HTTP_CODE)"
    return 1
  fi

  return 0
}

# Check Inngest
inngest_check() {
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/inngest")

  if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "405" ]; then
    send_alert "🟠 WARNING: Inngest endpoint issue (HTTP $HTTP_CODE)"
    return 1
  fi

  return 0
}

# Send Slack alert
send_alert() {
  MESSAGE="$1"
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"$MESSAGE\", \"channel\": \"#prod-alerts\"}"
}

# Main monitoring loop
while true; do
  if ! health_check; then
    echo "Health check failed"
  fi

  if ! inngest_check; then
    echo "Inngest check failed"
  fi

  sleep 60  # Check every minute
done
```

**Run as background service**:
```bash
# Start monitoring
nohup ./scripts/monitor-production.sh > logs/monitor.log 2>&1 &

# View logs
tail -f logs/monitor.log
```

---

## 📈 Metrics Collection

### Application Metrics

**Location**: `lib/monitoring/metrics.ts`

```typescript
// Already implemented:
export function trackReportGeneration(metrics: ReportMetrics) {
  track('report.generated', {
    symbol: metrics.symbol,
    language: metrics.language,
    tone: metrics.tone,
    duration: metrics.duration,
    success: metrics.success,
    userId: metrics.userId,
    useNewSystem: metrics.useNewSystem,
  });
}
```

**Vercel Analytics Integration**:
```typescript
import { track } from '@vercel/analytics';

// Automatic tracking - already configured
```

---

### Database Metrics

**Query for Success Rate**:
```sql
-- Success rate over last 24 hours
SELECT
  COUNT(*) FILTER (WHERE status = 'published') * 100.0 / COUNT(*) as success_rate,
  COUNT(*) as total_reports,
  COUNT(*) FILTER (WHERE status = 'published') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM report_posts
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND report_run_id IS NOT NULL;  -- Only v2 reports
```

**Query for Latency Distribution**:
```sql
-- Latency percentiles over last 24 hours
SELECT
  percentile_cont(0.50) WITHIN GROUP (ORDER BY generation_time_ms) as p50,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY generation_time_ms) as p95,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY generation_time_ms) as p99
FROM report_runs
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND generation_time_ms IS NOT NULL;
```

---

## 🔔 Notification Channels

### Slack Channels

| Channel | Purpose | Alert Level |
|---------|---------|-------------|
| #critical-alerts | Critical issues requiring immediate action | P0 |
| #eng-alerts | High priority issues | P1 |
| #eng-monitoring | Medium priority monitoring | P2 |
| #deployment-alerts | Deployment notifications | All |
| #sentry-alerts | Sentry error notifications | All |

### PagerDuty

**On-Call Schedule**:
- Primary: 24/7 rotation
- Secondary: Backup escalation after 15 minutes
- Tertiary: Engineering manager

**Escalation Policy**:
1. Alert on-call engineer (immediate)
2. If no response in 15 min, escalate to secondary
3. If no response in 30 min, escalate to manager

---

## 📋 Monitoring Runbook

### Daily Checks (Automated)

```bash
# Run daily health report
./scripts/daily-health-report.sh
```

**Report includes**:
- Yesterday's success rate
- Latency metrics
- Error count
- Inngest task statistics
- Storage usage

---

### Weekly Review (Manual)

**Every Monday, 10:00 AM**:
1. Review SLO compliance
2. Check for trending issues
3. Review Sentry error patterns
4. Analyze user feedback
5. Update team on system health

**Template**: `docs/templates/weekly-monitoring-report.md`

---

### Monthly Analysis (Manual)

**First Monday of month**:
1. SLO attainment report
2. Cost analysis (Vercel, Supabase, Inngest)
3. Performance trends
4. Capacity planning
5. Security audit

---

## 🛠️ Troubleshooting Guide

### Common Issues

#### Issue: High Error Rate

**Symptoms**:
- Error rate > 5%
- Multiple Sentry alerts

**Investigation**:
```bash
# Check recent errors
vercel logs --prod | grep ERROR | tail -20

# Check Sentry
# Visit Sentry dashboard → Filter by last hour

# Check database
SELECT error_message, COUNT(*) as count
FROM report_runs
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND error_message IS NOT NULL
GROUP BY error_message
ORDER BY count DESC;
```

**Resolution**:
- If validation errors: Check input data
- If database errors: Check connection pool
- If API errors: Check external service status
- If unknown: Rollback deployment

---

#### Issue: High Latency

**Symptoms**:
- P95 latency > 60s
- User complaints

**Investigation**:
```bash
# Check slow requests
vercel logs --prod | grep "duration=" | sort -t= -k2 -n | tail -10

# Check Inngest queue
# Visit Inngest dashboard

# Check database
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Resolution**:
- If database slow: Add indexes, optimize queries
- If API slow: Check external service latency
- If Inngest slow: Increase concurrency
- If unknown: Scale Vercel functions

---

#### Issue: Inngest Tasks Failing

**Symptoms**:
- Inngest dashboard shows failures
- Retry exhausted

**Investigation**:
```bash
# Check Inngest dashboard
# Review failed function logs

# Check embedding service
curl https://YOUR_DOMAIN/api/embeddings/health
```

**Resolution**:
- If retry exhausted: Manual retry via Inngest UI
- If service down: Check API keys
- If rate limited: Adjust concurrency
- If bug: Fix code and redeploy

---

## 📚 References

### Documentation
- [Gradual Rollout Guide](./GRADUAL_ROLLOUT_GUIDE.md)
- [Deployment Verification](./DEPLOYMENT_VERIFICATION_CHECKLIST.md)
- [System v2 Guide](./REPORT_SYSTEM_V2_GUIDE.md)

### External Tools
- [Vercel Docs](https://vercel.com/docs)
- [Inngest Docs](https://www.inngest.com/docs)
- [Sentry Docs](https://docs.sentry.io/)
- [Supabase Docs](https://supabase.com/docs)

### Emergency Contacts
- **On-Call Engineer**: Check PagerDuty schedule
- **Database Admin**: contact@your-org.com
- **DevOps Lead**: devops@your-org.com
- **Product Owner**: product@your-org.com

---

**Last Updated**: 2025-12-03
**Next Review**: 2025-12-10
**Owner**: Engineering Team
