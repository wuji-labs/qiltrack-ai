# Requires PowerShell 5+
# Set fixed port for a worktree via .env.local (not package.json!)
# Usage: .\scripts\set-worktree-port.ps1 -Name g1 -Port 3001

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Name,

  [Parameter(Mandatory = $true)]
  [int]$Port,

  [switch]$DryRun
)

function Resolve-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Get-WorktreePath {
  param([string]$RepoRoot, [string]$Name)
  $parent = Split-Path $RepoRoot -Parent
  if (-not $parent) {
    $parent = $RepoRoot
  }
  $sanitized = $Name.Trim()
  if ([string]::IsNullOrWhiteSpace($sanitized)) {
    throw "Worktree name cannot be empty."
  }
  return (Join-Path $parent ("investor-ai-{0}" -f $sanitized))
}

$repoRoot = Resolve-RepoRoot
$targetPath = Get-WorktreePath -RepoRoot $repoRoot -Name $Name
$envLocalPath = Join-Path $targetPath ".env.local"

if (-not (Test-Path $targetPath)) {
  throw "Worktree not found at $targetPath"
}

Write-Host "=== Setting port $Port for worktree $Name ===" -ForegroundColor Cyan
Write-Host "Path: $targetPath"
Write-Host ""

# Read or create .env.local
$envContent = ""
if (Test-Path $envLocalPath) {
  $envContent = Get-Content $envLocalPath -Raw -Encoding UTF8

  # Check current PORT
  if ($envContent -match '^PORT=(\d+)') {
    $currentPort = $Matches[1]
    Write-Host "Current PORT in .env.local: $currentPort" -ForegroundColor Yellow
  }

  # Remove existing PORT line(s)
  $lines = $envContent -split "`n" | Where-Object { $_ -notmatch '^PORT=' }
  $envContent = ($lines -join "`n").TrimEnd()
} else {
  Write-Host "No .env.local found, will create new one" -ForegroundColor Yellow
}

# Add PORT at the beginning
$newContent = "PORT=$Port`n$envContent".TrimEnd() + "`n"

Write-Host "New PORT: $Port" -ForegroundColor Green

if ($DryRun) {
  Write-Host "[dry-run] Would update .env.local" -ForegroundColor Cyan
} else {
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($envLocalPath, $newContent, $utf8NoBom)
  Write-Host "✓ Updated .env.local" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "The dev server will read PORT from .env.local automatically."
Write-Host "Start with: npm run dev --prefix `"$targetPath`""
Write-Host ""
