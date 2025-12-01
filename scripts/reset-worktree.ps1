# Requires PowerShell 5+
# Reset worktree to origin/main for a fresh task start
# Usage: .\scripts\reset-worktree.ps1 -Name g1
#        .\scripts\reset-worktree.ps1 -Name g1 -SkipNpmCi
#        .\scripts\reset-worktree.ps1 -Name g1 -DryRun
#
# ⚠️ IMPORTANT: This script includes BOM removal after git operations
# DO NOT remove Remove-BOMFromFile function or its calls!
# See docs/troubleshooting/bom-issue.md for details.
# This fix was added after multiple iterations to solve recurring BOM issues.

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Name,

  [switch]$SkipNpmCi,
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

function Get-WorktreePort {
  param([string]$Name)

  $map = @{
    "g1" = 3001
    "g2" = 3002
    "g3" = 3003
    "g4" = 3004
    "g5" = 3005
  }

  $key = $Name.Trim().ToLower()
  if ($map.ContainsKey($key)) {
    return $map[$key]
  }

  return $null
}

function Remove-BOMFromFile {
  param([string]$FilePath)

  # ⚠️ DO NOT REMOVE THIS FUNCTION!
  # Git operations on Windows (reset --hard, sparse-checkout) can inject UTF-8 BOM
  # into package.json, causing "Error parsing package.json file" errors.
  # This function is called after git reset and sparse-checkout to prevent the issue.
  # See docs/troubleshooting/bom-issue.md for full explanation.

  if (-not (Test-Path $FilePath)) {
    return
  }

  $bytes = [System.IO.File]::ReadAllBytes($FilePath)
  $needsFix = $false
  $reason = ""

  # Check 1: UTF-8 BOM (EF BB BF)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $needsFix = $true
    $reason = "UTF-8 BOM detected"
  }
  # Check 2: File doesn't start with '{' (0x7B) for JSON
  elseif ($bytes[0] -ne 0x7B) {
    $needsFix = $true
    $reason = "File doesn't start with '{' (starts with 0x$($bytes[0].ToString('X2')))"
  }

  if ($needsFix) {
    Write-Host "  Removing BOM from $(Split-Path $FilePath -Leaf)... ($reason)" -ForegroundColor Yellow
    $content = [System.IO.File]::ReadAllText($FilePath)

    # Remove any non-printable characters at start
    $content = $content -replace '^\s*[\x00-\x1F\x7F-\xFF]*', ''

    # Ensure content starts with '{'
    if (-not $content.StartsWith('{')) {
      $braceIndex = $content.IndexOf('{')
      if ($braceIndex -gt 0) {
        $content = $content.Substring($braceIndex)
      }
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
    Write-Host "  BOM/corruption removed successfully" -ForegroundColor Green
  }
}

function Invoke-GitLocal {
  param([string]$RepoRoot, [string[]]$GitArgs)

  if (-not $GitArgs -or $GitArgs.Count -eq 0) {
    throw "Git arguments cannot be empty"
  }

  Push-Location $RepoRoot
  try {
    $output = & git @GitArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
      $msg = if ($output) { $output -join "`n" } else { "git exited with code $LASTEXITCODE" }
      throw "git $($GitArgs -join ' ') failed: $msg"
    }
    return ($output -join [Environment]::NewLine)
  }
  finally {
    Pop-Location
  }
}

$repoRoot = Resolve-RepoRoot
$targetPath = Get-WorktreePath -RepoRoot $repoRoot -Name $Name

if (-not (Test-Path $targetPath)) {
  throw "Worktree not found at $targetPath. Use prep-group.ps1 to create it first."
}

# CRITICAL: Fix BOM in main repo FIRST before copying to worktree
Write-Host "=== Pre-check: Cleaning BOM in main repo ===" -ForegroundColor Cyan
Remove-BOMFromFile -FilePath (Join-Path $repoRoot "package.json")

Write-Host "=== Resetting worktree: $targetPath ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: git fetch origin
Write-Host "[1/7] Fetching latest from origin..." -ForegroundColor Yellow
if ($DryRun) {
  Write-Host "[dry-run] git fetch origin"
} else {
  Invoke-GitLocal -RepoRoot $targetPath -GitArgs @("fetch", "origin")
  Write-Host "Done." -ForegroundColor Green
}

# Step 2: git reset --hard origin/main
Write-Host "[2/7] Resetting to origin/main..." -ForegroundColor Yellow
if ($DryRun) {
  Write-Host "[dry-run] git reset --hard origin/main"
} else {
  Invoke-GitLocal -RepoRoot $targetPath -GitArgs @("reset", "--hard", "origin/main")

  # Fix BOM issue that can occur after git reset --hard
  Remove-BOMFromFile -FilePath (Join-Path $targetPath "package.json")

  Write-Host "Done." -ForegroundColor Green
}

