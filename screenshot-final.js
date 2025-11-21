const WebSocket = require('ws');
const fs = require('fs');

const targetUrl = 'http://localhost:3000';
const screenshotPath = './homepage-screenshot.png';
const wsUrl = 'ws://127.0.0.1:9333/devtools/page/8A71457D1B6A263CD460449B11829EC6';

console.log('🎯 开始自动化操作...\n');

const ws = new WebSocket(wsUrl);
let messageId = 1;
let pageEnabled = false;
let navigated = false;

ws.on('open', () => {
    console.log('1️⃣  WebSocket 已连接');

    // 启用 Page domain
    ws.send(JSON.stringify({
        id: messageId++,
        method: 'Page.enable'
    }));
});

ws.on('message', (data) => {
    const response = JSON.parse(data);

    // Page domain 启用成功
    if (response.id === 1 && !pageEnabled) {
        pageEnabled = true;
        console.log('   ✅ Page domain 已启用\n');

        // 导航到目标 URL
        console.log(`2️⃣  导航到 ${targetUrl}...`);
        ws.send(JSON.stringify({
            id: messageId++,
            method: 'Page.navigate',
            params: { url: targetUrl }
        }));
    }

    // 导航响应
    if (response.id === 2 && !navigated) {
        navigated = true;
        console.log('   ✅ 导航命令已发送\n');
    }

    // 页面加载完成
    if (response.method === 'Page.loadEventFired') {
        console.log('3️⃣  页面加载完成');

        // 等待一下让页面完全渲染
        setTimeout(() => {
            console.log('4️⃣  开始截图...');
            ws.send(JSON.stringify({
                id: messageId++,
                method: 'Page.captureScreenshot',
                params: {
                    format: 'png'
                }
            }));
        }, 1000);
    }

    // 截图结果
    if (response.result && response.result.data) {
        const imageBuffer = Buffer.from(response.result.data, 'base64');
        fs.writeFileSync(screenshotPath, imageBuffer);

        console.log('\n✅ 截图成功保存！');
        console.log(`   📁 位置: ${screenshotPath}`);
        console.log(`   📏 大小: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);
        console.log('🎉 操作完成！');

        ws.close();
        process.exit(0);
    }
});

ws.on('error', (error) => {
    console.error('❌ 错误:', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('\n❌ 操作超时 (10秒)');
    ws.close();
    process.exit(1);
}, 10000);
