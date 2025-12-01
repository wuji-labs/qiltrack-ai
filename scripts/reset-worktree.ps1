# Requires PowerShell 5+
# Reset worktree to origin/main for a fresh task start
# Usage: .\scripts\reset-worktree.ps1 -Name g1
#        .\scripts\reset-worktree.ps1 -Name g1 -SkipNpmCi
#        .\scripts\reset-worktree.ps1 -Name g1 -DryRun

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

Write-Host "=== Resetting worktree: $targetPath ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: git fetch origin
Write-Host "[1/4] Fetching latest from origin..." -ForegroundColor Yellow
if ($DryRun) {
  Write-Host "[dry-run] git fetch origin"
} else {
  Invoke-GitLocal -RepoRoot $targetPath -GitArgs @("fetch", "origin")
  Write-Host "Done." -ForegroundColor Green
}

# Step 2: git reset --hard origin/main
Write-Host "[2/5] Resetting to origin/main..." -ForegroundColor Yellow
if ($DryRun) {
  Write-Host "[dry-run] git reset --hard origin/main"
} else {
  Invoke-GitLocal -RepoRoot $targetPath -GitArgs @("reset", "--hard", "origin/main")
  Write-Host "Done." -ForegroundColor Green
}

# Step 3: Re-apply sparse-checkout to ensure all files are checked out
Write-Host "[3/5] Re-applying sparse-checkout..." -ForegroundColor Yellow
if ($DryRun) {
  Write-Host "[dry-run] git sparse-checkout set app docs hooks lib supabase types __tests__ scripts"
} else {
  # Re-set sparse-checkout folders to ensure they are checked out
  $folders = @("app", "docs", "hooks", "lib", "supabase", "types", "__tests__", "scripts", "public")
  Invoke-GitLocal -RepoRoot $targetPath -GitArgs (@("sparse-checkout", "set") + $folders)
  Write-Host "Done." -ForegroundColor Green
}

# Step 4: git clean -fd (keep node_modules and .next)
Write-Host "[4/6] Cleaning untracked files (keeping node_modules, .next)..." -ForegroundColor Yellow
if ($DryRun) {
  Write-Host "[dry-run] git clean -fd -e node_modules -e .next"
} else {
  Invoke-GitLocal -RepoRoot $targetPath -GitArgs @("clean", "-fd", "-e", "node_modules", "-e", ".next")
  Write-Host "Done." -ForegroundColor Green
}

# Step 5: Copy .env.local from root
Write-Host "[5/6] Syncing .env.local from root..." -ForegroundColor Yellow
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
  Write-Host "[6/6] Checking if npm ci is needed..." -ForegroundColor Yellow

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
  Write-Host "[6/6] Skipping npm ci (--SkipNpmCi flag)" -ForegroundColor Yellow
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
