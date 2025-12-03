# Production Deployment Verification Checklist

**Deployment Date**: _________________
**Version**: Report System v2.0.0
**Deployed By**: _________________
**Deployment Type**: Gradual Rollout (0% → 10% → 100%)

---

## Pre-Deployment Checklist

### Database Readiness
- [ ] ✅ All migrations applied successfully
  ```bash
  supabase db push
  ```
- [ ] ✅ Database types regenerated
  ```bash
  npm run db:types
  ```
- [ ] ✅ Database backup created
  ```bash
  supabase db dump -f backup-$(date +%Y%m%d).sql
  ```
- [ ] ✅ RLS policies verified
- [ ] ✅ Indexes created successfully

### Environment Variables
- [ ] ✅ `INNGEST_EVENT_KEY` configured (production)
- [ ] ✅ `INNGEST_SIGNING_KEY` configured (production)
- [ ] ✅ `NEXT_PUBLIC_SUPABASE_URL` verified
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` verified
- [ ] ✅ `NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM=false` (initial)

### Code Quality
- [ ] ✅ PR #106 merged to main
- [ ] ✅ All tests passing
  ```bash
  npm run test
  ```
- [ ] ✅ Type check passing
  ```bash
  npm run type-check
  ```
- [ ] ✅ Lint passing
  ```bash
  npm run lint
  ```
- [ ] ✅ Build successful
  ```bash
  npm run build
  ```

### Documentation
- [ ] ✅ `GRADUAL_ROLLOUT_GUIDE.md` reviewed
- [ ] ✅ `REPORT_SYSTEM_V2_GUIDE.md` reviewed
- [ ] ✅ `POST_REVIEW_FIXES.md` reviewed
- [ ] ✅ `CODE_REVIEW_PR106.md` reviewed
- [ ] ✅ Team briefed on rollback procedures

---

## Deployment Day 1: Initial Deployment (0% Traffic)

**Date**: _________________
**Time**: _________________

### Deployment Steps
- [ ] ✅ Feature flag set to `false`
  ```bash
  ./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM false
  ```
- [ ] ✅ Production deployment triggered
  ```bash
  ./scripts/deploy-production.sh --with-migrations
  ```
- [ ] ✅ Deployment completed successfully
- [ ] ✅ Deployment URL verified: _________________

### Post-Deployment Verification
- [ ] ✅ Health check passing
  ```bash
  curl https://YOUR_DOMAIN/api/health
  ```
- [ ] ✅ Inngest endpoint accessible
  ```bash
  curl https://YOUR_DOMAIN/api/inngest
  ```
- [ ] ✅ Database connectivity verified
- [ ] ✅ Old system still working (v1)
- [ ] ✅ No errors in Sentry
- [ ] ✅ No errors in Vercel logs

### Monitoring Setup
- [ ] ✅ Sentry alerts configured
- [ ] ✅ Vercel analytics monitoring
- [ ] ✅ Inngest dashboard accessible
- [ ] ✅ Database monitoring active
- [ ] ✅ Metrics dashboard available

**Sign-off**: _________________ (Name & Time)

---

## Deployment Day 2: Enable 10% Traffic

**Date**: _________________
**Time**: _________________

### Pre-Activation Checks
- [ ] ✅ Day 1 deployment stable (24h+)
- [ ] ✅ No critical errors reported
- [ ] ✅ Old system functioning normally
- [ ] ✅ Team ready for monitoring

### Activation Steps
- [ ] ✅ Enable feature flag
  ```bash
  ./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM true
  ```
- [ ] ✅ Trigger redeployment
- [ ] ✅ Wait for deployment completion (5-10 min)

### 10% Traffic Verification (First Hour)
- [ ] ✅ New reports generated successfully (v2)
  - Report ID: _________________
  - Symbol: _________________
  - Generated at: _________________
- [ ] ✅ `report_posts` table has new records
  - Check `report_run_id` populated
  - Check `user_id` populated
  - Check `tone` field correct
- [ ] ✅ `audit_logs` table records present
  - Action: `GENERATE_REPORT`
  - `table_name` and `record_id` populated
- [ ] ✅ Inngest tasks triggered
  - Dashboard: https://app.inngest.com
  - Function: `generate-embeddings`
  - Status: Completed
- [ ] ✅ Storage files uploaded correctly
  - Bucket: `report-storage`
  - Path: `/reports/{reportRunId}/report.json`

### Performance Metrics (First 4 Hours)
- [ ] ✅ Success rate: ______% (Target: >99.5%)
- [ ] ✅ P50 latency: ______s (Target: <25s)
- [ ] ✅ P95 latency: ______s (Target: <45s)
- [ ] ✅ P99 latency: ______s (Target: <60s)
- [ ] ✅ Error rate: ______% (Target: <0.5%)

### Issue Tracking
**Issues Found**:
- Issue 1: _________________
  - Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
  - Status: _________________
- Issue 2: _________________

**Rollback Triggered**: [ ] Yes [ ] No
- If Yes, reason: _________________
- Rollback time: _________________

**Sign-off**: _________________ (Name & Time)

---

## Deployment Day 3-4: Monitor 10% Traffic

**Date Range**: _________________ to _________________

### Daily Monitoring
- [ ] ✅ Day 3: No critical issues
- [ ] ✅ Day 4: System stable

### Cumulative Metrics (48 Hours)
- [ ] ✅ Total reports generated (v2): _______
- [ ] ✅ Success rate: ______% (Target: >99.5%)
- [ ] ✅ Average latency: ______s
- [ ] ✅ Inngest tasks: _______ completed
- [ ] ✅ Storage usage: _______ MB
- [ ] ✅ Error count: _______

### User Feedback
- [ ] ✅ No user complaints
- [ ] ✅ Support tickets: _______ (related to v2)
- [ ] ✅ Feedback summary: _________________

**Sign-off**: _________________ (Name & Time)

---

## Deployment Day 5: Full Rollout (100% Traffic)

**Date**: _________________
**Time**: _________________

### Pre-Rollout Decision
- [ ] ✅ 10% traffic successful (3+ days)
- [ ] ✅ All metrics within SLO
- [ ] ✅ No outstanding critical issues
- [ ] ✅ Team approves full rollout

**Go/No-Go Decision**: [ ] GO [ ] NO-GO
- If No-Go, reason: _________________

### Full Rollout (if GO)
- [ ] ✅ Feature flag remains `true` (already at 100%)
- [ ] ✅ Monitor for first 2 hours closely
- [ ] ✅ All-hands monitoring shift assigned

### First Hour Verification
- [ ] ✅ Report generation working (v2)
- [ ] ✅ High volume handling (expected: ______ reports/hour)
- [ ] ✅ Inngest queue not backed up
- [ ] ✅ Database performance normal
- [ ] ✅ No error spikes

### First Day Metrics (100% Traffic)
- [ ] ✅ Total reports: _______
- [ ] ✅ Success rate: ______%
- [ ] ✅ P95 latency: ______s
- [ ] ✅ Inngest completion rate: ______%
- [ ] ✅ Error rate: ______%

**Sign-off**: _________________ (Name & Time)

---

## Deployment Day 6-8: Stability Period

**Date Range**: _________________ to _________________

### Daily Checks
- [ ] ✅ Day 6: System stable
- [ ] ✅ Day 7: System stable
- [ ] ✅ Day 8: System stable

### Weekly Summary (7 Days at 100%)
- [ ] ✅ Total reports generated: _______
- [ ] ✅ Average success rate: ______%
- [ ] ✅ Average P95 latency: ______s
- [ ] ✅ Total Inngest tasks: _______
- [ ] ✅ Total errors: _______
- [ ] ✅ User satisfaction: _______

### Post-Deployment Actions
- [ ] ✅ Old code cleanup (remove v1)
  - Delete `lib/core/reports/persistence.ts` (old)
  - Delete `lib/core/reports/generator.ts` (old)
  - Remove BullMQ references
- [ ] ✅ Feature flag removal (optional)
  - Remove `featureFlags.useNewReportSystem()`
  - Update code to always use v2
- [ ] ✅ Documentation updates
- [ ] ✅ Team retrospective completed

**Sign-off**: _________________ (Name & Time)

---

## Emergency Procedures

### Rollback Criteria
Immediately rollback if ANY of the following occur:
- ❌ Success rate drops below 95%
- ❌ P95 latency exceeds 60s consistently
- ❌ Critical database errors
- ❌ Data corruption detected
- ❌ Security vulnerability discovered

### Rollback Procedure
```bash
./scripts/rollback-deployment.sh --reason "YOUR_REASON"
```

**Rollback Steps**:
1. Disable feature flag immediately
2. Trigger redeployment
3. Create incident report
4. Notify team
5. Begin root cause analysis

### Emergency Contacts
- **On-Call Engineer**: _________________
- **Database Admin**: _________________
- **DevOps Lead**: _________________
- **Product Owner**: _________________

---

## Final Sign-Off

### Deployment Success Criteria
- [ ] ✅ All verification steps completed
- [ ] ✅ 7+ days of stable operation
- [ ] ✅ Metrics meet or exceed SLO
- [ ] ✅ No critical issues
- [ ] ✅ User satisfaction maintained

### Lessons Learned
**What went well**:
- _________________
- _________________

**What could be improved**:
- _________________
- _________________

**Action items for next deployment**:
- [ ] _________________
- [ ] _________________

---

**Final Approval**:

- **Engineering Lead**: _________________ (Name & Date)
- **Product Owner**: _________________ (Name & Date)
- **DevOps Lead**: _________________ (Name & Date)

**Deployment Status**: [ ] ✅ COMPLETE [ ] ⏳ IN PROGRESS [ ] ❌ ROLLED BACK

---

## Appendix: Quick Reference

### Useful Commands

```bash
# Check deployment status
vercel ls --prod

