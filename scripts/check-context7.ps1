#Requires -Version 5.1
param(
    [string]$ApiKey = ""
)

Set-StrictMode -Version Latest

$command = "npx"
$commandArgs = @(
    "-y", "@modelcontextprotocol/inspector",
    "npx", "-y", "@upstash/context7-mcp"
)

if ($ApiKey) {
    $commandArgs += @("--api-key", $ApiKey)
}

Write-Host "Running Context7 inspector..."
& $command @commandArgs 2>&1
