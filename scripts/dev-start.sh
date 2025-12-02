#!/bin/bash

# =============================================================================
# Development Environment Quick Start Script
# =============================================================================
# Description: One-command setup for development environment
# Usage: bash scripts/dev-start.sh
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

print_step() {
    echo -e "${CYAN}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo ""
echo "================================================================="
echo "  Investor AI - Development Environment Quick Start"
echo "================================================================="
echo ""

# Step 1: Check environment variables
print_step "Checking environment variables..."
if npm run env:check --silent 2>/dev/null; then
    print_success "Environment variables OK"
else
    print_error "Environment check failed!"
    print_warning "Please copy .env.example to .env.local and fill in the values"
    exit 1
fi

# Step 2: Check if node_modules exists
print_step "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found, installing dependencies..."
    npm ci
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Step 3: Check if port is available
print_step "Checking port availability..."
PORT=$(grep "dev.*-p" package.json | grep -oP '\d{4}')
if [ -z "$PORT" ]; then
    PORT=3000
fi

if lsof -i:$PORT > /dev/null 2>&1; then
    print_warning "Port $PORT is already in use"
    print_warning "Killing process on port $PORT..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 1
    print_success "Port $PORT is now available"
else
    print_success "Port $PORT is available"
fi

# Step 4: Check git status
print_step "Checking git status..."
if git diff --quiet && git diff --staged --quiet; then
    print_success "No uncommitted changes"
else
    print_warning "You have uncommitted changes:"
    git status --short
fi

# Step 5: Pull latest changes (optional)
echo ""
read -p "Do you want to pull latest changes from remote? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Pulling latest changes..."
    git pull origin $(git branch --show-current)
    print_success "Code updated"
fi

# Step 6: Start development server
echo ""
print_step "Starting development server..."
echo ""
echo "================================================================="
echo "  Development server will start on http://localhost:$PORT"
echo "  Press Ctrl+C to stop"
echo "================================================================="
echo ""

npm run dev
