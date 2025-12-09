# Sync Worktree Safety Files to All Worktrees
# Usage: pwsh scripts/sync-safety-to-worktrees.ps1

Write-Host "🔧 Syncing worktree safety files to all worktrees..." -ForegroundColor Cyan
Write-Host ""

# Define worktree paths
$worktrees = @(
    "D:\Projects\qiltrack-ai",
    "D:\Projects\qiltrack-ai-g1",
    "D:\Projects\qiltrack-ai-g2",
    "D:\Projects\qiltrack-ai-g3",
    "D:\Projects\qiltrack-ai-g4",
    "D:\Projects\qiltrack-ai-g5"
)

$currentDir = $PSScriptRoot | Split-Path

# Files to sync
$scriptFiles = @(
    "scripts\dev-safe.js",
    "scripts\dev-stop.js",
    "scripts\dev-restart.js"
)

$docFiles = @(
    "docs\AI-WORKTREE-GUIDE.md",
    "docs\DEPLOY-WORKTREE-SAFETY.md",
    "AI-COMMANDS.md"
)

$syncCount = 0
$skipCount = 0

foreach ($wt in $worktrees) {
    if (Test-Path $wt) {
        Write-Host "📦 Syncing to: $wt" -ForegroundColor Yellow

        # Copy scripts
        foreach ($file in $scriptFiles) {
            $source = Join-Path $currentDir $file
            $dest = Join-Path $wt $file

            if (Test-Path $source) {
                Copy-Item $source $dest -Force
                Write-Host "   ✅ Copied $file" -ForegroundColor Green
            }
            else {
                Write-Host "   ⚠️  Source not found: $file" -ForegroundColor DarkYellow
            }
        }

        # Ensure docs directory exists
        $docsDir = Join-Path $wt "docs"
        if (-not (Test-Path $docsDir)) {
            New-Item -ItemType Directory -Path $docsDir | Out-Null
        }

        # Copy docs
        foreach ($file in $docFiles) {
            $source = Join-Path $currentDir $file
            $dest = Join-Path $wt $file

            if (Test-Path $source) {
                Copy-Item $source $dest -Force
                Write-Host "   ✅ Copied $file" -ForegroundColor Green
            }
            else {
                Write-Host "   ⚠️  Source not found: $file" -ForegroundColor DarkYellow
            }
        }

        $syncCount++
        Write-Host ""
    }
    else {
        Write-Host "⚠️  Worktree not found: $wt" -ForegroundColor DarkYellow
        $skipCount++
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 Sync complete!" -ForegroundColor Green
Write-Host "   ✅ Synced: $syncCount worktrees" -ForegroundColor Green
if ($skipCount -gt 0) {
    Write-Host "   ⚠️  Skipped: $skipCount worktrees" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify package.json has the new scripts in each worktree:" -ForegroundColor White
Write-Host "   - dev:safe" -ForegroundColor Gray
Write-Host "   - dev:stop" -ForegroundColor Gray
Write-Host "   - dev:restart" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Tell your AIs to read AI-COMMANDS.md" -ForegroundColor White
Write-Host ""
Write-Host "3. Test in each worktree:" -ForegroundColor White
Write-Host "   npm run dev:safe" -ForegroundColor Gray
Write-Host "   npm run dev:stop" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
