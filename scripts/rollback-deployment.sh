#!/bin/bash
# Rollback Deployment Script
# Purpose: Quick rollback to previous version if issues occur
# Usage: ./scripts/rollback-deployment.sh [--reason "description"]

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROLLBACK_REASON="Manual rollback"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --reason)
      ROLLBACK_REASON="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}❌ Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${RED}═══════════════════════════════════════════════════${NC}"
echo -e "${RED}   🚨 EMERGENCY ROLLBACK${NC}"
echo -e "${RED}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "Reason: ${YELLOW}$ROLLBACK_REASON${NC}"
echo ""

read -p "⚠️  This will rollback production. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo -e "${YELLOW}❌ Rollback cancelled${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}🔄 Step 1/3: Disabling new report system${NC}"
echo ""

# Immediately disable feature flag
echo "Disabling feature flag..."
echo "false" | vercel env rm "NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM" production --yes 2>/dev/null || true
echo "false" | vercel env add "NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM" production

echo -e "${GREEN}✅ Feature flag disabled${NC}"
echo ""

echo -e "${YELLOW}🔄 Step 2/3: Redeploying previous version${NC}"
echo ""

# Trigger immediate redeployment to apply env change
echo "Triggering redeployment..."
DEPLOY_URL=$(vercel deploy --prod --yes 2>&1 | grep -o 'https://[^ ]*' | tail -1)

if [ -z "$DEPLOY_URL" ]; then
  echo -e "${RED}❌ Redeployment failed${NC}"
  echo "Manually redeploy via Vercel dashboard"
  exit 1
fi

echo -e "${GREEN}✅ Redeployed to: $DEPLOY_URL${NC}"
echo ""

echo -e "${YELLOW}📝 Step 3/3: Recording rollback${NC}"
echo ""

# Record rollback in logs
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "[$TIMESTAMP] ROLLBACK: $ROLLBACK_REASON" >> logs/deployment-history.log

# Create incident report
INCIDENT_FILE="docs/incidents/rollback-$(date +%Y%m%d-%H%M%S).md"
mkdir -p docs/incidents
cat > "$INCIDENT_FILE" <<EOF
# Rollback Incident Report

**Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Action**: Emergency Rollback
**Reason**: $ROLLBACK_REASON

## Timeline

- **$(date -u +"%H:%M:%S UTC")**: Feature flag disabled
- **$(date -u +"%H:%M:%S UTC")**: Redeployment triggered
- **$(date -u +"%H:%M:%S UTC")**: Rollback completed

## Actions Taken

1. ✅ Disabled NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM feature flag
2. ✅ Triggered production redeployment
3. ✅ System reverted to stable v1

## Current State

- Feature Flag: OFF
- Active System: Report System v1
- Status: STABLE

## Post-Mortem Tasks

- [ ] Investigate root cause
- [ ] Fix identified issues
- [ ] Update tests to prevent recurrence
- [ ] Plan re-deployment strategy

## Notes

Add investigation notes here...

EOF

echo -e "${GREEN}✅ Incident report created: $INCIDENT_FILE${NC}"
echo ""

# Success summary
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Rollback Completed${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "Current state:"
echo -e "  - Feature Flag: ${RED}OFF${NC}"
echo -e "  - Active System: ${GREEN}Report System v1 (stable)${NC}"
echo -e "  - Production URL: ${BLUE}$DEPLOY_URL${NC}"
echo ""
echo "Next steps:"
echo "  1. Monitor system stability"
echo "  2. Investigate rollback reason"
echo "  3. Complete incident report: $INCIDENT_FILE"
echo "  4. Fix issues before re-deployment"
echo ""
