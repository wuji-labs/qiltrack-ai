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

function Ensure-NodeModulesLink {
  param([string]$RepoRoot, [string]$TargetPath)
  $source = Join-Path $RepoRoot "node_modules"
  $destination = Join-Path $TargetPath "node_modules"
  if (-not (Test-Path $source)) {
    Write-Warning "Root node_modules not found, skip linking."
    return
  }
  if (Test-Path $destination) {
    return
  }
  cmd /c "mklink /J `"$destination`" `"$source`"" | Out-Null
}

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

  Ensure-NodeModulesLink -RepoRoot $RepoRoot -TargetPath $target
  Write-Host "Worktree created at $target (branch: $Branch)"
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