# Step 3: Re-apply sparse-checkout to ensure all files are checked out
Write-Host "[3/7] Re-applying sparse-checkout..." -ForegroundColor Yellow
# Include public so assets (e.g., provider logos) are available after reset
if ($DryRun) {
  Write-Host "[dry-run] git sparse-checkout set app docs hooks lib supabase types __tests__ scripts public"
} else {
  # Re-set sparse-checkout folders to ensure they are checked out
  $folders = @("app", "docs", "hooks", "lib", "supabase", "types", "__tests__", "scripts", "public")
  Invoke-GitLocal -RepoRoot $targetPath -GitArgs (@("sparse-checkout", "set") + $folders)

  # Fix BOM issue that can occur after sparse-checkout - uses enhanced Remove-BOMFromFile
  Remove-BOMFromFile -FilePath (Join-Path $targetPath "package.json")

  Write-Host "Done." -ForegroundColor Green
}

# Step 4: git clean -fd (keep node_modules and .next)
Write-Host "[4/7] Cleaning untracked files (keeping node_modules, .next)..." -ForegroundColor Yellow
if ($DryRun) {
  Write-Host "[dry-run] git clean -fd -e node_modules -e .next"
} else {
  Invoke-GitLocal -RepoRoot $targetPath -GitArgs @("clean", "-fd", "-e", "node_modules", "-e", ".next")

  # Clean .next and node_modules/.cache to prevent BOM-related build issues
  $nextCache = Join-Path $targetPath ".next"
  $npmCache = Join-Path $targetPath "node_modules/.cache"

  if (Test-Path $nextCache) {
    Write-Host "  Removing .next cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $nextCache -ErrorAction SilentlyContinue
  }

  if (Test-Path $npmCache) {
    Write-Host "  Removing node_modules/.cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $npmCache -ErrorAction SilentlyContinue
  }

  Write-Host "Done." -ForegroundColor Green
}

# Step 5: Copy .env.local from root
Write-Host "[5/7] Syncing .env.local from root..." -ForegroundColor Yellow
$sourceEnv = Join-Path $repoRoot ".env.local"
$targetEnv = Join-Path $targetPath ".env.local"
if ($DryRun) {
  Write-Host "[dry-run] would copy $sourceEnv to $targetEnv"
} else {
  if (Test-Path $sourceEnv) {
    Copy-Item -Path $sourceEnv -Destination $targetEnv -Force
    Write-Host "Done." -ForegroundColor Green
  } else {
    Write-Warning "Root .env.local not found at $sourceEnv, skipping."
  }
}

# Step 6: npm ci (optional)
if (-not $SkipNpmCi) {
  Write-Host "[6/7] Checking if npm ci is needed..." -ForegroundColor Yellow

  if ($DryRun) {
    Write-Host "[dry-run] would check package-lock.json changes and run npm ci if needed"
  } else {
    # Check if package-lock.json changed
    $lockFile = Join-Path $targetPath "package-lock.json"
    $nodeModules = Join-Path $targetPath "node_modules"

    $needsInstall = $false

    if (-not (Test-Path $nodeModules)) {
      Write-Host "node_modules not found, running npm ci..." -ForegroundColor Yellow
      $needsInstall = $true
    } else {
      # Simple check: compare package-lock.json mtime with node_modules mtime
      $lockTime = (Get-Item $lockFile -ErrorAction SilentlyContinue).LastWriteTime
      $nmTime = (Get-Item $nodeModules -ErrorAction SilentlyContinue).LastWriteTime

      if ($lockTime -gt $nmTime) {
        Write-Host "package-lock.json is newer than node_modules, running npm ci..." -ForegroundColor Yellow
        $needsInstall = $true
      }
    }

    if ($needsInstall) {
      Push-Location $targetPath
      try {
        & npm ci
        if ($LASTEXITCODE -ne 0) {
          Write-Warning "npm ci failed"
        } else {
          Write-Host "Dependencies updated." -ForegroundColor Green
        }
      }
      finally {
        Pop-Location
      }
    } else {
      Write-Host "Dependencies up to date, skipping npm ci." -ForegroundColor Green
    }
  }
} else {
  Write-Host "[6/7] Skipping npm ci (--SkipNpmCi flag)" -ForegroundColor Yellow
}

Write-Host "[7/7] Setting dev port for worktree..." -ForegroundColor Yellow
$port = Get-WorktreePort -Name $Name
$setPortScript = Join-Path (Join-Path $repoRoot "scripts") "set-worktree-port.ps1"
if ($DryRun) {
  if ($port) {
    Write-Host "[dry-run] would run $setPortScript -Name $Name -Port $port"
  } else {
    Write-Host "[dry-run] no mapped port for $Name, skipping."
  }
} else {
  if ($port) {
    try {
      & $setPortScript -Name $Name -Port $port
      Write-Host "Done. Set dev port to $port." -ForegroundColor Green
    } catch {
      Write-Warning ("Failed to set dev port for {0}: {1}" -f $Name, $_)
    }
  } else {
    Write-Warning "No port mapping found for $Name, skipping dev port update."
  }

  # FINAL CHECK: Fix BOM one last time after ALL file operations
  Write-Host ""
  Write-Host "Final BOM check..." -ForegroundColor Yellow
  Remove-BOMFromFile -FilePath (Join-Path $targetPath "package.json")
}

Write-Host ""
Write-Host "=== Reset complete! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Worktree is now at origin/main and ready for a new task."
Write-Host "Current status:"

if (-not $DryRun) {
  Push-Location $targetPath
  git status --short
  Pop-Location
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Create a new branch: git -C `"$targetPath`" checkout -b feature/your-task"
Write-Host "  2. Start coding!"
