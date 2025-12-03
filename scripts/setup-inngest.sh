#!/bin/bash
# Setup Inngest Integration
# Purpose: Configure Inngest for background task processing
# Usage: ./scripts/setup-inngest.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Inngest Setup - Background Task Processing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check if already configured
echo -e "${YELLOW}📋 Step 1/5: Checking existing configuration${NC}"
echo ""

if [ -f ".env.local" ]; then
  if grep -q "INNGEST_EVENT_KEY" .env.local && grep -q "INNGEST_SIGNING_KEY" .env.local; then
    echo -e "${GREEN}✅ Inngest already configured in .env.local${NC}"
    ALREADY_CONFIGURED=true
  else
    ALREADY_CONFIGURED=false
  fi
else
  ALREADY_CONFIGURED=false
fi

if [ "$ALREADY_CONFIGURED" = true ]; then
  read -p "Reconfigure Inngest? (yes/no): " reconfigure
  if [ "$reconfigure" != "yes" ]; then
    echo -e "${YELLOW}⏭️  Setup cancelled${NC}"
    exit 0
  fi
fi

echo ""

# Step 2: Create Inngest account (if needed)
echo -e "${YELLOW}📝 Step 2/5: Inngest account setup${NC}"
echo ""

echo "Do you have an Inngest account?"
echo "  If not, sign up at: https://app.inngest.com/sign-up"
echo ""
read -p "Have you created an Inngest account? (yes/no): " has_account

if [ "$has_account" != "yes" ]; then
  echo ""
  echo -e "${BLUE}📖 Instructions:${NC}"
  echo "  1. Go to https://app.inngest.com/sign-up"
  echo "  2. Sign up with your GitHub account"
  echo "  3. Create a new app (name: 'investor-ai')"
  echo "  4. Return here when done"
  echo ""
  read -p "Press Enter when you've created your account..."
fi

echo ""

# Step 3: Get API keys
echo -e "${YELLOW}🔑 Step 3/5: Get Inngest API keys${NC}"
echo ""

echo -e "${BLUE}📖 How to get your Inngest keys:${NC}"
echo "  1. Go to https://app.inngest.com/env/production/manage/keys"
echo "  2. Click 'Create Event Key' if you don't have one"
echo "  3. Copy the Event Key (starts with 'inngest_event_key_')"
echo "  4. Copy the Signing Key (starts with 'signkey-prod-')"
echo ""

read -p "Enter your Inngest Event Key: " EVENT_KEY
read -p "Enter your Inngest Signing Key: " SIGNING_KEY

if [ -z "$EVENT_KEY" ] || [ -z "$SIGNING_KEY" ]; then
  echo -e "${RED}❌ Error: Both keys are required${NC}"
  exit 1
fi

# Validate key formats
if [[ ! "$EVENT_KEY" =~ ^inngest_event_key_ ]]; then
  echo -e "${RED}❌ Error: Invalid Event Key format${NC}"
  echo "Should start with 'inngest_event_key_'"
  exit 1
fi

if [[ ! "$SIGNING_KEY" =~ ^signkey-prod- ]]; then
  echo -e "${RED}❌ Error: Invalid Signing Key format${NC}"
  echo "Should start with 'signkey-prod-'"
  exit 1
fi

echo ""

# Step 4: Configure local environment
echo -e "${YELLOW}💾 Step 4/5: Configuring local environment${NC}"
echo ""

# Update .env.local
if [ -f ".env.local" ]; then
  # Remove old keys if exist
  sed -i.bak '/INNGEST_EVENT_KEY/d' .env.local
  sed -i.bak '/INNGEST_SIGNING_KEY/d' .env.local
fi

cat >> .env.local <<EOF

# Inngest Configuration (Background Tasks)
INNGEST_EVENT_KEY=$EVENT_KEY
INNGEST_SIGNING_KEY=$SIGNING_KEY
EOF

echo -e "${GREEN}✅ Keys saved to .env.local${NC}"
echo ""

# Step 5: Configure production environment
echo -e "${YELLOW}🌐 Step 5/5: Configuring production environment${NC}"
echo ""

read -p "Configure Vercel production environment? (yes/no): " configure_prod

if [ "$configure_prod" = "yes" ]; then
  if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Error: vercel CLI not found${NC}"
    echo "Install with: npm i -g vercel"
    exit 1
  fi

  echo "Adding keys to Vercel production..."

  # Remove old values
  vercel env rm "INNGEST_EVENT_KEY" production --yes 2>/dev/null || true
  vercel env rm "INNGEST_SIGNING_KEY" production --yes 2>/dev/null || true

  # Add new values
  echo "$EVENT_KEY" | vercel env add "INNGEST_EVENT_KEY" production
  echo "$SIGNING_KEY" | vercel env add "INNGEST_SIGNING_KEY" production

  echo -e "${GREEN}✅ Production environment configured${NC}"
else
  echo -e "${YELLOW}⏭️  Skipping production configuration${NC}"
  echo ""
  echo "To configure later, run:"
  echo "  echo '$EVENT_KEY' | vercel env add INNGEST_EVENT_KEY production"
  echo "  echo '$SIGNING_KEY' | vercel env add INNGEST_SIGNING_KEY production"
fi

echo ""

# Success summary
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Inngest Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "Configuration:"
echo -e "  - Event Key: ${GREEN}${EVENT_KEY:0:25}...${NC}"
echo -e "  - Signing Key: ${GREEN}${SIGNING_KEY:0:25}...${NC}"
echo -e "  - Local env: ${GREEN}.env.local${NC}"
echo ""
echo "Next steps:"
echo "  1. Test locally: npm run dev"
echo "  2. Generate a test report"
echo "  3. Check Inngest dashboard:"
echo -e "     ${BLUE}https://app.inngest.com/env/production/functions${NC}"
echo "  4. Verify background tasks are running"
echo ""
echo "Inngest Features:"
echo "  ✅ Automatic retries (3x)"
echo "  ✅ Concurrency control (10 parallel)"
echo "  ✅ Task persistence"
echo "  ✅ Visual monitoring dashboard"
echo "  ✅ Free tier: 1000 steps/month"
echo ""
