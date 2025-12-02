#!/bin/bash

# =============================================================================
# Test Database Backup Scripts
# =============================================================================
# Description: Tests the backup scripts without actually running a backup
# Usage: npm run test:backup
# =============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Testing Database Backup Scripts..."
echo ""

# Test 1: Check if bash script exists
if [ -f "scripts/backup-database.sh" ]; then
    echo -e "${GREEN}✓${NC} backup-database.sh exists"
else
    echo -e "${RED}✗${NC} backup-database.sh not found"
    exit 1
fi

# Test 2: Check if PowerShell script exists
if [ -f "scripts/backup-database.ps1" ]; then
    echo -e "${GREEN}✓${NC} backup-database.ps1 exists"
else
    echo -e "${RED}✗${NC} backup-database.ps1 not found"
    exit 1
fi

# Test 3: Check bash script syntax
if bash -n scripts/backup-database.sh 2>/dev/null; then
    echo -e "${GREEN}✓${NC} backup-database.sh syntax is valid"
else
    echo -e "${RED}✗${NC} backup-database.sh has syntax errors"
    exit 1
fi

# Test 4: Check if backup directory structure can be created
if mkdir -p backups/db 2>/dev/null; then
    echo -e "${GREEN}✓${NC} backup directory can be created"
    rmdir backups/db 2>/dev/null || true
    rmdir backups 2>/dev/null || true
else
    echo -e "${RED}✗${NC} cannot create backup directory"
    exit 1
fi

# Test 5: Check if required commands are available
commands=("gzip" "find" "date")
for cmd in "${commands[@]}"; do
    if command -v "$cmd" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $cmd is available"
    else
        echo -e "${RED}✗${NC} $cmd not found (required by backup script)"
    fi
done

# Test 6: Check if package.json has backup scripts
if grep -q '"backup:db"' package.json; then
    echo -e "${GREEN}✓${NC} backup:db script registered in package.json"
else
    echo -e "${RED}✗${NC} backup:db script not found in package.json"
    exit 1
fi

# Test 7: Check if .gitignore excludes backups
if grep -q "backups/" .gitignore && grep -q "*.sql.gz" .gitignore; then
    echo -e "${GREEN}✓${NC} backups/ is properly excluded in .gitignore"
else
    echo -e "${RED}✗${NC} .gitignore does not exclude backup files"
    exit 1
fi

# Test 8: Check if README exists
if [ -f "backups/README.md" ]; then
    echo -e "${GREEN}✓${NC} backups/README.md exists"
else
    echo -e "${RED}✗${NC} backups/README.md not found"
    exit 1
fi

echo ""
echo -e "${GREEN}All tests passed!${NC}"
echo ""
echo "To run a real backup, ensure:"
echo "  1. Supabase CLI is installed: npm install -g supabase"
echo "  2. You are logged in: npx supabase login"
echo "  3. Project is linked: npx supabase link --project-ref inmtounwqcjwsxkfnsfd"
echo ""
echo "Then run: npm run backup:db (Windows) or npm run backup:db:bash (Linux/Mac)"
