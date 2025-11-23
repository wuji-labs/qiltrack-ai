#Requires -Version 5.1
param(
    [ValidateSet("start", "endpoint", "stop")]
    [string]$Command = "start"
)

$PSDefaultParameterValues['*:ErrorAction'] = 'Stop'
Set-StrictMode -Version Latest

$port = if ($env:PORT) { [int]$env:PORT } else { 9222 }
$userDir = if ($env:USER_DIR) { $env:USER_DIR } else { "C:\tmp\chrome-debug" }
$chromeBin = if ($env:CHROME_BIN) { $env:CHROME_BIN } else { "C:\Program Files\Google\Chrome\Application\chrome.exe" }
$logFile = if ($env:LOG) { $env:LOG } else { Join-Path $env:TEMP "chrome-mcp.log" }
$portFile = Join-Path $userDir "DevToolsActivePort"

function Get-ChromeProcessesUsingPort {
    param([int]$RemotePort)
    try {
        $processes = Get-CimInstance -ClassName Win32_Process -Filter "Name='chrome.exe'"
        return $processes | Where-Object { $_.CommandLine -match "--remote-debugging-port=$RemotePort" }
    } catch {
        Write-Verbose "Failed to query chrome processes: $_"
        return @()
    }
}

function Start-DevtoolsChrome {
    param(
        [string]$ChromePath,
        [int]$RemotePort,
        [string]$UserDataDir,
        [string]$LogPath
    )

    if (-not (Test-Path -Path $ChromePath)) {
        throw "Chrome binary not found at '$ChromePath'. Set CHROME_BIN before running."
    }

    if (-not (Test-Path -Path $UserDataDir)) {
        New-Item -ItemType Directory -Path $UserDataDir -Force | Out-Null
    }

    $existing = Get-ChromeProcessesUsingPort -RemotePort $RemotePort
    if ($existing) {
        Write-Output "Chrome is already listening on $RemotePort (PID(s): $($existing.ProcessId -join ', ')). Use the 'endpoint' command."
        return
    }

    $arguments = @(
        "--remote-debugging-port=$RemotePort",
        "--remote-debugging-address=127.0.0.1",
        "--user-data-dir=$UserDataDir",
        "--remote-allow-origins=*",
        "--disable-first-run-ui",
        "--no-first-run"
    )

    $startInfo = @{
        FilePath          = $ChromePath
        ArgumentList      = $arguments
        WindowStyle       = 'Hidden'
        PassThru          = $true
    }

    $proc = Start-Process @startInfo
    Write-Output "Chrome started on port $RemotePort (PID $($proc.Id))."

    Write-Verbose "Waiting for DevTools endpoint to be ready..."
    Start-Sleep -Seconds 3
    $endpoint = Get-DevtoolsEndpoint -PortFilePath (Join-Path $UserDataDir "DevToolsActivePort") -RemotePort $RemotePort

    if ($endpoint -and $endpoint -notmatch "not ready") {
        Write-Output "WebSocket endpoint: $endpoint"
    } else {
        Write-Output "DevTools not ready yet. Run 'endpoint' command to check status."
    }
}

function Wait-DevtoolsEndpoint {
    param(
        [int]$RemotePort,
        [int]$TimeoutSeconds = 15
    )

    $startTime = Get-Date
    $maxWait = $startTime.AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $maxWait) {
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:$RemotePort/json/version" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            $json = $response.Content | ConvertFrom-Json
            Write-Verbose "[$(Get-Date -Format 'HH:mm:ss')] DevTools endpoint ready"
            return $json.webSocketDebuggerUrl
        } catch {
            Write-Verbose "[$(Get-Date -Format 'HH:mm:ss')] Waiting for DevTools... ($_)"
            Start-Sleep -Milliseconds 500
        }
    }
    return $null
}

function Get-DevtoolsEndpoint {
    param(
        [string]$PortFilePath,
        [int]$RemotePort
    )

    if (Test-Path -Path $PortFilePath) {
        $lines = Get-Content -Path $PortFilePath -ErrorAction SilentlyContinue
        if ($lines.Count -ge 2) {
            $boundPort = if ([int]::TryParse($lines[0], [ref]0)) { $lines[0] } else { $RemotePort }
            $uuid = $lines[1]
            return "ws://127.0.0.1:$boundPort/devtools/browser/$uuid"
        }
    }

    Write-Verbose "Polling DevTools endpoint (max 15s)..."
    $endpoint = Wait-DevtoolsEndpoint -RemotePort $RemotePort -TimeoutSeconds 15

    if ($endpoint) {
        return $endpoint
    } else {
        return "(endpoint not ready - Chrome may still be initializing)"
    }
}

function Stop-DevtoolsChrome {
    param([int]$RemotePort)

    $targets = Get-ChromeProcessesUsingPort -RemotePort $RemotePort
    if (-not $targets) {
        Write-Output "No Chrome process found with --remote-debugging-port=$RemotePort."
        return
    }

    foreach ($proc in $targets) {
        try {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
            Write-Output "Stopped Chrome PID $($proc.ProcessId)."
        } catch {
            Write-Warning "Failed to stop Chrome PID $($proc.ProcessId): $_"
        }
    }
}

switch ($Command) {
    "start" {
        Start-DevtoolsChrome -ChromePath $chromeBin -RemotePort $port -UserDataDir $userDir -LogPath $logFile
    }
    "endpoint" {
        $endpoint = Get-DevtoolsEndpoint -PortFilePath $portFile -RemotePort $port
        Write-Output $endpoint
    }
    "stop" {
        Stop-DevtoolsChrome -RemotePort $port
    }
}
