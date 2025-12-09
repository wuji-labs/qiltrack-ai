#!/bin/bash

# Sync Worktree Safety Files to All Worktrees
# Usage: bash scripts/sync-safety-to-worktrees.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m'

echo -e "${CYAN}🔧 Syncing worktree safety files to all worktrees...${NC}"
echo ""

# Define worktree paths (Windows paths work in Git Bash)
WORKTREES=(
    "D:/Projects/qiltrack-ai"
    "D:/Projects/qiltrack-ai-g1"
    "D:/Projects/qiltrack-ai-g2"
    "D:/Projects/qiltrack-ai-g3"
    "D:/Projects/qiltrack-ai-g4"
    "D:/Projects/qiltrack-ai-g5"
)

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Files to sync
SCRIPT_FILES=(
    "scripts/dev-safe.js"
    "scripts/dev-stop.js"
    "scripts/dev-restart.js"
)

DOC_FILES=(
    "docs/AI-WORKTREE-GUIDE.md"
    "docs/DEPLOY-WORKTREE-SAFETY.md"
    "AI-COMMANDS.md"
)

SYNC_COUNT=0
SKIP_COUNT=0

for wt in "${WORKTREES[@]}"; do
    if [ -d "$wt" ]; then
        echo -e "${YELLOW}📦 Syncing to: $wt${NC}"

        # Copy scripts
        for file in "${SCRIPT_FILES[@]}"; do
            source="$CURRENT_DIR/$file"
            dest="$wt/$file"

            if [ -f "$source" ]; then
                cp "$source" "$dest"
                echo -e "   ${GREEN}✅ Copied $file${NC}"
            else
                echo -e "   ${YELLOW}⚠️  Source not found: $file${NC}"
            fi
        done

        # Ensure docs directory exists
        mkdir -p "$wt/docs"

        # Copy docs
        for file in "${DOC_FILES[@]}"; do
            source="$CURRENT_DIR/$file"
            dest="$wt/$file"

            if [ -f "$source" ]; then
                cp "$source" "$dest"
                echo -e "   ${GREEN}✅ Copied $file${NC}"
            else
                echo -e "   ${YELLOW}⚠️  Source not found: $file${NC}"
            fi
        done

        ((SYNC_COUNT++))
        echo ""
    else
        echo -e "${YELLOW}⚠️  Worktree not found: $wt${NC}"
        ((SKIP_COUNT++))
    fi
done

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Sync complete!${NC}"
echo -e "   ${GREEN}✅ Synced: $SYNC_COUNT worktrees${NC}"
if [ $SKIP_COUNT -gt 0 ]; then
    echo -e "   ${YELLOW}⚠️  Skipped: $SKIP_COUNT worktrees${NC}"
fi
echo ""
echo -e "${CYAN}📋 Next steps:${NC}"
echo -e "1. Verify package.json has the new scripts in each worktree:"
echo -e "   ${GRAY}- dev:safe${NC}"
echo -e "   ${GRAY}- dev:stop${NC}"
echo -e "   ${GRAY}- dev:restart${NC}"
echo ""
echo -e "2. Tell your AIs to read AI-COMMANDS.md"
echo ""
echo -e "3. Test in each worktree:"
echo -e "   ${GRAY}npm run dev:safe${NC}"
echo -e "   ${GRAY}npm run dev:stop${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
