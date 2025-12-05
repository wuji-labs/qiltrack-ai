# Complete workflow to reset main repo and all worktrees
# This script automates your entire workflow with BOM protection
#
# Usage: .\scripts\reset-all.ps1
#        .\scripts\reset-all.ps1 -Worktrees g1,g2,g3
#        .\scripts\reset-all.ps1 -SkipNpmCi

[CmdletBinding()]
param(
  [string[]]$Worktrees = @("g1", "g2", "g3", "g4", "g5"),
  [switch]$SkipNpmCi,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Cyan
  Write-Host "  $Message" -ForegroundColor Cyan
  Write-Host "============================================================" -ForegroundColor Cyan
  Write-Host ""
}

function Remove-BOMFromFile {
  param([string]$FilePath)

  if (-not (Test-Path $FilePath)) {
    return
  }

  $bytes = [System.IO.File]::ReadAllBytes($FilePath)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "  Removing BOM from $(Split-Path $FilePath -Leaf)..." -ForegroundColor Yellow
    $content = [System.IO.File]::ReadAllText($FilePath)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
    Write-Host "  BOM removed" -ForegroundColor Green
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  Complete Repo Reset - Main + All Worktrees" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

# ============================================================================
# STEP 1: Reset main repository
# ============================================================================
Write-Step "STEP 1: Resetting main repository"

Push-Location $repoRoot
try {
  Write-Host "Location: $repoRoot" -ForegroundColor Gray
  Write-Host ""

  if ($DryRun) {
    Write-Host "[dry-run] Would execute:" -ForegroundColor Yellow
    Write-Host "  git fetch origin" -ForegroundColor Gray
    Write-Host "  git reset --hard origin/main" -ForegroundColor Gray
    Write-Host "  git clean -fd" -ForegroundColor Gray
  } else {
    Write-Host "Fetching latest changes..." -ForegroundColor Yellow
    & git fetch origin
    if ($LASTEXITCODE -ne 0) { throw "git fetch failed" }

    Write-Host "Resetting to origin/main..." -ForegroundColor Yellow
    & git reset --hard origin/main
    if ($LASTEXITCODE -ne 0) { throw "git reset failed" }

    Write-Host "Cleaning untracked files..." -ForegroundColor Yellow
    & git clean -fd
    if ($LASTEXITCODE -ne 0) { throw "git clean failed" }

    Write-Host "Main repo reset complete" -ForegroundColor Green

    # CRITICAL: Fix BOM in main repo immediately after git operations
    Write-Host ""
    Write-Host "Checking for BOM in main repo..." -ForegroundColor Yellow
    Remove-BOMFromFile -FilePath (Join-Path $repoRoot "package.json")
  }
} finally {
  Pop-Location
}

# ============================================================================
# STEP 2: Reset all worktrees
# ============================================================================
Write-Step "STEP 2: Resetting worktrees"

$resetScript = Join-Path $PSScriptRoot "reset-worktree.ps1"

foreach ($worktree in $Worktrees) {
  $worktreePath = Join-Path (Split-Path $repoRoot -Parent) "qiltrack-ai-$worktree"

  if (-not (Test-Path $worktreePath)) {
    Write-Host "Skipping $worktree (not found at $worktreePath)" -ForegroundColor Gray
    continue
  }

  Write-Host ""
  Write-Host "Resetting worktree: $worktree" -ForegroundColor Cyan

  if ($DryRun) {
    Write-Host "[dry-run] Would execute: $resetScript -Name $worktree" -ForegroundColor Yellow
  } else {
    $params = @{
      Name = $worktree
    }
    if ($SkipNpmCi) {
      $params['SkipNpmCi'] = $true
    }

    & $resetScript @params

    if ($LASTEXITCODE -ne 0) {
      Write-Warning "Failed to reset worktree $worktree"
    } else {
      Write-Host "Worktree $worktree ready" -ForegroundColor Green
    }
  }
}

# ============================================================================
# Summary
# ============================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  All Reset Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd D:\Projects\qiltrack-ai-g1" -ForegroundColor Gray
Write-Host "  2. npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Available worktrees:" -ForegroundColor Cyan
foreach ($worktree in $Worktrees) {
  $worktreePath = Join-Path (Split-Path $repoRoot -Parent) "qiltrack-ai-$worktree"
  if (Test-Path $worktreePath) {
    $port = 3000 + [int]$worktree.Substring(1)
    Write-Host "  $worktree -> http://localhost:$port" -ForegroundColor Green
  }
}
Write-Host ""
