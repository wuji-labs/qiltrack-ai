# Emergency BOM fixer - removes BOM from package.json
$packageJson = "package.json"

if (-not (Test-Path $packageJson)) {
    Write-Host "package.json not found in current directory" -ForegroundColor Red
    exit 1
}

$bytes = [System.IO.File]::ReadAllBytes($packageJson)

if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "Found BOM! Removing..." -ForegroundColor Yellow
    $content = [System.IO.File]::ReadAllText($packageJson)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($packageJson, $content, $utf8NoBom)
    Write-Host "BOM removed successfully!" -ForegroundColor Green
} else {
    Write-Host "No BOM found" -ForegroundColor Green
}
