# Requires PowerShell 5+
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Name,

  [Parameter(Mandatory = $true)]
  [string]$Branch,

  [string]$GroupEnvFile = ".env.group-default",
  [string]$SharedEnvFile = ".env.shared",
  [string]$ExampleEnvFile = ".env.local.example",

  [string[]]$Folders = @("app", "docs", "hooks", "lib", "supabase", "types", "__tests__", "scripts"),

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

function Resolve-GroupLabel {
  param([string]$Name, [string]$Branch)
  if ($Name -match "(g\d+)") {
    return $Matches[1].ToUpper()
  }
  if ($Branch -match "(g\d+)") {
    return $Matches[1].ToUpper()
  }
  return $Name.Trim().ToUpper()
}

function Ensure-BranchExists {
  param(
    [string]$RepoRoot,
    [string]$Branch,
    [switch]$DryRun
  )

  if ($DryRun) {
    Write-Host "[dry-run] would ensure branch $Branch exists (create locally if missing)"
    return
  }

  # Check if branch exists
  try {
    $gitArgs = @("rev-parse", "--verify", $Branch)
    Invoke-GitLocal -RepoRoot $RepoRoot -GitArgs $gitArgs | Out-Null
    Write-Host "Branch $Branch already exists locally."
    return
  }
  catch {
    # Branch doesn't exist, create it
  }

  # Get current branch
  $gitArgs = @("rev-parse", "--abbrev-ref", "HEAD")
  $currentBranch = (Invoke-GitLocal -RepoRoot $RepoRoot -GitArgs $gitArgs).Trim()

  Write-Host "Creating branch $Branch from main (local only)..."
  Invoke-GitLocal -RepoRoot $RepoRoot -GitArgs @("checkout", "main") | Out-Null
  Invoke-GitLocal -RepoRoot $RepoRoot -GitArgs @("pull", "--ff-only") | Out-Null
  Invoke-GitLocal -RepoRoot $RepoRoot -GitArgs @("checkout", "-b", $Branch) | Out-Null
  Invoke-GitLocal -RepoRoot $RepoRoot -GitArgs @("checkout", $currentBranch) | Out-Null
  Write-Host "Branch $Branch created locally."
}

function Invoke-WorktreeManager {
  param(
    [string]$RepoRoot,
    [string]$Name,
    [string]$Branch,
    [string[]]$Folders,
    [switch]$DryRun
  )

  $managerPath = Join-Path $RepoRoot "scripts/worktree-manager.ps1"
  if (-not (Test-Path $managerPath)) {
    throw "Cannot find scripts/worktree-manager.ps1 at $managerPath"
  }

  if ($DryRun) {
    Write-Host "[dry-run] worktree-manager add -Name $Name -Branch $Branch -Folders $($Folders -join ',')"
    return
  }

  # Save parameters before dot-sourcing to avoid them being overwritten
  $savedName = $Name
  $savedBranch = $Branch
  $savedFolders = $Folders

  # Dot-source the worktree-manager script to call its functions directly
  . $managerPath

  # Call the Add-Worktree function directly instead of spawning a new process
  try {
    Add-Worktree -RepoRoot $RepoRoot -Name $savedName -Branch $savedBranch -Folders $savedFolders
  }
  catch {
    throw "worktree-manager failed: $_"
  }
}

function Merge-EnvFiles {
  param(
    [string[]]$Files,
    [string]$Destination,
    [switch]$DryRun
  )

  $ordered = [System.Collections.Specialized.OrderedDictionary]::new()
  foreach ($file in $Files) {
    if (-not (Test-Path $file)) {
      continue
    }
    $lines = Get-Content $file
    foreach ($line in $lines) {
      $trimmed = $line.Trim()
      if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
        continue
      }
      $split = $trimmed.IndexOf("=")
      if ($split -lt 1) {
        continue
      }
      $key = $trimmed.Substring(0, $split).Trim()
      $value = $trimmed.Substring($split + 1)
      if ($ordered.Contains($key)) {
        $ordered.Remove($key)
      }
      $ordered.Add($key, $value)
    }
  }

  if ($DryRun) {
    Write-Host "[dry-run] would write merged env to $Destination with $($ordered.Count) entries"
  }
  else {
    $destinationDir = Split-Path -Path $Destination -Parent
    if (-not (Test-Path $destinationDir)) {
      New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    }
    $content = @()
    foreach ($key in $ordered.Keys) {
      $content += "$key=$($ordered[$key])"
    }
    Set-Content -Path $Destination -Value $content -Encoding UTF8
    Write-Host "Merged env to $Destination"
  }
}

