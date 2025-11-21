// 使用现有标签页截图
const WebSocket = require('ws');
const fs = require('fs');

const targetUrl = 'http://localhost:3000';
const screenshotPath = './homepage-screenshot.png';

// 使用第一个页面的 WebSocket 端点
const wsUrl = 'ws://127.0.0.1:9333/devtools/page/8A71457D1B6A263CD460449B11829EC6';

console.log('🎯 开始自动化操作...\n');
console.log(`1️⃣  连接到 Chrome DevTools...`);

const ws = new WebSocket(wsUrl);
let messageId = 1;

ws.on('open', () => {
    console.log('   ✅ WebSocket 已连接\n');

    // 1. 导航到目标 URL
    console.log(`2️⃣  导航到 ${targetUrl}...`);
    ws.send(JSON.stringify({
        id: messageId++,
        method: 'Page.navigate',
        params: { url: targetUrl }
    }));
});

ws.on('message', (data) => {
    const response = JSON.parse(data);

    // 等待页面加载完成
    if (response.method === 'Page.loadEventFired') {
        console.log('   ✅ 页面加载完成\n');

        // 2. 截图
        console.log('3️⃣  开始截图...');
        ws.send(JSON.stringify({
            id: messageId++,
            method: 'Page.captureScreenshot',
            params: {
                format: 'png',
                fromSurface: true,
                captureBeyondViewport: false
            }
        }));
    }

    // 处理截图结果
    if (response.id && response.result && response.result.data) {
        const imageBuffer = Buffer.from(response.result.data, 'base64');
        fs.writeFileSync(screenshotPath, imageBuffer);

        console.log('\n✅ 截图成功保存！');
        console.log(`   📁 位置: ${screenshotPath}`);
        console.log(`   📏 大小: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);
        console.log('🎉 操作完成！');
        console.log(`   🌐 页面: ${targetUrl}`);
        console.log(`   📸 截图已保存`);

        ws.close();
        process.exit(0);
    }
});

ws.on('error', (error) => {
    console.error('❌ 错误:', error.message);
    process.exit(1);
});

// 5秒超时
setTimeout(() => {
    console.error('\n❌ 操作超时');
    ws.close();
    process.exit(1);
}, 5000);
