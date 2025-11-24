## Investor AI

Investor AI 是一个「三分钟理解美股上市公司」的投研助手。产品基于 Next.js App Router、Finnhub 实时行情与 OpenRouter LLM，输出结构化 Markdown 报告，并支持复制、DOCX 导出以及即将上线的登录/支付/额度闭环。

### 协作规范入口
- 主协作手册：`docs/guides/codex-claude-collaboration.md`（根目录 `CODEX_CLAUDE_COLLAB.md` 为跳转 stub）
- 速查版：`docs/guides/codex-claude-quickstart.md`

### 核心能力
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

> 运行前请复制 `.env.local.example` 为 `.env.local` 并补齐密钥。

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

## Supabase 部署（Hosted 实例）

### 前置条件
- Node 18+，Supabase CLI ≥ 2.58
- Hosted Supabase 项目已创建（[Supabase Dashboard](https://app.supabase.com)）
- Finnhub API Key（免费或付费）
- LLM 供应商：Helicone（优先）或 OpenRouter（兜底）

### 部署步骤

#### 1. 初始化 Supabase 连接
```bash
# 登录 Supabase CLI
npx supabase login

# 连接 Hosted 项目（替换 <your-project-ref>）
# 项目 ref 见 Dashboard → Settings → General → Project Ref
npx supabase link --project-ref <your-project-ref>
```

#### 2. 推送数据库迁移
```bash
# 将本地 migrations/ 推送到 Hosted 实例
npx supabase db push

# 生成 TypeScript 类型（与实际 schema 同步）
npx supabase gen types typescript --linked --schema public > types/database.ts
```

#### 3. 创建存储桶
在 [Supabase Dashboard](https://app.supabase.com) → Storage 中创建私有桶：
- **桶名**：`report-assets`
- **设为私有**：勾选 "Private"
- **RLS 策略**：仅 Service Role 可上传；客户端通过签名 URL 读取

#### 4. 配置环境变量
复制 `.env.local.example` 为 `.env.local`，补齐以下值：

```bash
# Supabase（从 Dashboard → Settings → API 获取）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_REPORT_BUCKET=report-assets

# Finnhub（免费 API Key: https://finnhub.io）
FINNHUB_API_KEY=your-finnhub-key

# LLM 供应商（至少配置其一）
# Helicone（优先，支持监控与日志）
HELICONE_API_KEY=your-helicone-key
HELICONE_MODEL=gpt-4o-mini

# OpenRouter（兜底）
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openrouter/anthropic/claude-3.5-sonnet

# Auth（任意随机字符串）
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# 测试 Token（开发/验证使用，任意值）
TEST_REPORT_TOKEN=test-token-12345
```

#### 5. 本地校验
```bash
npm run lint   # 检查代码风格
npm run test   # 运行单元与集成测试
npm run dev    # 启动开发服务器
```

#### 6. 手动 API 验证
```bash
# 测试报告生成（需 LLM 配置）
curl "http://localhost:3000/api/report?symbol=AAPL&testToken=test-token-12345"

# 查询额度（需登录 Session，返回 { userId, credits: { remaining_credits: number } }）
curl -H "Cookie: ..." "http://localhost:3000/api/report/credits"

# 查询历史报告（返回报告列表与分页信息）
curl -H "Cookie: ..." "http://localhost:3000/api/report/history"

# 验证 401（未授权） / 429（额度耗尽） / 200（成功）
```

### 常见问题
- **部署失败**：检查 CLI 是否已 `link` 到项目，且网络连接正常。
- **类型错误**：运行 `npx supabase gen types typescript --linked > types/database.ts` 重新生成。
- **存储上传失败**：确认桶为私有，Service Role 策略已启用。
- **额度查询返回 null**：检查 `v_user_quota` 视图是否存在，及 RLS 策略。

更详细的部署与故障排查见 `docs/guides/supabase-report-stage2-cavr.md`。

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

## 路线图摘要
- **Phase 0**：信息架构、README、环境变量模板（当前完成）。
- **Phase 1**：导航 + 核心入口体验，突出仅首份免费（进行中）。
- **Phase 2**：NextAuth 登录、用户资料、首份免费额度校验。
- **Phase 3**：Stripe 支付、订阅与额度刷新，真正闭环。
- **Phase 4**：历史报告、分享链接、Watchlist、模板切换、AI 问答等增值能力。

更多细节见 `PLAN.md`。
