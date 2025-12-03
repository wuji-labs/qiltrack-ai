#!/bin/bash
# 快速切换 Feature Flag
# Usage: ./scripts/toggle-feature-flag.sh <FEATURE_NAME> <true|false>

set -e

FEATURE=$1
VALUE=$2

if [ -z "$FEATURE" ] || [ -z "$VALUE" ]; then
  echo "Usage: ./scripts/toggle-feature-flag.sh <feature> <true|false>"
  echo "Example: ./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM true"
  echo ""
  echo "Available features:"
  echo "  - NEW_REPORT_SYSTEM"
  echo "  - NEW_CREDIT_SYSTEM"
  echo "  - ADVANCED_MONITORING"
  exit 1
fi

# Validate value
if [ "$VALUE" != "true" ] && [ "$VALUE" != "false" ]; then
  echo "❌ Error: VALUE must be 'true' or 'false'"
  exit 1
fi

ENV_VAR="NEXT_PUBLIC_USE_${FEATURE}"

echo "🔄 Updating feature flag: $ENV_VAR = $VALUE"

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
  echo "❌ Error: vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

# Update environment variable in Vercel
echo "📝 Removing old value..."
vercel env rm "$ENV_VAR" production --yes || true

echo "📝 Setting new value..."
echo "$VALUE" | vercel env add "$ENV_VAR" production

echo "✅ Feature flag $ENV_VAR set to $VALUE in production"
echo ""
echo "🔄 Triggering deployment..."
vercel deploy --prod

echo "✨ Done! Feature flag updated and deployed."
