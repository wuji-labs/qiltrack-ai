## Investor AI

Investor AI 是一个「三分钟理解美股上市公司」的投研助手。产品基于 Next.js App Router、Finnhub 实时行情与 OpenRouter LLM，输出结构化 Markdown 报告，并支持复制、DOCX 导出以及即将上线的登录/支付/额度闭环。

### 核心能力
- **模糊搜索**：输入英文公司名或股票代码，自动补全来自 `/api/search`。
- **一键生成报告**：`/api/report` 汇总 Finnhub 数据并调度 OpenRouter，产出结构化分析。
- **额度管控**：NextAuth 登录后默认配额 1 份，后端按用户表的 `quota` / `reportsUsed` 校验，401/429 会在前端提示。
- **导出/复制**：富文本复制 + DOCX 导出，方便把报告当作正式投研底稿。
- **扩展空间**：导航、FAQ、定价等锚点已搭好，后续可快速接入支付、历史报告等功能。

### 产品定位与合规声明
- CodeX / Investor AI 仅提供“结构化信息整理”能力，帮助用户理解企业；**不提供投资建议、买卖指令或个性化判断**。
- 所有内容均基于公开数据与通用分析方法自动生成，可能存在延迟或偏差，用户需自行判断并承担风险。
- 生成的文本在后端会自动进行敏感词重写与过滤，若模型输出任何“买入/卖出/调仓”信息，将被替换为「分析检核清单」。
- 数据来源：经授权的第三方数据服务商（如 Finnhub 等）及公司公开披露的财报、公告等信息；系统不接触或传播内幕消息。
- 更详细的条款与定位说明见 [`/legal`](./app/legal/page.tsx) 页面。

## 开发指南
| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器，默认 http://localhost:3000 |
| `npm run dev:chrome` | Windows PowerShell 启动调试 Chrome（调用 `scripts/devtools-mcp.ps1 start`） |
| `npm run build` | 生成 `.next` 生产构建 |
| `npm start` | 运行生产构建 |
| `npm run lint` | ESLint（core-web-vitals） |
| `npm run test` | Vitest（jsdom），覆盖 API service 与进度条 hook |
| `npm run mcp:start` | 可选：启动 headless Chrome （Windows PowerShell，调用 `scripts/devtools-mcp.ps1 start`） |
| `npm run mcp:endpoint` | 可选：查看 headless Chrome WebSocket endpoint |
| `npm run mcp:stop` | 可选：停止 headless Chrome 进程 |
| `npm run mcp:start:bash` | Legacy：Bash 版本（需 Git Bash/GNU 工具） |
| `npm run mcp:endpoint:bash` | Legacy：Bash 版本 |
| `npm run mcp:stop:bash` | Legacy：Bash 版本 |

> 运行前请复制 `.env.local.example` 为 `.env.local` 并补齐密钥。

## 环境变量
```
FINNHUB_API_KEY=来自 Finnhub 的密钥
OPENROUTER_API_KEY=OpenRouter API Key
OPENROUTER_MODEL=openrouter/anthropic/claude-3.5-sonnet
HELICONE_API_KEY=sk-helicone-your-key
HELICONE_MODEL=gpt-4o-mini
STRIPE_SECRET_KEY=Stripe 私钥
STRIPE_WEBHOOK_SECRET=Webhook Secret
NEXT_PUBLIC_FEATURE_PAYWALL=false
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-random-string
EMAIL_SERVER=smtp://user:pass@mailtrap.io:2525
EMAIL_FROM="Investor AI <no-reply@investor.ai>"
```

## 目录结构
- `app/`：App Router 入口，`layout.tsx` 包含导航与全局样式，`page.tsx` 为核心页面。
- `app/api/`：`search`、`quote`、`report` 等 API 聚合 Finnhub/OpenRouter。
- `public/`：静态资源。
- `test-api.js`：用于单独验证 OpenAI/OpenRouter SDK。

## 注册 / 额度逻辑（当前实现）
- NextAuth（Email / Google / Apple / Azure AD）登录，Prisma SQLite 存储用户信息与会话。
- `User.quota` 默认为 1，`reportsUsed` 每次生成成功后递增，后端 `/api/report` 直接校验并返回 401/429。
- 前端拿到 401 会引导去登录，429 会提示额度耗尽；成功生成后自动刷新 session 的剩余额度。

## Reports Blog（新的文章体验）

- `/reports` 保持与主站一致的暗色玻璃主题，顶部展示结构化 Hero、分类 Pills，以及多列文章卡片；数据集中管理于 `app/reports/data.ts`，便于 Archive 与 Detail 同步。
- 点击任一卡片会导航到 `/reports/[slug]`，该路由展示大图、标签/作者、阅读时长和段落正文，打造正式博客体验。

## 调试辅助（Windows 原生）

### Windows PowerShell 流程（默认推荐）
```powershell
# 方式 1：使用 npm 命令
npm run dev:chrome        # 启动 Chrome headless（监听 9222）
npm run mcp:endpoint      # 获取 WebSocket endpoint
npm run mcp:stop          # 停止 Chrome

# 方式 2：直接调用 PowerShell 脚本
pwsh scripts/devtools-mcp.ps1 start      # 启动
pwsh scripts/devtools-mcp.ps1 endpoint   # 获取 endpoint
pwsh scripts/devtools-mcp.ps1 stop       # 停止
```

#### 环境变量配置（可选）
```powershell
$env:PORT=9222                   # Chrome 调试端口（默认 9222）
$env:CHROME_BIN="C:\...\chrome.exe"  # Chrome 路径（默认查找系统 Chrome）
$env:USER_DIR="C:\tmp\chrome-debug"  # Chrome 用户数据目录
```

#### Chrome 已运行或端口被占用的提示
- 如果 Chrome 已在监听该端口，脚本会自动提示并返回 endpoint，无需重启。
- 若需强制关闭，使用 `npm run mcp:stop`。

### Git Bash 流程（Legacy，需 GNU 工具）
如果安装了 Git Bash 并配置了 GNU 工具链，也可使用 Bash 版本：
```bash
npm run mcp:start:bash      # 启动（Bash 版本）
npm run mcp:endpoint:bash   # 获取 endpoint
npm run mcp:stop:bash       # 停止
```

---

## Legacy：WSL 调试（仅在特殊环境参考）

⚠️ **已弃用**：以下方案仅作为参考，不再作为默认工作流。

早期的跨主机方案（WSL 获取 `WIN_IP`、访问 `/mnt/c/...` 等）仅在特定场景使用。若需在 WSL 中使用本项目，请参考 [`AGENTS.md`](./AGENTS.md) 附录部分。

## 手动验证脚本
1. `npm run dev` 启动服务。
2. 打开首页，测试导航锚点（产品介绍 / 生成器 / 工作流程 / 定价 / FAQ）。
3. 输入 `NVDA`，从下拉选择生成报告；留意进度条与错误提示。
4. 点击「复制报告」「导出 DOCX」确认交互正常。
5. 再次尝试生成，确认 UI 提示“仅首份报告免费，订阅后解锁更多”（额度校验上线后替换成真实逻辑）。

## 路线图摘要
- **Phase 0**：信息架构、README、环境变量模板（当前完成）。
- **Phase 1**：导航 + 核心入口体验，突出仅首份免费（进行中）。
- **Phase 2**：NextAuth 登录、用户资料、首份免费额度校验。
- **Phase 3**：Stripe 支付、订阅与额度刷新，真正闭环。
- **Phase 4**：历史报告、分享链接、Watchlist、模板切换、AI 问答等增值能力。

更多细节见 `PLAN.md`。