# View production logs
vercel logs --prod

# Check feature flag status
vercel env ls production | grep NEW_REPORT_SYSTEM

# Monitor metrics
./scripts/monitor-metrics.sh

# Test report generation
curl -X POST https://YOUR_DOMAIN/api/report \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "language": "en", "tone": "baseline"}'

# Check Inngest status
curl https://YOUR_DOMAIN/api/inngest

# Database query (check new reports)
# In Supabase Dashboard:
SELECT * FROM report_posts
WHERE report_run_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

# Check audit logs
SELECT * FROM audit_logs
WHERE action = 'GENERATE_REPORT'
ORDER BY created_at DESC
LIMIT 10;
```

### Monitoring Dashboards
- **Vercel**: https://vercel.com/dashboard
- **Inngest**: https://app.inngest.com/env/production/functions
- **Sentry**: https://sentry.io/organizations/YOUR_ORG
- **Supabase**: https://app.supabase.com/project/YOUR_PROJECT

### Documentation Links
- [Gradual Rollout Guide](./GRADUAL_ROLLOUT_GUIDE.md)
- [System v2 Guide](./REPORT_SYSTEM_V2_GUIDE.md)
- [Code Review](./CODE_REVIEW_PR106.md)
- [Post-Review Fixes](./POST_REVIEW_FIXES.md)
