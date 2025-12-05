#!/bin/bash

# =============================================================================
# Supabase Database Backup Script
# =============================================================================
# Description: This script creates a backup of the Supabase database
# Usage: npm run backup:db
# Author: G4 Infrastructure Team
# Last Updated: 2025-12-02
# =============================================================================

set -e  # Exit on error

# Configuration
PROJECT_REF="inmtounwqcjwsxkfnsfd"
BACKUP_DIR="./backups/db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
MAX_BACKUP_AGE_DAYS=30

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed!"
        print_info "Install it with: npm install -g supabase"
        exit 1
    fi
    print_info "Supabase CLI found: $(supabase --version)"
}

# Function to check if logged in to Supabase
check_supabase_login() {
    print_info "Checking Supabase authentication..."

    # Check if already linked
    if [ -f ".supabase/config.toml" ]; then
        print_info "Project already linked"
        return 0
    fi

    print_warning "Not linked to Supabase project"
    print_info "Please run: npx supabase login && npx supabase link --project-ref ${PROJECT_REF}"
    exit 1
}

# Create backup directory
create_backup_dir() {
    print_info "Creating backup directory: ${BACKUP_DIR}"
    mkdir -p "$BACKUP_DIR"
}

# Perform database dump
perform_backup() {
    print_info "Starting database backup..."
    print_info "Project Reference: ${PROJECT_REF}"
    print_info "Backup File: ${BACKUP_FILE}"

    # Use Supabase CLI to dump the database
    npx supabase db dump \
        --project-ref "$PROJECT_REF" \
        --schema public \
        --file "$BACKUP_FILE" \
        --local

    if [ $? -eq 0 ]; then
        print_info "Database dump completed successfully"
    else
        print_error "Database dump failed!"
        exit 1
    fi
}

# Compress backup file
compress_backup() {
    print_info "Compressing backup file..."

    gzip "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        local compressed_size=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
        print_info "Backup compressed: ${BACKUP_FILE}.gz (${compressed_size})"
    else
        print_error "Compression failed!"
        exit 1
    fi
}

# Clean old backups
clean_old_backups() {
    print_info "Cleaning backups older than ${MAX_BACKUP_AGE_DAYS} days..."

    local old_backups=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${MAX_BACKUP_AGE_DAYS})
    local count=$(echo "$old_backups" | grep -c .)

    if [ -n "$old_backups" ] && [ "$count" -gt 0 ]; then
        echo "$old_backups" | xargs rm -f
        print_info "Removed ${count} old backup(s)"
    else
        print_info "No old backups to remove"
    fi
}

# Display backup statistics
show_stats() {
    print_info "Backup Statistics:"
    echo "  ├─ Backup Directory: ${BACKUP_DIR}"
    echo "  ├─ Latest Backup: backup_${TIMESTAMP}.sql.gz"
    echo "  ├─ Total Backups: $(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l)"
    echo "  └─ Total Size: $(du -sh "$BACKUP_DIR" | cut -f1)"
}

# Optional: Upload to cloud storage
# Uncomment and configure if you want to use cloud storage
upload_to_cloud() {
    print_warning "Cloud upload is disabled (optional feature)"

    # Example for AWS S3:
    # if command -v aws &> /dev/null; then
    #     print_info "Uploading to S3..."
    #     aws s3 cp "${BACKUP_FILE}.gz" s3://my-bucket/backups/qiltrack-ai/
    # fi

    # Example for Azure Blob Storage:
    # if command -v az &> /dev/null; then
    #     print_info "Uploading to Azure Blob..."
    #     az storage blob upload --file "${BACKUP_FILE}.gz" --container-name backups --name "qiltrack-ai/backup_${TIMESTAMP}.sql.gz"
    # fi
}

# Main execution
main() {
    echo ""
    echo "================================================================="
    echo "  Investor AI - Database Backup"
    echo "================================================================="
    echo ""

    check_supabase_cli
    check_supabase_login
    create_backup_dir
    perform_backup
    compress_backup
    clean_old_backups
    show_stats
    # upload_to_cloud  # Uncomment to enable cloud upload

    echo ""
    print_info "✅ Backup completed successfully!"
    echo ""
}

# Run main function
main
