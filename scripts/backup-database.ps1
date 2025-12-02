# =============================================================================
# Supabase Database Backup Script (PowerShell)
# =============================================================================
# Description: This script creates a backup of the Supabase database
# Usage: npm run backup:db (Windows)
# Author: G4 Infrastructure Team
# Last Updated: 2025-12-02
# =============================================================================

param(
    [string]$ProjectRef = "inmtounwqcjwsxkfnsfd",
    [string]$BackupDir = ".\backups\db",
    [int]$MaxBackupAgeDays = 30
)

$ErrorActionPreference = "Stop"

# Configuration
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "backup_$Timestamp.sql"

# Function to print colored messages
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if Supabase CLI is available
function Test-SupabaseCLI {
    try {
        $version = npx supabase --version 2>&1
        Write-Info "Supabase CLI found: $version"
        return $true
    } catch {
        Write-Error "Supabase CLI is not installed!"
        Write-Info "Install it with: npm install -g supabase"
        return $false
    }
}

# Function to check if logged in to Supabase
function Test-SupabaseLogin {
    Write-Info "Checking Supabase authentication..."

    if (Test-Path ".\.supabase\config.toml") {
        Write-Info "Project already linked"
        return $true
    }

    Write-Warning "Not linked to Supabase project"
    Write-Info "Please run: npx supabase login; npx supabase link --project-ref $ProjectRef"
    return $false
}

# Create backup directory
function New-BackupDirectory {
    Write-Info "Creating backup directory: $BackupDir"
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
}

# Perform database dump
function Invoke-DatabaseBackup {
    Write-Info "Starting database backup..."
    Write-Info "Project Reference: $ProjectRef"
    Write-Info "Backup File: $BackupFile"

    try {
        # Use Supabase CLI to dump the database
        npx supabase db dump --project-ref $ProjectRef --schema public --file $BackupFile --local

        Write-Info "Database dump completed successfully"
        return $true
    } catch {
        Write-Error "Database dump failed: $_"
        return $false
    }
}

# Compress backup file
function Compress-BackupFile {
    Write-Info "Compressing backup file..."

    try {
        # Use built-in compression
        $compressedFile = "$BackupFile.gz"
        $sourceFile = Get-Item $BackupFile
        $destFile = [System.IO.FileStream]::new($compressedFile, [System.IO.FileMode]::Create)
        $gzipStream = [System.IO.Compression.GZipStream]::new($destFile, [System.IO.Compression.CompressionMode]::Compress)
        $sourceStream = $sourceFile.OpenRead()

        $sourceStream.CopyTo($gzipStream)

        $sourceStream.Close()
        $gzipStream.Close()
        $destFile.Close()

        # Remove original file
        Remove-Item $BackupFile -Force

        $size = (Get-Item $compressedFile).Length
        $sizeKB = [math]::Round($size / 1KB, 2)
        Write-Info "Backup compressed: $compressedFile ($sizeKB KB)"
        return $true
    } catch {
        Write-Error "Compression failed: $_"
        return $false
    }
}

# Clean old backups
function Remove-OldBackups {
    Write-Info "Cleaning backups older than $MaxBackupAgeDays days..."

    try {
        $cutoffDate = (Get-Date).AddDays(-$MaxBackupAgeDays)
        $oldBackups = Get-ChildItem -Path $BackupDir -Filter "*.sql.gz" | Where-Object { $_.LastWriteTime -lt $cutoffDate }

        $count = $oldBackups.Count
        if ($count -gt 0) {
            $oldBackups | Remove-Item -Force
            Write-Info "Removed $count old backup(s)"
        } else {
            Write-Info "No old backups to remove"
        }
    } catch {
        Write-Warning "Failed to clean old backups: $_"
    }
}

# Display backup statistics
function Show-BackupStats {
    Write-Info "Backup Statistics:"
    $allBackups = Get-ChildItem -Path $BackupDir -Filter "*.sql.gz" -ErrorAction SilentlyContinue

    $totalSize = ($allBackups | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)

    Write-Host "  ├─ Backup Directory: $BackupDir"
    Write-Host "  ├─ Latest Backup: backup_$Timestamp.sql.gz"
    Write-Host "  ├─ Total Backups: $($allBackups.Count)"
    Write-Host "  └─ Total Size: $totalSizeMB MB"
}

# Main execution
function Main {
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "  Investor AI - Database Backup" -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host ""

    if (-not (Test-SupabaseCLI)) {
        exit 1
    }

    if (-not (Test-SupabaseLogin)) {
        exit 1
    }

    New-BackupDirectory

    if (-not (Invoke-DatabaseBackup)) {
        exit 1
    }

    if (-not (Compress-BackupFile)) {
        exit 1
    }

    Remove-OldBackups
    Show-BackupStats

    Write-Host ""
    Write-Info "✅ Backup completed successfully!"
    Write-Host ""
}

# Run main function
Main
