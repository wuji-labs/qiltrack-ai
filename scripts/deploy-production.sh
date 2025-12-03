#!/bin/bash
# Production Deployment Script
# Purpose: Deploy report generation system v2 to production
# Usage: ./scripts/deploy-production.sh [--with-migrations] [--skip-verification]

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV="production"
FEATURE_FLAG="NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM"
REQUIRED_ENV_VARS=(
  "INNGEST_EVENT_KEY"
  "INNGEST_SIGNING_KEY"
  "NEXT_PUBLIC_SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
)

# Parse arguments
WITH_MIGRATIONS=false
SKIP_VERIFICATION=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --with-migrations)
      WITH_MIGRATIONS=true
      shift
      ;;
    --skip-verification)
      SKIP_VERIFICATION=true
      shift
      ;;
    *)
      echo -e "${RED}❌ Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Production Deployment - Report System v2${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Pre-flight checks
echo -e "${YELLOW}📋 Step 1/6: Pre-flight checks${NC}"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo -e "${RED}❌ Error: vercel CLI not found${NC}"
  echo "Install with: npm i -g vercel"
  exit 1
fi
echo -e "${GREEN}✅ Vercel CLI found${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo -e "${RED}❌ Error: gh CLI not found${NC}"
  echo "Install with: brew install gh (Mac) or download from https://cli.github.com/"
  exit 1
fi
echo -e "${GREEN}✅ GitHub CLI found${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}⚠️  Warning: supabase CLI not found${NC}"
  if [ "$WITH_MIGRATIONS" = true ]; then
    echo -e "${RED}❌ Error: supabase CLI required for --with-migrations${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✅ Supabase CLI found${NC}"
fi

echo ""

# Step 2: Verify current deployment status
echo -e "${YELLOW}📊 Step 2/6: Verify current deployment${NC}"
echo ""

# Get current production URL
PROD_URL=$(vercel ls --prod --json 2>/dev/null | head -1 || echo "")

if [ -z "$PROD_URL" ]; then
  echo -e "${RED}❌ Error: Could not fetch production URL${NC}"
  echo "Run: vercel link first"
  exit 1
fi

echo -e "${GREEN}✅ Production URL found${NC}"
echo ""

# Step 3: Database migrations (if requested)
if [ "$WITH_MIGRATIONS" = true ]; then
  echo -e "${YELLOW}🗄️  Step 3/6: Database migrations${NC}"
  echo ""

  read -p "⚠️  This will apply migrations to PRODUCTION database. Continue? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
  fi

  echo "Linking to production project..."
  supabase link --project-ref $(vercel env pull .env.production && grep NEXT_PUBLIC_SUPABASE_URL .env.production | cut -d'/' -f3 | cut -d'.' -f1)

  echo "Creating database backup..."
  BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
  supabase db dump -f "$BACKUP_FILE"
  echo -e "${GREEN}✅ Backup saved to: $BACKUP_FILE${NC}"

  echo "Applying migrations..."
  supabase db push --include-all

  echo "Generating new types..."
  npm run db:types

  echo -e "${GREEN}✅ Database migrations completed${NC}"
else
  echo -e "${YELLOW}⏭️  Step 3/6: Skipping database migrations${NC}"
fi
echo ""

# Step 4: Configure environment variables
echo -e "${YELLOW}🔧 Step 4/6: Environment variables check${NC}"
echo ""

MISSING_VARS=()
for var in "${REQUIRED_ENV_VARS[@]}"; do
  if ! vercel env ls production | grep -q "$var"; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${RED}❌ Missing required environment variables:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "Set them with:"
  echo "  vercel env add $var production"
  exit 1
fi

echo -e "${GREEN}✅ All required environment variables present${NC}"
echo ""

# Step 5: Deploy to production
echo -e "${YELLOW}🚀 Step 5/6: Deploying to production${NC}"
echo ""

# Ensure feature flag is OFF initially
echo "Setting feature flag to false (safe deployment)..."
echo "false" | vercel env rm "$FEATURE_FLAG" production --yes 2>/dev/null || true
echo "false" | vercel env add "$FEATURE_FLAG" production

echo "Triggering production deployment..."
DEPLOY_URL=$(vercel deploy --prod --yes 2>&1 | grep -o 'https://[^ ]*' | tail -1)

if [ -z "$DEPLOY_URL" ]; then
  echo -e "${RED}❌ Deployment failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Deployed to: $DEPLOY_URL${NC}"
echo ""

# Step 6: Verification
if [ "$SKIP_VERIFICATION" = false ]; then
  echo -e "${YELLOW}✅ Step 6/6: Post-deployment verification${NC}"
  echo ""

  echo "Waiting for deployment to become ready (30s)..."
  sleep 30

  echo "Testing health endpoint..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/api/health" || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
  else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    exit 1
  fi

  echo "Testing Inngest endpoint..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/api/inngest" || echo "000")

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "405" ]; then
    echo -e "${GREEN}✅ Inngest endpoint accessible${NC}"
  else
    echo -e "${RED}❌ Inngest endpoint failed (HTTP $HTTP_CODE)${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⏭️  Step 6/6: Skipping verification${NC}"
fi
echo ""

# Success summary
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Deployment Successful!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "🌐 Production URL: ${BLUE}$DEPLOY_URL${NC}"
echo -e "🎛️  Feature Flag: ${RED}OFF${NC} (safe deployment)"
echo ""
echo "Next steps:"
echo "  1. Monitor metrics dashboard"
echo "  2. Run smoke tests"
echo "  3. Enable feature flag gradually:"
echo "     ./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM true"
echo ""
echo "Rollback instructions:"
echo "  ./scripts/rollback-deployment.sh"
echo ""
echo -e "${GREEN}📚 Full guide: docs/GRADUAL_ROLLOUT_GUIDE.md${NC}"
