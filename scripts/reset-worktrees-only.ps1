# Simple script: only reset worktrees, skip main repo
# Use this when you've already manually updated main repo with git branch -f
#
# Usage: .\scripts\reset-worktrees-only.ps1

[CmdletBinding()]
param(
  [string[]]$Worktrees = @("g1", "g2", "g3", "g4", "g5"),
  [switch]$SkipNpmCi
)

function Remove-BOMFromFile {
  param([string]$FilePath)
  if (-not (Test-Path $FilePath)) { return }
  $bytes = [System.IO.File]::ReadAllBytes($FilePath)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "  Removing BOM from $(Split-Path $FilePath -Leaf)..." -ForegroundColor Yellow
    $content = [System.IO.File]::ReadAllText($FilePath)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
    Write-Host "  BOM removed!" -ForegroundColor Green
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Resetting Worktrees Only (Main repo skipped)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# CRITICAL: Clean main repo BOM FIRST
Write-Host "Pre-check: Cleaning BOM in main repo..." -ForegroundColor Yellow
Remove-BOMFromFile -FilePath (Join-Path $repoRoot "package.json")

$resetScript = Join-Path $PSScriptRoot "reset-worktree.ps1"

foreach ($worktree in $Worktrees) {
  $worktreePath = Join-Path (Split-Path $repoRoot -Parent) "investor-ai-$worktree"

  if (-not (Test-Path $worktreePath)) {
    Write-Host "Skipping $worktree (not found)" -ForegroundColor Gray
    continue
  }

  Write-Host ""
  Write-Host "Resetting worktree: $worktree" -ForegroundColor Cyan

  $params = @{ Name = $worktree }
  if ($SkipNpmCi) { $params['SkipNpmCi'] = $true }

  & $resetScript @params

  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Failed to reset worktree $worktree"
  } else {
    Write-Host "Worktree $worktree ready" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  All Worktrees Ready!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
