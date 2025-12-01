# Quick fix for BOM issues in package.json
# Usage: .\scripts\fix-bom.ps1
#        .\scripts\fix-bom.ps1 -Path D:\Projects\investor-ai-g1

[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$Path = $PWD
)

function Remove-BOMFromFile {
  param([string]$FilePath)

  if (-not (Test-Path $FilePath)) {
    Write-Warning "File not found: $FilePath"
    return $false
  }

  $bytes = [System.IO.File]::ReadAllBytes($FilePath)

  # Check if file starts with UTF-8 BOM (EF BB BF)
  if ($bytes.Length -ge 3 -and
      $bytes[0] -eq 0xEF -and
      $bytes[1] -eq 0xBB -and
      $bytes[2] -eq 0xBF) {

    Write-Host "🔧 Found BOM in $(Split-Path $FilePath -Leaf), removing..." -ForegroundColor Yellow

    # Read and write file without BOM
    $content = [System.IO.File]::ReadAllText($FilePath)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)

    Write-Host "✅ BOM removed successfully" -ForegroundColor Green
    return $true
  } else {
    Write-Host "✅ No BOM found in $(Split-Path $FilePath -Leaf)" -ForegroundColor Green
    return $false
  }
}

Write-Host "=== Checking for BOM in JSON files ===" -ForegroundColor Cyan
Write-Host ""

$targetDir = if (Test-Path $Path) { $Path } else { $PWD }
Write-Host "Target directory: $targetDir" -ForegroundColor Gray
Write-Host ""

# Check package.json
$packageJson = Join-Path $targetDir "package.json"
if (Test-Path $packageJson) {
  Remove-BOMFromFile -FilePath $packageJson
} else {
  Write-Warning "package.json not found at $packageJson"
}

Write-Host ""

# Check other common JSON files
$otherJsonFiles = @(
  "tsconfig.json",
  ".eslintrc.json",
  "next.config.json"
)

foreach ($file in $otherJsonFiles) {
  $filePath = Join-Path $targetDir $file
  if (Test-Path $filePath) {
    Remove-BOMFromFile -FilePath $filePath
  }
}

Write-Host ""
Write-Host "=== BOM check complete ===" -ForegroundColor Cyan
