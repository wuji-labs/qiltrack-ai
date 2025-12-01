# Fix BOM in main repo after manual git operations
# Usage: .\scripts\fix-main-repo-bom.ps1
#
# Run this AFTER you manually execute:
#   git fetch origin; git reset --hard origin/main; git clean -fd
#
# This ensures package.json is clean before reset-worktree.ps1 copies it

$packageJson = Join-Path $PSScriptRoot "..\package.json"

if (-not (Test-Path $packageJson)) {
    Write-Host "package.json not found at $packageJson" -ForegroundColor Red
    exit 1
}

$bytes = [System.IO.File]::ReadAllBytes($packageJson)

if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "🔧 Found BOM in main repo package.json, removing..." -ForegroundColor Yellow
    $content = [System.IO.File]::ReadAllText($packageJson)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($packageJson, $content, $utf8NoBom)
    Write-Host "✅ BOM removed from main repo!" -ForegroundColor Green
} else {
    Write-Host "✅ No BOM in main repo package.json" -ForegroundColor Green
}
