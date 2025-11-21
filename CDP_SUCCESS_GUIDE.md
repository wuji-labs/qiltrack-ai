# Chrome DevTools Protocol 自动化成功指南

> 本文档记录了从零到成功实现 Chrome 浏览器自动化截图的完整过程，包括所有踩过的坑和解决方案。

## 目录
1. [环境准备](#环境准备)
2. [常见错误及解决方案](#常见错误及解决方案)
3. [成功的实现方案](#成功的实现方案)
4. [完整工作流程](#完整工作流程)
5. [最佳实践](#最佳实践)

---

## 环境准备

### 1. 启动调试 Chrome

**关键点：使用独立的用户数据目录**

```powershell
# Windows PowerShell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9333 `
  --user-data-dir="C:\tmp\chrome-debug" `
  --no-first-run

# 注意事项：
# 1. 避免使用 9222 端口（可能被系统服务占用）
# 2. 使用独立的用户数据目录避免冲突
# 3. --no-first-run 跳过首次运行向导
```

### 2. 验证 Chrome 是否正常启动

```bash
# 方法 1：检查端口监听
netstat -ano | grep "9333.*LISTEN"

# 方法 2：访问调试接口
curl http://localhost:9333/json/version

# 方法 3：获取页面列表
curl http://localhost:9333/json
```

**成功标志：** 返回 JSON 数据，包含 `webSocketDebuggerUrl`

---

## 常见错误及解决方案

### ❌ 错误 1：端口被占用

**症状：**
```
无法启动 Chrome，或者端口已被其他进程占用
netstat 显示端口被 svchost (系统服务) 占用
```

**解决方案：**
```powershell
# 1. 检查占用端口的进程
netstat -ano | grep 9222
# 如果是 svchost，说明是系统服务

# 2. 使用其他端口（推荐 9333）
--remote-debugging-port=9333
```

### ❌ 错误 2：WebSocket 连接失败

**症状：**
```
WebSocket 能连接，但导航命令没反应
页面加载事件 (Page.loadEventFired) 不触发
```

**原因：** 没有启用 Page domain

**解决方案：**
```javascript
// ✅ 正确做法：先启用 Page domain
ws.send(JSON.stringify({
    id: 1,
    method: 'Page.enable'  // 必须先启用！
}));

// 然后再导航
ws.send(JSON.stringify({
    id: 2,
    method: 'Page.navigate',
    params: { url: 'http://localhost:3000' }
}));
```

### ❌ 错误 3：使用 GET 创建新标签页

**症状：**
```
Error: Using unsafe HTTP verb GET to invoke /json/new.
This action supports only PUT verb.
```

**解决方案：**
```javascript
// ❌ 错误做法
http.get(`http://127.0.0.1:9333/json/new?http://example.com`)

// ✅ 正确做法：使用现有标签页 + Page.navigate
// 或使用 PUT 方法（但更复杂，不推荐）
```

### ❌ 错误 4：PowerShell 脚本语法错误

**症状：**
```
在 Git Bash 中执行 PowerShell 多行命令失败
Missing EndCurlyBrace 等语法错误
```

**解决方案：**
```bash
# ❌ 不要在 Git Bash 中直接写多行 PowerShell
powershell -Command "多行命令..."  # 转义地狱

# ✅ 方案 1：创建 .ps1 文件
# 创建 script.ps1 文件，然后：
powershell.exe -ExecutionPolicy Bypass -File script.ps1

# ✅ 方案 2：使用 Node.js 脚本（推荐）
node script.js
```

### ❌ 错误 5：截图超时

**症状：**
```
操作超时 (5秒/10秒)
页面已导航但截图命令无响应
```

**解决方案：**
```javascript
// ✅ 正确的事件处理顺序
ws.on('message', (data) => {
    const response = JSON.parse(data);

    // 1. 等待 Page.enable 响应
    if (response.id === 1) {
        // 发送导航命令
    }

    // 2. 等待 Page.loadEventFired 事件
    if (response.method === 'Page.loadEventFired') {
        // 额外等待 1 秒让页面完全渲染
        setTimeout(() => {
            // 发送截图命令
        }, 1000);
    }

    // 3. 处理截图结果
    if (response.result && response.result.data) {
        // 保存图片
    }
});
```

---

## 成功的实现方案

### 完整的 Node.js 脚本

```javascript
const WebSocket = require('ws');
const fs = require('fs');

const targetUrl = 'http://localhost:3000';
const screenshotPath = './homepage-screenshot.png';

// 从 http://localhost:9333/json 获取第一个页面的 wsUrl
const wsUrl = 'ws://127.0.0.1:9333/devtools/page/YOUR_PAGE_ID';

console.log('🎯 开始自动化操作...\n');

const ws = new WebSocket(wsUrl);
let messageId = 1;
let pageEnabled = false;
let navigated = false;

ws.on('open', () => {
    console.log('1️⃣  WebSocket 已连接');

    // 关键步骤 1：启用 Page domain
    ws.send(JSON.stringify({
        id: messageId++,
        method: 'Page.enable'
    }));
});

ws.on('message', (data) => {
    const response = JSON.parse(data);

    // 关键步骤 2：等待 Page.enable 完成
    if (response.id === 1 && !pageEnabled) {
        pageEnabled = true;
        console.log('   ✅ Page domain 已启用\n');

        // 关键步骤 3：导航到目标 URL
        console.log(`2️⃣  导航到 ${targetUrl}...`);
        ws.send(JSON.stringify({
            id: messageId++,
            method: 'Page.navigate',
            params: { url: targetUrl }
        }));
    }

    // 关键步骤 4：监听导航完成
    if (response.id === 2 && !navigated) {
        navigated = true;
        console.log('   ✅ 导航命令已发送\n');
    }

    // 关键步骤 5：等待页面加载事件
    if (response.method === 'Page.loadEventFired') {
        console.log('3️⃣  页面加载完成');

        // 关键步骤 6：额外等待确保渲染完成
        setTimeout(() => {
            console.log('4️⃣  开始截图...');
            ws.send(JSON.stringify({
                id: messageId++,
                method: 'Page.captureScreenshot',
                params: {
                    format: 'png'
                }
            }));
        }, 1000);  // 等待 1 秒让页面完全渲染
    }

    // 关键步骤 7：处理截图结果
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

// 超时保护
setTimeout(() => {
    console.error('\n❌ 操作超时 (10秒)');
    ws.close();
    process.exit(1);
}, 10000);
```

### 获取 Page ID 的辅助脚本

```javascript
// get-page-id.js
const http = require('http');

http.get('http://127.0.0.1:9333/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const pages = JSON.parse(data);
        const mainPage = pages.find(p => p.type === 'page' && !p.parentId);

        console.log('📋 主页面信息:');
        console.log(`   ID: ${mainPage.id}`);
        console.log(`   Title: ${mainPage.title}`);
        console.log(`   URL: ${mainPage.url}`);
        console.log(`\n🔗 WebSocket URL:`);
        console.log(`   ${mainPage.webSocketDebuggerUrl}`);
    });
});
```

---

## 完整工作流程

### 步骤 1：启动调试 Chrome

```powershell
# 创建启动脚本 start-debug-chrome.ps1
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$port = 9333
$userDataDir = "C:\tmp\chrome-debug"

& $chromePath `
  --remote-debugging-port=$port `
  --user-data-dir=$userDataDir `
  --no-first-run

Start-Sleep -Seconds 3

# 验证启动
$response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/json/version" -UseBasicParsing
$json = $response.Content | ConvertFrom-Json
Write-Host "✅ Chrome 已启动"
Write-Host "   WebSocket: $($json.webSocketDebuggerUrl)"
```

### 步骤 2：获取页面 ID

```bash
node get-page-id.js
```

输出示例：
```
📋 主页面信息:
   ID: 8A71457D1B6A263CD460449B11829EC6
   Title: 新标签页
   URL: chrome://newtab/

🔗 WebSocket URL:
   ws://127.0.0.1:9333/devtools/page/8A71457D1B6A263CD460449B11829EC6
```

### 步骤 3：更新截图脚本

将获取的 Page ID 填入 `screenshot-final.js` 的 `wsUrl` 变量。

### 步骤 4：执行截图

```bash
node screenshot-final.js
```

### 步骤 5：验证结果

```bash
ls -lh homepage-screenshot.png
# 应该看到 ~500KB 的 PNG 文件
```

---

## 最佳实践

### 1. 端口选择策略

```javascript
// 推荐端口优先级
const ports = [9333, 9334, 9335, 9223, 9224];

// 不推荐：9222（容易被系统服务占用）
```

### 2. 错误处理模式

```javascript
ws.on('error', (error) => {
    console.error('WebSocket 错误:', error.message);

    // 常见错误处理
    if (error.code === 'ECONNREFUSED') {
        console.error('提示：Chrome 可能未启动或端口错误');
    } else if (error.code === 'ETIMEDOUT') {
        console.error('提示：检查防火墙或增加超时时间');
    }

    process.exit(1);
});
```

### 3. 超时时间设置

```javascript
// 根据页面复杂度调整
const timeouts = {
    connection: 5000,      // WebSocket 连接
    navigation: 10000,     // 页面导航
    rendering: 1000,       // 额外渲染等待
    screenshot: 5000,      // 截图生成
    total: 20000           // 总超时
};
```

### 4. 资源清理

```javascript
process.on('SIGINT', () => {
    console.log('\n清理资源...');
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
    process.exit(0);
});
```

### 5. 日志记录

```javascript
const debug = process.env.DEBUG === 'true';

function log(level, message, data) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level}: ${message}`);
    if (debug && data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

// 使用
log('INFO', 'Page domain enabled');
log('DEBUG', 'Received CDP message', response);
```

---

## 调试技巧

### 1. 查看所有 CDP 消息

```javascript
ws.on('message', (data) => {
    const response = JSON.parse(data);
    console.log('📥 Received:', JSON.stringify(response, null, 2));
    // ... 处理逻辑
});
```

### 2. 手动测试 WebSocket 连接

使用 `wscat` 工具：
```bash
npm install -g wscat
wscat -c "ws://127.0.0.1:9333/devtools/page/YOUR_PAGE_ID"

# 发送命令
> {"id":1,"method":"Page.enable"}
> {"id":2,"method":"Page.navigate","params":{"url":"http://localhost:3000"}}
> {"id":3,"method":"Page.captureScreenshot","params":{"format":"png"}}
```

### 3. 查看 Chrome DevTools 自己的调试界面

在浏览器中打开：
```
chrome://inspect/#devices
```

或访问：
```
http://localhost:9333
```

---

## 故障排查清单

遇到问题时，按顺序检查：

- [ ] Chrome 是否正常启动？
  ```bash
  tasklist | grep chrome
  ```

- [ ] 调试端口是否监听？
  ```bash
  netstat -ano | grep 9333
  ```

- [ ] 能否访问 /json 接口？
  ```bash
  curl http://localhost:9333/json
  ```

- [ ] WebSocket URL 是否正确？
  - 检查是否包含正确的 Page ID
  - 端口号是否匹配

- [ ] Page domain 是否已启用？
  - 检查日志中是否有 `Page.enable` 的响应

- [ ] 目标网站是否可访问？
  ```bash
  curl http://localhost:3000
  ```

- [ ] 超时时间是否足够？
  - 复杂页面可能需要更长加载时间

---

## 总结

### 成功的关键要素

1. ✅ **使用可用的端口**（避开 9222）
2. ✅ **独立的用户数据目录**
3. ✅ **必须先启用 Page domain**
4. ✅ **正确的事件处理顺序**
5. ✅ **适当的等待时间**
6. ✅ **完善的错误处理**

### 推荐工具链

- **语言**: Node.js（比 PowerShell 更可靠）
- **WebSocket 库**: `ws` (npm package)
- **调试工具**: `wscat`, Chrome DevTools
- **文档**: [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

### 扩展阅读

- [CDP Viewer](https://chromedevtools.github.io/devtools-protocol/)
- [Puppeteer](https://pptr.dev/) - 更高级的封装
- [Playwright](https://playwright.dev/) - 跨浏览器自动化

---

## 附录：完整示例仓库结构

```
project/
├── scripts/
│   ├── start-debug-chrome.ps1      # 启动调试 Chrome
│   ├── get-page-id.js               # 获取页面 ID
│   └── screenshot-final.js          # 截图脚本
├── .gitignore
└── README.md                        # 本文档
```

---

**最后更新**: 2025-11-21
**测试环境**: Windows 11, Chrome 142, Node.js v20
**状态**: ✅ 生产可用

---

## 致谢

本文档基于实际踩坑经验总结，希望能帮助其他 AI 助手和开发者快速实现 Chrome 自动化。

**遇到问题？** 请按照故障排查清单逐步检查，90% 的问题都能解决。
