# Complete Deployment Guide - Report System v2

**Version**: 2.0.0
**Last Updated**: 2025-12-03
**Status**: ✅ Ready for Production

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Pre-Deployment Setup](#pre-deployment-setup)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Gradual Rollout Schedule](#gradual-rollout-schedule)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Overview

### What's Being Deployed

**Report Generation System v2** - A complete refactor following KISS principles:

- ✅ Direct Supabase client usage (no RPC functions)
- ✅ Inngest for background tasks (replaces BullMQ)
- ✅ Feature Flag for gradual rollout
- ✅ Type-safe persistence layer
- ✅ Complete audit logging
- ✅ Enhanced monitoring

### Deployment Strategy

- **Type**: Gradual rollout (Canary deployment)
- **Duration**: 8 days (Day 1-8)
- **Rollout**: 0% → 10% → 100%
- **Rollback Time**: < 2 minutes

### Key Benefits

- 🚀 Simpler architecture
- 🛡️ Better type safety
- 📊 Enhanced monitoring
- ⚡ Improved performance
- 🔄 Zero-downtime deployment

---

## Prerequisites

### Required Tools

```bash
# Check if tools are installed
node --version    # v20+
npm --version     # v10+
vercel --version  # Latest
gh --version      # Latest
supabase --version # Latest (optional for local testing)
```

**Install missing tools**:
```bash
# Vercel CLI
npm i -g vercel

# GitHub CLI
brew install gh  # Mac
# or download from https://cli.github.com/

# Supabase CLI (optional)
brew install supabase/tap/supabase  # Mac
# or download from https://supabase.com/docs/guides/cli
```

### Required Access

- ✅ Vercel project admin access
- ✅ GitHub repository write access
- ✅ Supabase project access
- ✅ Inngest account (create at https://app.inngest.com)
- ✅ Slack webhook for notifications (optional)

### Environment Requirements

**Production**:
- ✅ Node.js 20+ runtime (Vercel)
- ✅ PostgreSQL 15+ (Supabase)
- ✅ Inngest account configured

---

## Pre-Deployment Setup

### Step 1: Inngest Configuration

```bash
# Run interactive setup
./scripts/setup-inngest.sh
```

This will:
1. Guide you through Inngest account creation
2. Collect API keys (Event Key, Signing Key)
3. Configure `.env.local`
4. Configure Vercel production environment

**Manual configuration** (if script fails):
```bash
# Get keys from: https://app.inngest.com/env/production/manage/keys

# Add to Vercel
echo "YOUR_EVENT_KEY" | vercel env add INNGEST_EVENT_KEY production
echo "YOUR_SIGNING_KEY" | vercel env add INNGEST_SIGNING_KEY production
```

### Step 2: Database Preparation

**Option A: With Supabase CLI** (Recommended)
```bash
# Link to production project
supabase link --project-ref YOUR_PROJECT_REF

# Create backup
supabase db dump -f backup-$(date +%Y%m%d).sql

# Apply migrations
supabase db push --include-all

# Generate types
npm run db:types

# Verify
npm run type-check
```

**Option B: Manual via Supabase Dashboard**
```bash
# Go to: https://app.supabase.com/project/YOUR_PROJECT/editor
# Run migrations manually:
#   1. supabase/migrations/20251203000010_fix_report_posts_schema.sql
#   2. supabase/migrations/20251203000011_fix_audit_logs_schema.sql

# Then generate types locally
npm run db:types
```

### Step 3: Verify Prerequisites

```bash
# Run pre-deployment checks
npm run lint
npm run type-check
npm run build

# All should pass ✅
```

### Step 4: Create Backup Plan

```bash
# Note current production state
vercel ls --prod > backup-deployment-info.txt

# Note current database state
# (Backup already created in Step 2)

# Note current feature flag
vercel env ls production | grep NEW_REPORT_SYSTEM >> backup-deployment-info.txt
```

---

## Deployment Steps

### Day 1: Initial Deployment (0% Traffic)

**Goal**: Deploy new code with feature flag OFF

```bash
# Step 1: Run deployment script
./scripts/deploy-production.sh --with-migrations

# This will:
# - Apply database migrations
# - Configure feature flag to false
# - Deploy to production
# - Run health checks
```

**Expected output**:
```
═══════════════════════════════════════════════════
   ✅ Deployment Successful!
═══════════════════════════════════════════════════

🌐 Production URL: https://your-domain.com
🎛️  Feature Flag: OFF (safe deployment)

Next steps:
  1. Monitor metrics dashboard
  2. Run smoke tests
  3. Enable feature flag gradually
```

**Verification checklist**:
- [ ] Deployment completed without errors
- [ ] Health endpoint returns 200: `curl https://YOUR_DOMAIN/api/health`
- [ ] Inngest endpoint accessible: `curl https://YOUR_DOMAIN/api/inngest`
- [ ] Old system still working (generate a test report)
- [ ] No errors in Vercel logs
- [ ] No errors in Sentry

**If any verification fails**: Do NOT proceed to Day 2. Investigate and fix issues first.

---

### Day 2: Enable 10% Traffic

**Goal**: Gradually enable new system for 10% of users

**Prerequisites**:
- ✅ Day 1 deployment stable for 24+ hours
- ✅ No critical errors
- ✅ Team ready for monitoring

```bash
# Step 1: Enable feature flag
./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM true

# This will:
# - Set NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM=true
# - Trigger production deployment
# - Wait for deployment completion
```

**Monitor closely for first 2 hours**:

```bash
# Real-time log monitoring
vercel logs --prod --follow

# Generate test report
curl -X POST https://YOUR_DOMAIN/api/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "symbol": "AAPL",
    "language": "en",
    "tone": "baseline"
  }'

# Check database for new records
# In Supabase Dashboard → SQL Editor:
SELECT * FROM report_posts
WHERE report_run_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

# Check Inngest dashboard
# Visit: https://app.inngest.com/env/production/functions
```

**Verification checklist** (First hour):
- [ ] New reports generated successfully (v2)
- [ ] `report_posts.report_run_id` populated
- [ ] `report_posts.user_id` populated
- [ ] `report_posts.tone` correct
- [ ] `audit_logs` records created
- [ ] Inngest tasks completed
- [ ] Storage files uploaded
- [ ] No error spikes
- [ ] Latency within target

**If issues detected**:
```bash
# Immediate rollback
./scripts/rollback-deployment.sh --reason "Your reason here"
```

---

### Day 3-4: Monitor 10% Traffic

**Goal**: Ensure stability before full rollout

**Daily tasks**:

```bash
# Run daily health report
./scripts/daily-health-report.sh --slack

# Check key metrics
./scripts/monitor-metrics.sh
```

**Success criteria for full rollout**:
- ✅ Success rate > 99.5%
- ✅ P95 latency < 45s
- ✅ No critical errors
- ✅ Inngest tasks completing
- ✅ No user complaints

---

### Day 5: Full Rollout (100% Traffic)

**Goal**: Enable new system for all users

**Prerequisites**:
- ✅ 10% traffic successful for 3+ days
- ✅ All metrics within SLO
- ✅ Team approval

**Go/No-Go Decision**:
```bash
# Review metrics from last 72 hours
./scripts/daily-health-report.sh

# If all green, proceed to full rollout
# If any yellow/red, delay rollout and investigate
```

**Full Rollout** (if GO):

Feature flag is already `true`, so 100% of traffic is now using v2. No additional action needed unless you want to remove the flag entirely.

**Optional: Remove feature flag** (after 7+ days of stability):
```bash
# Remove flag from code
# 1. Delete lib/feature-flags.ts
# 2. Update code to always use v2
# 3. Deploy

# Or keep flag for easy rollback
```

---

## Post-Deployment Verification

### Immediate Checks (0-2 hours)

```bash
# 1. Health check
curl https://YOUR_DOMAIN/api/health
# Expected: 200 OK

# 2. Generate test report
curl -X POST https://YOUR_DOMAIN/api/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"symbol": "TSLA", "language": "en", "tone": "baseline"}'
# Expected: 200 OK with report data

# 3. Check Inngest
# Visit: https://app.inngest.com/env/production/functions
# Verify: generate-embeddings function shows recent executions

# 4. Check database
# In Supabase Dashboard → Table Editor:
# - report_posts: New records with report_run_id
# - audit_logs: New records with action='GENERATE_REPORT'

# 5. Check logs
vercel logs --prod | grep ERROR
# Expected: No critical errors
```

### Daily Checks (Day 1-8)

```bash
# Automated daily report
./scripts/daily-health-report.sh --slack
```

### Weekly Review

**Complete verification checklist**:
`docs/DEPLOYMENT_VERIFICATION_CHECKLIST.md`

---

## Gradual Rollout Schedule

| Day | Traffic | Actions | Success Criteria |
|-----|---------|---------|------------------|
| **1** | 0% | Deploy with flag OFF | Deployment successful, no errors |
| **2** | 10% | Enable flag | 10% reports use v2, no issues |
| **3-4** | 10% | Monitor | Stable for 48+ hours |
| **5** | 100% | Full rollout | All reports use v2 |
| **6-8** | 100% | Stability period | 7+ days stable |

**Timeline adjustments**:
- If issues on Day 2: Rollback and investigate
- If issues on Day 3-4: Extend monitoring period
- If issues on Day 5+: Rollback and reassess

---

## Monitoring & Alerts

### Real-Time Monitoring

```bash
# Start monitoring dashboard
./scripts/monitor-metrics.sh

# Watch logs in real-time
vercel logs --prod --follow

# Monitor Inngest
# Visit: https://app.inngest.com/env/production/functions
```

### Alert Channels

- **Critical (P0)**: PagerDuty + Slack #critical-alerts
- **High (P1)**: Slack #eng-alerts
- **Medium (P2)**: Slack #eng-monitoring
- **Low (P3)**: Slack #eng-monitoring

### Key Metrics to Watch

1. **Success Rate** (Target: >99.5%)
   - Alert if < 95%

2. **P95 Latency** (Target: <45s)
   - Alert if > 60s

3. **Error Rate** (Target: <0.5%)
   - Alert if > 5%

4. **Inngest Queue Depth** (Target: <10)
   - Alert if > 100

Full monitoring guide: `docs/PRODUCTION_MONITORING.md`

---

## Rollback Procedures

### Emergency Rollback (< 2 minutes)

```bash
# Immediate rollback
./scripts/rollback-deployment.sh --reason "High error rate detected"

# This will:
# 1. Disable feature flag (immediate effect)
# 2. Trigger redeployment
# 3. Create incident report
# 4. Notify team
```

### Manual Rollback

```bash
# 1. Disable feature flag
echo "false" | vercel env rm NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM production --yes
echo "false" | vercel env add NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM production

# 2. Trigger deployment
vercel deploy --prod

# 3. Verify
curl https://YOUR_DOMAIN/api/health
```

### Post-Rollback Actions

1. Create incident report: `docs/incidents/rollback-YYYYMMDD-HHMMSS.md`
2. Notify team in Slack
3. Investigate root cause
4. Fix issues
5. Plan re-deployment

---

## Troubleshooting

### Issue: Health Check Failing

**Symptoms**: `curl https://YOUR_DOMAIN/api/health` returns non-200

**Investigation**:
```bash
# Check deployment status
vercel ls --prod

# Check logs
vercel logs --prod | grep ERROR | tail -20

# Check build logs
vercel logs --prod --since 1h | grep "Build"
```

**Resolution**:
- Redeploy if build failed
- Check environment variables if missing
- Rollback if persistent issues

---

### Issue: High Error Rate

**Symptoms**: Error rate > 5% in metrics

**Investigation**:
```bash
# Check Sentry
# Visit Sentry dashboard

# Check database errors
# In Supabase Dashboard → Logs

# Check recent changes
git log --oneline --since="24 hours ago"
```

**Resolution**:
- If input validation: Update validation rules
- If database: Check connection pool, indexes
- If external API: Check service status
- If unknown: Rollback

---

### Issue: Slow Performance

**Symptoms**: P95 latency > 60s

**Investigation**:
```bash
# Check slow logs
vercel logs --prod | grep "duration=" | sort -t= -k2 -n | tail -10

# Check Inngest
# Visit Inngest dashboard → Check function duration

# Check database
# In Supabase Dashboard → Query Performance
```

**Resolution**:
- Add database indexes
- Increase Inngest concurrency
- Optimize slow queries
- Scale Vercel functions

---

### Issue: Inngest Tasks Failing

**Symptoms**: Inngest dashboard shows failures

**Investigation**:
```bash
# Check Inngest dashboard
# Review failed function logs

# Check environment variables
vercel env ls production | grep INNGEST
```

**Resolution**:
- Verify API keys are correct
- Check external service availability
- Manually retry failed tasks
- Adjust retry configuration

---

## FAQ

### Q: Can I deploy during business hours?

**A**: Yes, the deployment is zero-downtime. However, recommend deploying during off-peak hours (e.g., evening/weekend) for Day 2 (10% rollout).

---

### Q: How long does each deployment take?

**A**:
- Day 1 (0%): 5-10 minutes
- Day 2 (10%): 5-10 minutes
- Day 5 (100%): No additional deployment needed

---

### Q: What if I need to rollback during Day 5 (100%)?

**A**: Run `./scripts/rollback-deployment.sh`. System will revert to v1 within 2 minutes.

---

### Q: Can I skip the 10% phase?

**A**: Not recommended. The gradual rollout is designed to catch issues early with minimal user impact.

---

### Q: Do I need to run migrations every time?

**A**: No, only on Day 1. Subsequent deployments (Day 2, 5) don't need `--with-migrations`.

---

### Q: What if migrations fail?

**A**: Migrations are idempotent (can be run multiple times safely). Check error message, fix issue, and re-run.

---

### Q: How do I know if 10% is working?

**A**:
1. Check Vercel Analytics (10% of reports should show v2 metrics)
2. Check database (10% of report_posts should have `report_run_id`)
3. Check Inngest dashboard (should show ~10% of normal task volume)

---

### Q: Can I increase from 10% to 50% instead of 100%?

**A**: Yes, but requires code changes. Current implementation is binary (0% or 100% based on feature flag). For percentage-based rollout, need to implement sampling logic.

---

### Q: What happens to in-flight reports during deployment?

**A**:
- Vercel has zero-downtime deployments
- In-flight requests complete on old version
- New requests route to new version
- No reports lost

---

## Additional Resources

### Documentation
- [Gradual Rollout Guide](./GRADUAL_ROLLOUT_GUIDE.md)
- [System v2 Guide](./REPORT_SYSTEM_V2_GUIDE.md)
- [Code Review](./CODE_REVIEW_PR106.md)
- [Post-Review Fixes](./POST_REVIEW_FIXES.md)
- [Production Monitoring](./PRODUCTION_MONITORING.md)
- [Verification Checklist](./DEPLOYMENT_VERIFICATION_CHECKLIST.md)

### Scripts
- `scripts/deploy-production.sh` - Main deployment script
- `scripts/setup-inngest.sh` - Inngest configuration
- `scripts/toggle-feature-flag.sh` - Feature flag management
- `scripts/rollback-deployment.sh` - Emergency rollback
- `scripts/monitor-metrics.sh` - Real-time monitoring
- `scripts/daily-health-report.sh` - Daily health reports

### External Links
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Inngest Dashboard](https://app.inngest.com)
- [Sentry Dashboard](https://sentry.io)
- [Supabase Dashboard](https://app.supabase.com)

---

**Last Updated**: 2025-12-03
**Version**: 2.0.0
**Status**: ✅ Production Ready

**Deployment Team**: Engineering
**Support**: Slack #eng-support
