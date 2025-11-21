# Chrome DevTools Protocol 自动化脚本
$debugPort = 9333
$targetUrl = "http://localhost:3000"
$screenshotPath = "D:\Projects\investor-ai\homepage-screenshot.png"

Write-Host "🎯 开始自动化操作..." -ForegroundColor Cyan

# 1. 创建新标签页
Write-Host "`n1️⃣ 创建新标签页..." -ForegroundColor Yellow
$createResponse = Invoke-WebRequest -Uri "http://127.0.0.1:$debugPort/json/new?$targetUrl" -UseBasicParsing
$pageInfo = $createResponse.Content | ConvertFrom-Json
$pageId = $pageInfo.id

Write-Host "   ✅ 标签页已创建 (ID: $pageId)" -ForegroundColor Green

# 等待页面加载
Write-Host "`n2️⃣ 等待页面加载..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 2. 连接 WebSocket 并截图
Write-Host "`n3️⃣ 连接 DevTools 并截图..." -ForegroundColor Yellow

# 使用 CDP 命令截图
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$uri = [System.Uri]::new($pageInfo.webSocketDebuggerUrl)
$cancellationToken = [System.Threading.CancellationToken]::None

try {
    # 连接 WebSocket
    $connectTask = $ws.ConnectAsync($uri, $cancellationToken)
    $connectTask.Wait()

    Write-Host "   ✅ WebSocket 已连接" -ForegroundColor Green

    # 发送截图命令
    $screenshotCmd = @{
        id = 1
        method = "Page.captureScreenshot"
        params = @{
            format = "png"
            fromSurface = $true
        }
    } | ConvertTo-Json

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($screenshotCmd)
    $segment = [System.ArraySegment[byte]]::new($bytes)
    $sendTask = $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cancellationToken)
    $sendTask.Wait()

    Write-Host "   📤 截图命令已发送" -ForegroundColor Cyan

    # 接收响应
    $buffer = [byte[]]::new(1024 * 1024 * 10) # 10MB buffer
    $segment = [System.ArraySegment[byte]]::new($buffer)
    $receiveTask = $ws.ReceiveAsync($segment, $cancellationToken)
    $receiveTask.Wait()

    $response = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $receiveTask.Result.Count)
    $responseObj = $response | ConvertFrom-Json

    if ($responseObj.result.data) {
        # 保存截图
        $imageBytes = [Convert]::FromBase64String($responseObj.result.data)
        [System.IO.File]::WriteAllBytes($screenshotPath, $imageBytes)

        Write-Host "`n✅ 截图成功保存！" -ForegroundColor Green
        Write-Host "   📁 位置: $screenshotPath" -ForegroundColor White
        Write-Host "   📏 大小: $([Math]::Round($imageBytes.Length / 1KB, 2)) KB" -ForegroundColor White
    } else {
        Write-Host "   ❌ 截图失败: $($responseObj.error)" -ForegroundColor Red
    }

} catch {
    Write-Host "   ❌ 错误: $_" -ForegroundColor Red
} finally {
    if ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $closeTask = $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cancellationToken)
        $closeTask.Wait()
    }
    $ws.Dispose()
}

Write-Host "`n🎉 操作完成！" -ForegroundColor Green
Write-Host "   🌐 页面: $targetUrl" -ForegroundColor White
Write-Host "   📸 截图: $screenshotPath" -ForegroundColor White
