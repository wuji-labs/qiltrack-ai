## Investor AI

Investor AI 是一个「三分钟理解美股上市公司」的投研助手。产品基于 Next.js App Router、Finnhub 实时行情与 OpenRouter LLM，输出结构化 Markdown 报告，并支持复制、DOCX 导出以及即将上线的登录/支付/额度闭环。

---

## 📚 必读文档 Top 5

**新成员请按顺序阅读以下文档：**

1. **[老板操作手册](docs/guides/BOSS-OPERATION-MANUAL.md)** - 完整的多 AI 并行开发流程
2. **[Codex-Claude 协作手册](CODEX_CLAUDE_COLLAB.md)** - 唯一权威协作规范
3. **[组织架构](docs/guides/organization-structure.md)** - HQ 和各组的角色与职责
4. **[Worktree 多组协作](docs/guides/worktree-multi-team.md)** - Git worktree 使用指南
5. **[任务看板](docs/plans/workstreams.md)** - 当前所有任务状态

**速查版**：[Codex-Claude 快速入门](docs/guides/codex-claude-quickstart.md)

---

## 🎯 核心能力
- **模糊搜索**：输入英文公司名或股票代码，自动补全来自 `/api/search`。
- **一键生成报告**：`/api/report` 汇总 Finnhub 数据并调度 OpenRouter，产出结构化分析。
- **额度管控**：NextAuth 登录后默认配额 1 份，后端按用户表的 `quota` / `reportsUsed` 校验，401/429 会在前端提示。
- **导出/复制**：富文本复制 + DOCX 导出，方便把报告当作正式投研底稿。
- **扩展空间**：导航、FAQ、定价等锚点已搭好，后续可快速接入支付、历史报告等功能。

### 产品定位与合规声明
- CodeX / Investor AI 仅提供"结构化信息整理"能力，帮助用户理解企业；**不提供投资建议、买卖指令或个性化判断**。
- 所有内容均基于公开数据与通用分析方法自动生成，可能存在延迟或偏差，用户需自行判断并承担风险。
- 生成的文本在后端会自动进行敏感词重写与过滤，若模型输出任何"买入/卖出/调仓"信息，将被替换为「分析检核清单」。
- 数据来源：经授权的第三方数据服务商（如 Finnhub 等）及公司公开披露的财报、公告等信息；系统不接触或传播内幕消息。
- 更详细的条款与定位说明见 [`/legal`](./app/legal/page.tsx) 页面。

## 开发指南

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器，默认 http://localhost:3000 |
| `npm run build` | 生成 `.next` 生产构建 |
| `npm start` | 运行生产构建 |
| `npm run lint` | ESLint（core-web-vitals） |
| `npm run test` | Vitest（jsdom），覆盖 API service 与进度条 hook |
| `npm run env:check` | 检查开发环境是否满足要求 |
| `npm run pr:ready` | 一键验证代码质量（lint + test） |

> 运行前请复制 `.env.local.example` 为 `.env.local` 并补齐密钥。

### 环境要求

- **Node.js** 18.0.0+ （推荐 v20.19.5+）
- **npm** 8.0.0+ （推荐 10.8.2+）
- **Git** 2.40.0+

**首次使用，请运行环境检查**：
```bash
npm run env:check
```

详见 [`ENVIRONMENT.md`](./ENVIRONMENT.md) 获取完整的环境配置指南。

### SSH 配置（推送代码）

本仓库使用 SSH 进行 Git 推送，请按以下步骤配置本地 SSH key：

#### 1. 生成 SSH key（若未生成）
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# 提示时直接回车（使用默认路径 ~/.ssh/id_ed25519，不设密码短语）
```

#### 2. 启动 SSH agent 并添加密钥
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

#### 3. 获取并添加公钥到 GitHub
```bash
cat ~/.ssh/id_ed25519.pub
# 复制输出的公钥
```

然后打开 [GitHub SSH Keys 设置](https://github.com/settings/keys)：
- 点击 **New SSH key**
- Title 填入 "Local Dev Machine"（或自定义名称）
- Key type 选择 **Authentication Key**
- 粘贴上面的公钥到 Key 字段
- 点击 **Add SSH key**

#### 4. 验证 SSH 连接
```bash
ssh -T git@github.com
# 应返回：Hi <username>! You've successfully authenticated...
```

#### 5. 推送代码
```bash
# 首次推送需要设置上游分支
git push --set-upstream origin <branch-name>

