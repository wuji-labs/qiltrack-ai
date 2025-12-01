# Requires PowerShell 5+
# Set fixed port for a worktree's dev script
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
$packageJson = Join-Path $targetPath "package.json"

if (-not (Test-Path $targetPath)) {
  throw "Worktree not found at $targetPath"
}

if (-not (Test-Path $packageJson)) {
  throw "package.json not found at $packageJson"
}

Write-Host "=== Setting port $Port for worktree $Name ===" -ForegroundColor Cyan
Write-Host "Path: $targetPath"
Write-Host ""

# Read package.json
$content = Get-Content $packageJson -Raw -Encoding UTF8

# Check current dev script
if ($content -match '"dev":\s*"([^"]+)"') {
  $currentScript = $Matches[1]
  Write-Host "Current dev script: $currentScript" -ForegroundColor Yellow

  # Replace dev script
  $newScript = "next dev -p $Port"
  $newContent = $content -replace '"dev":\s*"[^"]+"', "`"dev`": `"$newScript`""

  Write-Host "New dev script: $newScript" -ForegroundColor Green

  if ($DryRun) {
    Write-Host "[dry-run] Would update package.json" -ForegroundColor Cyan
  } else {
    Set-Content -Path $packageJson -Value $newContent -Encoding UTF8 -NoNewline
    Write-Host "✓ Updated package.json" -ForegroundColor Green
  }
} else {
  Write-Warning "Could not find dev script in package.json"
  exit 1
}

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Restart dev server: npm run dev --prefix `"$targetPath`""
Write-Host "  2. Verify it's running on port $Port"
Write-Host ""
