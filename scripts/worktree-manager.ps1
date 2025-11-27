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
  param([string]$RepoRoot, [string[]]$Args)
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "git"
  $psi.WorkingDirectory = $RepoRoot
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.ArgumentList = $Args
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  $p.Start() | Out-Null
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  if ($p.ExitCode -ne 0) {
    throw "git $($Args -join ' ') failed: $stderr"
  }
  return $stdout
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
  Invoke-Git -RepoRoot $RepoRoot -Args @("worktree", "add", "--no-checkout", $target, $Branch)

  Invoke-Git -RepoRoot $RepoRoot -Args @("worktree", "lock", $target, "--reason", "managed via scripts/worktree-manager.ps1") | Out-Null

  Invoke-Git -RepoRoot $target -Args @("sparse-checkout", "init", "--cone") | Out-Null
  Invoke-Git -RepoRoot $target -Args @("sparse-checkout", "set") | Out-Null
  if ($Folders -and $Folders.Count -gt 0) {
    Invoke-Git -RepoRoot $target -Args @("sparse-checkout", "set", $Folders)
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
  Invoke-Git -RepoRoot $RepoRoot -Args @("worktree", "unlock", $target) | Out-Null
  Invoke-Git -RepoRoot $RepoRoot -Args @("worktree", "remove", $target)
  Write-Host "Removed worktree $target"
}

function Sync-Worktree {
  param([string]$RepoRoot, [string]$Name)
  $target = Get-WorktreePath -RepoRoot $RepoRoot -Name $Name
  if (-not (Test-Path $target)) {
    throw "Worktree $target not found."
  }
  Invoke-Git -RepoRoot $target -Args @("fetch", "--all")
  Invoke-Git -RepoRoot $target -Args @("rebase")
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
    $output = Invoke-Git -RepoRoot $repoRoot -Args @("worktree", "list")
    Write-Output $output
  }
  "sync" {
    Sync-Worktree -RepoRoot $repoRoot -Name $Name
  }
}