# 之后可直接用
git push
```

## 环境变量

### 核心配置（必需）
| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `FINNHUB_API_KEY` | Finnhub API 密钥（行情数据） | `demo` / 真实密钥 |
| `NEXTAUTH_URL` | 应用地址 | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth 密钥（任意随机字符串） | `openssl rand -base64 32` |

### LLM 供应商（至少配置其一）
| 环境变量 | 说明 | 优先级 |
|---------|------|--------|
| `OPENROUTER_API_KEY` | OpenRouter API Key | 兜底 |
| `OPENROUTER_MODEL` | OpenRouter 模型 | 兜底 |
| `HELICONE_API_KEY` | Helicone API Key（可选，用于监控） | 优先 |
| `HELICONE_MODEL` | Helicone 模型 | 优先 |

### Supabase 部署（Hosted 实例）
| 环境变量 | 说明 | 获取位置 |
|---------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Hosted 项目 API URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公钥（客户端用） | Supabase Dashboard → Settings → API → Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务密钥（服务端用） | Supabase Dashboard → Settings → API → Service role key |
| `SUPABASE_STORAGE_REPORT_BUCKET` | 存储桶名 | 默认 `report-assets`（需先创建） |
| `TEST_REPORT_TOKEN` | 测试报告 Token（开发/验证使用） | 任意字符串 |

### 可选配置
| 环境变量 | 说明 |
|---------|------|
| `STRIPE_SECRET_KEY` | Stripe 私钥（支付功能） |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 密钥 |
| `EMAIL_SERVER` | SMTP 服务器地址（邮件提醒） |
| `EMAIL_FROM` | 发件地址 |

参考示例：[`.env.local.example`](./.env.local.example)

## 目录结构
- `app/`：App Router 入口，`layout.tsx` 包含导航与全局样式，`page.tsx` 为核心页面。
- `app/api/`：`search`、`quote`、`report` 等 API 聚合 Finnhub/OpenRouter。
- `public/`：静态资源。
- `test-api.js`：用于单独验证 OpenAI/OpenRouter SDK。

## Supabase ?????????? CLI

> TL;DR????????? Supabase Hosted ????????????????? Supabase CLI + Docker Stack??????? `docs/guides/supabase-local-cli.md`.

### ???????
- Node 18+ ?? npm 10+
- Docker Desktop ?? container runtime?`supabase start` ????
- Supabase CLI ?2.58?`npm install -g supabase` ?? `npx supabase <cmd>` ??????
- Finnhub / Helicone / OpenRouter API Key ?? `.env.local` ?? ready

### Hosted ?????
1. **CLI ??? + ???????**
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>   # Dashboard Settings > General > Project Ref
   ```
2. **??? schema ?? TypeScript ?????**
   ```bash
   npx supabase db push                                # ???? supabase/migrations
   npx supabase gen types typescript --linked --schema public > types/database.ts
   ```
3. **Storage ?????**?Dashboard ? Storage ? `report-assets`?Private???? Service Role ?????????????
4. **Hosted `.env.local` ?????**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   SUPABASE_STORAGE_REPORT_BUCKET=report-assets
   FINNHUB_API_KEY=<finnhub-key>
   HELICONE_API_KEY=<helicone-optional>
   HELICONE_MODEL=gpt-4o-mini
   OPENROUTER_API_KEY=<openrouter-optional>
   OPENROUTER_MODEL=openrouter/anthropic/claude-3.5-sonnet
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=http://localhost:3000
   TEST_REPORT_TOKEN=test-token-12345
   ```
5. **??????**?`npm run lint && npm test && npm run dev`???? `/api/report` / `history` / `credits` cURL ?? 401 / 429 / 200 ?????

### ???? CLI ???????
1. **???? Docker Stack**
   ```bash
   npx supabase start      # ???????? Postgres/Auth/Storage
   npx supabase status     # ??? API URL + anon/service_role key
   ```
2. **???? `.env.local`??????? localhost ????**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<local-service-role>
   SUPABASE_STORAGE_REPORT_BUCKET=report-assets
   TEST_REPORT_TOKEN=local-test-token
   ```
