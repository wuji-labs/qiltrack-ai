$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$port = 9333
$userDataDir = "C:\tmp\chrome-debug-demo2"

Write-Host "🚀 正在启动调试 Chrome (端口 $port)..." -ForegroundColor Cyan

& $chromePath `
  --remote-debugging-port=$port `
  --user-data-dir=$userDataDir `
  --no-first-run

Start-Sleep -Seconds 4

Write-Host "`n⏳ 正在获取 WebSocket 端点..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/json/version" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json

    Write-Host "`n✅ 调试 Chrome 已成功启动！" -ForegroundColor Green
    Write-Host "`n📋 调试信息:" -ForegroundColor White
    Write-Host "   浏览器: $($json.Browser)"
    Write-Host "   协议版本: $($json.'Protocol-Version')"
    Write-Host "`n🔗 WebSocket 端点:" -ForegroundColor White
    Write-Host "   $($json.webSocketDebuggerUrl)" -ForegroundColor Cyan
    Write-Host "`n📝 下一步操作:" -ForegroundColor White
    Write-Host "   1. 运行: npm run dev"
    Write-Host "   2. 在刚打开的 Chrome 中访问: http://localhost:3000"
    Write-Host "   3. 连接 MCP: chrome-devtools-mcp --browserUrl http://localhost:$port"

} catch {
    Write-Host "`n❌ 无法获取调试端点: $_" -ForegroundColor Red
}
