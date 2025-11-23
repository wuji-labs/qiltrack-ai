# Chrome DevTools 原生调试演示

## 什么是 Chrome DevTools MCP 调试？

Chrome DevTools Protocol (CDP) 允许通过 WebSocket 远程控制和调试 Chrome 浏览器。
`chrome-devtools-mcp` 是一个 MCP 服务器，可以让 AI（如 Claude Code）直接操作浏览器进行调试。

## 完整操作流程

### 步骤 1: 启动调试 Chrome

```powershell
# Windows PowerShell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="C:\tmp\chrome-debug" `
  --no-first-run
```

或使用项目脚本：
```bash
npm run dev:chrome
```

**参数说明：**
- `--remote-debugging-port=9222`: 开启调试端口
- `--user-data-dir`: 使用独立的用户数据目录（避免与日常浏览器冲突）
- `--no-first-run`: 跳过首次运行向导

### 步骤 2: 获取 WebSocket 端点

在浏览器或命令行访问：
```
http://localhost:9222/json/version
```

返回示例：
```json
{
  "Browser": "Chrome/131.0.6778.86",
  "Protocol-Version": "1.3",
  "User-Agent": "Mozilla/5.0...",
  "V8-Version": "13.1.201.13",
  "WebKit-Version": "537.36",
  "webSocketDebuggerUrl": "ws://127.0.0.1:9222/devtools/browser/abc123..."
}
```

**重要**：复制 `webSocketDebuggerUrl` 的值

### 步骤 3: 启动你的 Next.js 应用

```bash
npm run dev
```

应用会在 http://localhost:3000 启动

### 步骤 4: 在 Chrome 中打开应用

在刚才启动的调试 Chrome 窗口中访问：
```
http://localhost:3000
```

### 步骤 5: 连接 chrome-devtools-mcp

```bash
# 方式 1：使用 WebSocket URL
chrome-devtools-mcp --wsEndpoint ws://127.0.0.1:9222/devtools/browser/abc123...

# 方式 2：使用浏览器 URL（自动获取 WebSocket）
chrome-devtools-mcp --browserUrl http://localhost:9222
```

### 步骤 6: 现在可以做什么？

连接成功后，AI 可以通过 MCP 协议：

1. **页面导航**
   - 自动打开指定 URL
   - 点击页面元素
   - 填写表单

2. **调试代码**
   - 查看 Console 输出
   - 设置断点
   - 查看网络请求

3. **截图验证**
   - 截取当前页面
   - 验证 UI 变化

4. **性能分析**
   - 监控页面加载
   - 查看资源使用

## 实际使用示例

### 示例 1: 自动化测试报告生成流程

```bash
# 1. 启动调试 Chrome
npm run dev:chrome

# 2. 启动开发服务器
npm run dev

# 3. 在 Claude Code 中执行
"请帮我测试报告生成功能：
1. 打开 localhost:3000
2. 在搜索框输入 NVDA
3. 点击生成报告
4. 截图确认进度条显示
5. 等待报告生成完成"
```

AI 会自动通过 chrome-devtools-mcp 执行这些操作并反馈结果。

### 示例 2: 调试前端错误

```bash
"页面上的进度条样式不对，帮我：
1. 打开页面
2. 检查 Console 是否有错误
3. 截图当前状态
4. 查看 ProgressBar 组件的 DOM 结构"
```

### 示例 3: 性能优化

```bash
"帮我分析首页加载性能：
1. 清除缓存并重新加载
2. 查看 Network 面板
3. 统计静态资源大小
4. 查找加载最慢的资源"
```

## 与常规调试的区别

### 传统方式：
1. 手动打开浏览器
2. 手动操作页面
3. 目视检查或手动截图
4. 复制错误信息给 AI
5. AI 提供建议
6. 你再手动修改测试

### MCP 调试方式：
1. 启动调试 Chrome
2. 告诉 AI 要做什么
3. AI 自动操作浏览器
4. AI 自动截图和收集信息
5. AI 直接修改代码
6. AI 自动验证修改效果

**效率提升：原本需要 10 分钟的手动测试 → 2 分钟自动化完成**

## 常见问题

### Q: 为什么需要单独的用户数据目录？
A: 避免与日常使用的 Chrome 冲突，可以同时运行两个独立的 Chrome 实例。

### Q: 9222 端口被占用怎么办？
A: 可以修改端口号，例如使用 9223：
```bash
PORT=9223 npm run dev:chrome
chrome-devtools-mcp --browserUrl http://localhost:9223
```

### Q: 调试完成后如何关闭？
```bash
npm run dev:chrome:stop
```

### Q: 推荐的调试环境是什么？
A: **Windows PowerShell（默认）**。所有命令都已为 Windows 原生优化，见 README.md 的"调试辅助"章节。

**Legacy：WSL 支持**（仅在特殊环境）：若需在 WSL 中使用，详见 `AGENTS.md` 附录"Legacy：WSL 调试"。

## 总结

Chrome DevTools MCP 调试的核心价值：
- ✅ **自动化**：AI 可以自动操作浏览器
- ✅ **可视化**：实时查看操作过程（截图）
- ✅ **效率**：减少手动测试时间
- ✅ **智能**：AI 可以分析页面问题并提出解决方案

适合用于：
- 🎯 E2E 测试
- 🎯 UI 调试
- 🎯 性能分析
- 🎯 自动化回归测试