function Write-GroupProfile {
  param(
    [string]$TargetPath,
    [string]$GroupLabel,
    [string]$Branch,
    [string]$Name,
    [switch]$DryRun
  )

  $profile = Join-Path $TargetPath "GROUP.md"
  if ($DryRun -and -not (Test-Path $TargetPath)) {
    # avoid Resolve-Path failing during dry-run
    $displayPath = $TargetPath
  }
  else {
    if (-not (Test-Path $TargetPath)) {
      throw "Cannot write GROUP.md because target path $TargetPath does not exist."
    }
    $displayPath = (Resolve-Path $TargetPath).Path
  }
  $codexHandle = "$GroupLabel-Codex"
  $claudeHandle = "$GroupLabel-Claude"
  $content = @(
    "# Worktree Profile",
    "",
    "- Group: $GroupLabel",
    "- Worktree: $displayPath",
    "- Branch: $Branch",
    "- Handles: $codexHandle / $claudeHandle",
    "",
    "## 启动模板",
    "```\n@$codexHandle 请阅读 CODEX_CLAUDE_COLLAB.md 与 docs/guides/organization-structure.md，查看 docs/plans/workstreams.md 中属于 $GroupLabel 的条目，等待 HQ 分派任务\n@$claudeHandle 请阅读 CODEX_CLAUDE_COLLAB.md，等待 $codexHandle 的 Snapshot/指令\n```",
    "",
    "## 参考",
    "- 任务看板：docs/plans/workstreams.md",
    "- 组内 Snapshot：docs/decisions/<date>-$($GroupLabel.ToLower())-*.md",
    "- 实施计划：docs/plans/$($GroupLabel.ToLower())-*.md",
    "- CAVR：docs/reports/<date>-$($GroupLabel.ToLower())-*-cavr.md"
  )

  if ($DryRun) {
    Write-Host "[dry-run] would write GROUP.md at $profile"
  }
  else {
    Set-Content -Path $profile -Value $content -Encoding UTF8
    Write-Host "Wrote $profile"
  }
}

$repoRoot = Resolve-RepoRoot
$targetPath = Get-WorktreePath -RepoRoot $repoRoot -Name $Name
$groupLabel = Resolve-GroupLabel -Name $Name -Branch $Branch

# Ensure target branch exists locally (creates from main when缺失)
Ensure-BranchExists -RepoRoot $repoRoot -Branch $Branch -DryRun:$DryRun

Invoke-WorktreeManager -RepoRoot $repoRoot -Name $Name -Branch $Branch -Folders $Folders -DryRun:$DryRun

if (-not $DryRun -and -not (Test-Path $targetPath)) {
  throw "Worktree path $targetPath was not created. Please check git output above."
}

$envSources = @()
foreach ($file in @($SharedEnvFile, $GroupEnvFile, $ExampleEnvFile)) {
  $full = Join-Path $repoRoot $file
  if (Test-Path $full) {
    $envSources += $full
  }
}

if ($envSources.Count -eq 0) {
  Write-Warning "No env files found (.env.shared/.env.group-*/.env.local.example)"
}
else {
  $destinationEnv = Join-Path $targetPath ".env.local"
  Merge-EnvFiles -Files $envSources -Destination $destinationEnv -DryRun:$DryRun
}

Write-GroupProfile -TargetPath $targetPath -GroupLabel $groupLabel -Branch $Branch -Name $Name -DryRun:$DryRun

if (-not $DryRun) {
  Write-Host "Worktree ready at $targetPath"
  Write-Host "Next steps:"
  Write-Host "  - git -C `"$targetPath`" fetch --all"
  Write-Host "  - npm run lint --prefix `"$targetPath`""
  Write-Host "  - code `"$targetPath`"  # 添加至 VS Code multi-root"
}
else {
  Write-Host "[dry-run] Completed preparation preview for $targetPath"
}
