# 临时脚本：启动调试 Chrome
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$userDataDir = "C:\tmp\chrome-debug-demo"

# 清理旧的数据目录
if (Test-Path $userDataDir) {
    Remove-Item $userDataDir -Recurse -Force -ErrorAction SilentlyContinue
}

# 启动 Chrome
$proc = Start-Process $chromePath -ArgumentList `
    "--remote-debugging-port=9222", `
    "--user-data-dir=$userDataDir", `
    "--no-first-run", `
    "--no-default-browser-check" `
    -PassThru

Write-Host "✅ Chrome 调试实例已启动 (PID: $($proc.Id))"
Write-Host ""
Write-Host "等待 3 秒让 Chrome 初始化..."
Start-Sleep -Seconds 3

# 获取调试端点
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:9222/json/version" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    $wsEndpoint = $json.webSocketDebuggerUrl

    Write-Host "✅ WebSocket 调试端点："
    Write-Host "   $wsEndpoint"
    Write-Host ""
    Write-Host "📋 使用方法："
    Write-Host "   1. 在新终端运行: npm run dev"
    Write-Host "   2. 在浏览器打开: http://localhost:3000"
    Write-Host "   3. 连接 MCP: chrome-devtools-mcp --wsEndpoint $wsEndpoint"

} catch {
    Write-Host "❌ 无法获取调试端点: $_"
}
