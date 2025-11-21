// get-page-id.js - 获取 Chrome 调试页面 ID
const http = require('http');

const port = process.env.PORT || 9333;

console.log(`\n🔍 查询 Chrome 调试页面 (端口 ${port})...\n`);

http.get(`http://127.0.0.1:${port}/json`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const pages = JSON.parse(data);
        const mainPages = pages.filter(p => p.type === 'page' && !p.parentId);

        if (mainPages.length === 0) {
            console.log('❌ 未找到可用页面');
            process.exit(1);
        }

        console.log(`📋 找到 ${mainPages.length} 个页面:\n`);
        mainPages.forEach((page, i) => {
            console.log(`--- 页面 ${i + 1} ---`);
            console.log(`   ID:    ${page.id}`);
            console.log(`   Title: ${page.title || '(无标题)'}`);
            console.log(`   URL:   ${page.url}`);
            console.log(`   WS:    ${page.webSocketDebuggerUrl}`);
            console.log('');
        });

        // 输出第一个页面的信息用于复制
        const first = mainPages[0];
        console.log('📝 复制以下内容到截图脚本:');
        console.log(`const wsUrl = '${first.webSocketDebuggerUrl}';`);
    });
}).on('error', (err) => {
    console.error(`❌ 连接失败: ${err.message}`);
    console.error(`\n提示: 请确保 Chrome 已启动调试模式 (端口 ${port})`);
    process.exit(1);
});