3. **?????/???? CLI**?
   ```bash
   npm run lint && npm test && npm run dev
   curl "http://localhost:3000/api/report?symbol=AAPL&testToken=local-test-token"
   ```
   ???? JSON ?? `remainingQuota` ?? `report` ??????? locally ???
4. **Schema ???? workflow**?
   ```bash
   npx supabase migration new add_report_fields
   # ?? supabase/migrations/<timestamp>_add_report_fields.sql
   npx supabase db push
   npx supabase gen types typescript --local --schema public > types/database.ts
   ```
5. **????? Hosted**????? link???
   ```bash
   npx supabase db push --linked
   npx supabase gen types typescript --linked --schema public > types/database.ts
   ```
6. **???/????????**?`npx supabase stop` ?? `npx supabase db reset`?CLI ????? `supabase/config.toml` ?????? seed ?????

### ???????????
- `docs/guides/supabase-local-cli.md`???? CLI ???? env ??????????????????????????
- `docs/guides/supabase-report-stage2-cavr.md`?Stage2 CAVR ?????????
- ?????????
  - CLI ??? `link` ??? ? ?????????????????
  - TypeScript ?????? ? ???? `npx supabase gen types ...` ?????????
  - Storage 404 ? ??? bucket ? Private ?? Service Role Key ?????
  - `v_user_quota` ??? ? ??? migrations ????????? stack ?? `npx supabase db push` ?????????????????
## 注册 / 额度逻辑（当前实现）
- NextAuth（Email / Google / Apple / Azure AD）登录，Prisma SQLite 存储用户信息与会话。
- `User.quota` 默认为 1，`reportsUsed` 每次生成成功后递增，后端 `/api/report` 直接校验并返回 401/429。
- 前端拿到 401 会引导去登录，429 会提示额度耗尽；成功生成后自动刷新 session 的剩余额度。

## Reports Blog（新的文章体验）

- `/reports` 保持与主站一致的暗色玻璃主题，顶部展示结构化 Hero、分类 Pills，以及多列文章卡片；数据集中管理于 `app/reports/data.ts`，便于 Archive 与 Detail 同步。
- 点击任一卡片会导航到 `/reports/[slug]`，该路由展示大图、标签/作者、阅读时长和段落正文，打造正式博客体验。

## 手动验证脚本
1. `npm run dev` 启动服务。
2. 打开首页，测试导航锚点（产品介绍 / 生成器 / 工作流程 / 定价 / FAQ）。
3. 输入 `NVDA`，从下拉选择生成报告；留意进度条与错误提示。
4. 点击「复制报告」「导出 DOCX」确认交互正常。
5. 再次尝试生成，确认 UI 提示"仅首份报告免费，订阅后解锁更多"（额度校验上线后替换成真实逻辑）。

## 调试工具与 MCP
- 推荐直接使用浏览器 DevTools；如需远程或脚本化调试，可启用 Chrome DevTools MCP（`docs/guides/chrome-devtools-mcp-guide.md`）。
- 需要查官方文档时，可使用 Context7 MCP（`docs/guides/context7-mcp-guide.md`）搜索/拉取库的 API 参考。
- 团队成员在使用 MCP 前需确认本地环境满足要求，并避免多个实例竞争同一浏览器进程。

## 路线图摘要
- **Phase 0**：信息架构、README、环境变量模板（当前完成）。
- **Phase 1**：导航 + 核心入口体验，突出仅首份免费（进行中）。
- **Phase 2**：NextAuth 登录、用户资料、首份免费额度校验。
- **Phase 3**：Stripe 支付、订阅与额度刷新，真正闭环。
- **Phase 4**：历史报告、分享链接、Watchlist、模板切换、AI 问答等增值能力。

更多细节见 `PLAN.md`。