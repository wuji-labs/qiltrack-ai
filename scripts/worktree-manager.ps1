# Requires PowerShell 5+
param(
  [ValidateSet("add", "remove", "list", "sync")]
  [string]$Command,
  [string]$Name,
  [string]$Branch,
  [string[]]$Folders = @("app", "docs", "hooks", "lib", "supabase", "types", "__tests__", "scripts")
)

function Resolve-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Get-WorktreePath {
  param([string]$RepoRoot, [string]$Name)
  if ([string]::IsNullOrWhiteSpace($Name)) {
    throw "Name is required for this command."
  }
  $parent = Split-Path $RepoRoot -Parent
  if (-not $parent) {
    $parent = $RepoRoot
  }
  return (Join-Path $parent ("investor-ai-{0}" -f $Name.Trim()))
}

function Invoke-Git {
  param([string]$RepoRoot, [string[]]$GitArgs)
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

# 注意：不再创建 node_modules 链接
# 每个 worktree 应独立运行 npm ci 安装依赖
# 这样可以避免 Turbopack 缓存冲突和多 worktree 并行运行问题

function Add-Worktree {
  param([string]$RepoRoot, [string]$Name, [string]$Branch, [string[]]$Folders)

  if ([string]::IsNullOrWhiteSpace($Branch)) {
    throw "Branch is required when adding a worktree."
  }
  $target = Get-WorktreePath -RepoRoot $RepoRoot -Name $Name
  if (Test-Path $target) {
    throw "Target path $target already exists."
  }
  Invoke-Git -RepoRoot $RepoRoot -GitArgs @("worktree", "add", "--no-checkout", $target, $Branch)

  Invoke-Git -RepoRoot $RepoRoot -GitArgs @("worktree", "lock", $target, "--reason", "managed via scripts/worktree-manager.ps1") | Out-Null

  Invoke-Git -RepoRoot $target -GitArgs @("sparse-checkout", "init", "--cone") | Out-Null
  Invoke-Git -RepoRoot $target -GitArgs @("sparse-checkout", "set") | Out-Null
  if ($Folders -and $Folders.Count -gt 0) {
    Invoke-Git -RepoRoot $target -GitArgs @("sparse-checkout", "set", $Folders)
  }

  Write-Host "Worktree created at $target (branch: $Branch)"
  Write-Host ""
  Write-Host "IMPORTANT: Run 'npm ci' in the worktree to install dependencies:"
  Write-Host "  cd `"$target`""
  Write-Host "  npm ci"
}

function Remove-Worktree {
  param([string]$RepoRoot, [string]$Name)
  $target = Get-WorktreePath -RepoRoot $RepoRoot -Name $Name
  if (-not (Test-Path $target)) {
    Write-Warning "Worktree $target not found."
    return
  }
  Invoke-Git -RepoRoot $RepoRoot -GitArgs @("worktree", "unlock", $target) | Out-Null
  Invoke-Git -RepoRoot $RepoRoot -GitArgs @("worktree", "remove", $target)
  Write-Host "Removed worktree $target"
}

function Sync-Worktree {
  param([string]$RepoRoot, [string]$Name)
  $target = Get-WorktreePath -RepoRoot $RepoRoot -Name $Name
  if (-not (Test-Path $target)) {
    throw "Worktree $target not found."
  }
  Invoke-Git -RepoRoot $target -GitArgs @("fetch", "--all")
  Invoke-Git -RepoRoot $target -GitArgs @("rebase")
  Write-Host "Synced worktree $target with its upstream branch."
}

$repoRoot = Resolve-RepoRoot

switch ($Command) {
  "add" {
    Add-Worktree -RepoRoot $repoRoot -Name $Name -Branch $Branch -Folders $Folders
  }
  "remove" {
    Remove-Worktree -RepoRoot $repoRoot -Name $Name
  }
  "list" {
    $output = Invoke-Git -RepoRoot $repoRoot -GitArgs @("worktree", "list")
    Write-Output $output
  }
  "sync" {
    Sync-Worktree -RepoRoot $repoRoot -Name $Name
  }
}
