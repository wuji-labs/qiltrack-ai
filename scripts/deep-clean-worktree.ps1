# Deep clean and fix BOM - removes all caches and rebuilds
# Run this in the worktree directory

Write-Host "Deep cleaning worktree..." -ForegroundColor Cyan

# Step 1: Kill any running dev servers
Write-Host "1. Checking for running dev servers..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*qiltrack-ai*" } | Stop-Process -Force
Write-Host "   Done" -ForegroundColor Green

# Step 2: Remove caches
Write-Host "2. Removing caches..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next"; Write-Host "   Removed .next" -ForegroundColor Gray }
if (Test-Path "node_modules/.cache") { Remove-Item -Recurse -Force "node_modules/.cache"; Write-Host "   Removed node_modules/.cache" -ForegroundColor Gray }

# Step 3: Fix BOM in package.json
Write-Host "3. Fixing BOM in package.json..." -ForegroundColor Yellow
$packageJson = "package.json"
if (Test-Path $packageJson) {
    $bytes = [System.IO.File]::ReadAllBytes($packageJson)

    # Show first 10 bytes for debugging
    $hexBytes = ($bytes[0..9] | ForEach-Object { $_.ToString("X2") }) -join " "
    Write-Host "   First bytes: $hexBytes" -ForegroundColor Gray

    if ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        Write-Host "   BOM FOUND! Removing..." -ForegroundColor Red
        $content = [System.IO.File]::ReadAllText($packageJson)
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($packageJson, $content, $utf8NoBom)
        Write-Host "   BOM removed!" -ForegroundColor Green
    } elseif ($bytes[0] -ne 0x7B) {
        Write-Host "   WARNING: File doesn't start with '{' (0x7B), starts with 0x$($bytes[0].ToString('X2'))" -ForegroundColor Red
        Write-Host "   Attempting to fix..." -ForegroundColor Yellow
        $content = [System.IO.File]::ReadAllText($packageJson)
        # Remove any non-printable characters at start
        $content = $content -replace '^\s*[\x00-\x1F\x7F-\xFF]*', ''
        if (-not $content.StartsWith('{')) {
            $content = $content.Substring($content.IndexOf('{'))
        }
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($packageJson, $content, $utf8NoBom)
        Write-Host "   Fixed!" -ForegroundColor Green
    } else {
        Write-Host "   No BOM, file starts correctly with '{'" -ForegroundColor Green
    }
}

# Step 4: Verify
Write-Host "4. Verifying package.json..." -ForegroundColor Yellow
try {
    $null = Get-Content $packageJson | ConvertFrom-Json
    Write-Host "   Valid JSON!" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Still invalid JSON!" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Deep clean complete! Now run: npm run dev" -ForegroundColor Green
