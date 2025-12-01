# Remove BOM from package.json after git operations
# This script should be run after reset-worktree.ps1

[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$TargetPath = $PWD
)

function Remove-BOM {
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

    Write-Host "Found BOM in $FilePath, removing..." -ForegroundColor Yellow

    # Write file without BOM
    $content = [System.IO.File]::ReadAllText($FilePath)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)

    Write-Host "BOM removed from $FilePath" -ForegroundColor Green
    return $true
  }

  return $false
}

# Check and fix package.json
$packageJson = Join-Path $TargetPath "package.json"
$hadBom = Remove-BOM -FilePath $packageJson

if (-not $hadBom) {
  Write-Host "No BOM found in package.json" -ForegroundColor Green
}
