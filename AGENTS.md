# Repository Guidelines

## Codex–Claude Collaboration Protocol
**⚠️ 每次会话开始时，Codex 和 Claude 都必须先读取 `CODEX_CLAUDE_COLLAB.md` 以了解协作流程、职责边界和质量门槛。**

### 对 Codex（架构师）的要求：
- 发布新任务前先产出 Architecture Snapshot 存入 `docs/decisions/<date>-<topic>.md`
- Snapshot 需包含：问题背景、设计目标、技术约束、文案 key、测试要求
- 代码审查时关注架构完整性、测试覆盖、文档同步
- 用中文与用户沟通，代码/命令保持英文

### 对 Claude（实现工程师）的要求：
- 收到 Snapshot 后先确认依赖和环境，列出实施清单
- 所有交付物需遵循 CAVR 格式：**Context → Actions → Verification → Risks**
- 完成后附上 `npm run lint` / `npm test` 结果
- Scope 变动 >20% 时主动触发 mini design review
- 用中文与用户沟通，代码/命令保持英文

## Project Structure & Module Organization
- `app/`：Next.js App Router 入口，`layout.tsx` 管理全局字体与样式；`page.tsx` 组合多个 Section（Hero、Modes、ReportGenerator、Why、Templates/Pricing/FAQ、Footer）。  
- `app/sections/`：页面拆分的可复用区块（HeroSection、ReportGeneratorSection、ModesSection、WhySection、FooterSection 等）。  
- `app/components/`：通用 UI 组件（如进度条 `ProgressBar`）。  
- `hooks/`：客户端 Hook（`useAuth`、`useProgress` 等）。  
- `lib/services/`：封装前端 API 请求（`api.ts`）。  
- `types/`：共享类型定义（`types/report.ts`）。  
- `app/api/`：`search`、`quote`、`report` 路由，统一从 Finnhub/OpenRouter 拉数据。`OPENROUTER_MODEL` 可配置模型。  
- `public/`：静态资源 (`favicon.ico` 等)。`node_modules/、.next/` 属构建输出；`test-api.js` 用于独立验证 OpenAI SDK。

## Build, Test, and Development Commands
- `npm run dev`：在 `localhost:3000` 启动开发服务器。  
- `npm run build`：生成 `.next` 生产构建。  
- `npm start`：基于上一步构建启动 Node 进程。  
- `npm run lint`：执行 ESLint（Next core-web-vitals 规则）。运行前确保 `.env.local` 已包含 Finnhub 与 OpenRouter API Key。  
- `npm test`：运行 Vitest（jsdom），当前覆盖 API service 与进度条 hook。

## Coding Style & Naming Conventions
- 语言为 TypeScript + React 19 函数组件；Hook/state 命名遵循 `useXxx`、`[value, setValue]`。  
- 使用 Tailwind CSS v4 `@theme inline` 管控变量；全局 CSS 在 `app/globals.css`。  
- 使用 ESLint 9 + `eslint-config-next`，提交前运行 `npm run lint`。遵循 Prettier 默认 2 空格缩进和 `camelCase` 命名。

## Testing Guidelines
- 单元/集成测试推荐放入 `__tests__/`，命名 `*.test.ts(x)`，使用 Vitest + Testing Library；`vitest.config.ts` 已提供 alias/env 配置。  
- 现有测试覆盖：`lib/services/api` 请求封装、`useProgress` 进度逻辑。  
- 其他功能仍需手动验证（如真实 API 调用、DOCX 导出），可复用 `test-api.js` 做接口连通性检查。

## Commit & Pull Request Guidelines
- Commit 信息保持英文动词开头（如 `feat: add docx export fallback`），描述范围与改动。  
- PR 内容需包含：变更摘要、相关 Issue/需求链接、手动验证说明（含命令和截图，如报告生成流程）、若动到 API Key 配置需标注安全影响。  
- 代码评审前请确认依赖安装、`npm run lint` 结果、环境变量说明已更新到 README/部署脚本。

## Windows 原生调试设置

### PowerShell 启动 Chrome 调试实例
```powershell
# 方式 1：npm 命令（推荐）
npm run dev:chrome        # 启动 Chrome headless
npm run mcp:endpoint      # 获取 WebSocket endpoint
npm run mcp:stop          # 停止 Chrome

# 方式 2：直接 PowerShell 脚本
pwsh scripts/devtools-mcp.ps1 start
pwsh scripts/devtools-mcp.ps1 endpoint
pwsh scripts/devtools-mcp.ps1 stop
```

### 获取 WebSocket Endpoint
```powershell
# 使用 npm 命令
npm run mcp:endpoint

# 或者直接用 PowerShell 脚本
$endpoint = pwsh scripts/devtools-mcp.ps1 endpoint
Write-Host $endpoint
```

### Chrome MCP 连接
使用返回的 WebSocket endpoint：
```powershell
chrome-devtools-mcp --wsEndpoint "ws://127.0.0.1:9222/devtools/browser/<uuid>"
```

## MCP: chrome-devtools-mcp 快速指引
- 全局安装（nvm 环境下跟 Node 版本绑定）：`npm install -g chrome-devtools-mcp`。切换 Node 版本后若命令不可用，需在对应版本下再装一次。
- 连接已运行的调试端口：`chrome-devtools-mcp --browserUrl http://127.0.0.1:9222`，或用 WebSocket `--wsEndpoint ws://127.0.0.1:9222/devtools/browser/<id>`。
- 默认使用 Windows 本地 Chrome；可通过 `$env:CHROME_BIN` 指定自定义路径。

---

## Legacy：WSL 调试方案（仅作参考）

⚠️ **已弃用**：以下方案不再作为默认工作流，仅在特殊环境参考。

### WSL 使用 Windows Chrome 远程调试
- 在 Windows PowerShell 启动独立调试实例：
  `& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --user-data-dir="C:\tmp\chrome-debug"`
- WSL 侧获取宿主机 IP 并验证端口：
  `WIN_IP=$(awk '/nameserver/ {print $2; exit}' /etc/resolv.conf)`
  `curl "http://$WIN_IP:9222/json/version"`
- 使用返回的 `webSocketDebuggerUrl`，跨主机时把其中的 `127.0.0.1` 替换为 `$WIN_IP`，如 `ws://$WIN_IP:9222/devtools/browser/...`。
- 若无法连接，检查 Windows 防火墙是否允许 9222 入站或换端口后重启上述 Chrome 命令。

### WSL 本地 Chromium
若需在 WSL 中运行 headless Chromium：
```bash
chromium-browser --headless --remote-debugging-port=9223 --remote-debugging-address=0.0.0.0 --user-data-dir=/tmp/chrome-headless --no-sandbox
```
再用 MCP 连接 `--browserUrl http://localhost:9223`。
