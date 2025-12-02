# Supabase 全面接入 Snapshot (2025-11-23)

## 背景 / 问题

- 现有鉴权/数据层依赖 NextAuth + Prisma + SQLite，本地文件 DB 无法在不同环境共享，quota / 报告记录通过 session 手动推导，无法提供可靠的“单一事实源”。
- 没有面向 `app/reports`、FAQ、模板、报告历史的持久化，导致内容更新要改代码，后续 Stripe 额度刷新/多设备登录也没有统一数据面。
- 缺少原生审计、安全与行级访问管控；目前的 API 只能“信任” server session，无法向客户端安全暴露查询接口，更难支持 watchlist、历史报告、通知等需要实时订阅的能力。
- 没有可复制的迁移/回滚流程：Prisma schema 与 NextAuth 耦合，既不能直接替换为 Postgres，也不能利用 Supabase CLI 的类型生成、Edge Functions、Storage。
- 即将上线的支付/额度闭环要求把 Stripe Webhook、报告扣点、文案提示写成一条流水，现在的实现会在并发场景下出现 race condition。

## 设计目标

1. Supabase 成为 auth / 数据 / 日志 / Storage 的唯一事实源，可在本地、预发、生产复用同一 schema 和迁移脚本。
2. 替换 NextAuth：login/signup 均使用 Supabase Auth（Email OTP + Google + Apple + Microsoft），`useAuth`/server 组件统一从 `createServerClient` 派生 session。
3. 报告额度与历史：所有 `/api/report` 请求必须通过 Supabase RPC 原子消费额度、写入 `report_runs` 与 Storage，客户端可安全读取个人历史。
4. 内容模块（reports gallery、FAQ、定价文案、模板 Tonality）全部改为 Supabase 表/视图，以便运营可直接在 Supabase Studio 编辑。
5. 记录 Stripe / 自助加点事件，提供审计日志 + 指标可视化，同时保持现有 LLM / Finnhub 流程不变。

## 技术约束

- Next.js 16 + React 19（App Router）。API Route 默认 Node.js runtime，仍需访问 `fetch`、OpenRouter、Finnhub；Supabase SDK 必须走 `@supabase/ssr`（server）与 `@supabase/supabase-js`（client）。
- RLS 默认开启且拒绝一切请求，除 `/api/report` 及后台脚本使用 `SUPABASE_SERVICE_ROLE_KEY` 外，其余读写都必须通过用户 session。
- 需要保留 `TEST_REPORT_TOKEN` 旁路通道，方便 CI/演示在未登录时调用 `/api/report`；旁路情况禁止写入真实 `report_runs` 但要写入审计。
- Supabase schema / migrations 使用 `supabase/migrations/<timestamp>_<name>.sql`，并通过 `supabase gen types typescript --local` 产出 `types/database.ts`，禁止手写漂移。
- 现有 Vitest/ESLint pipeline 不可破坏：新增 service 层要补单元测试并 mock 出 Supabase 客户端；`npm run lint` / `npm test` 必须绿灯才可合并。

## 系统蓝图

### 数据域与表

- `public.profiles`
  - `id uuid primary key references auth.users`
  - `email citext unique`, `display_name text`, `avatar_url text`
  - `plan text default 'free'`, `quota_limit int default 1`, `reports_used int default 0`
  - `stripe_customer_id text`, `stripe_subscription_id text`, `last_report_at timestamptz`
- `public.report_credit_events`
  - 记录额度变动：`id uuid`, `user_id uuid`, `delta int`, `reason text`, `metadata jsonb`, `actor text`, `created_at timestamptz default now()`
  - 建 materialized view `v_user_quota` 聚合 `quota_limit + sum(delta)`，供客户端展示剩余额度
- `public.report_runs`
  - `id uuid`, `user_id uuid`, `symbol text`, `tone text`, `language text`, `status text`, `model text`, `company_snapshot jsonb`, `duration_ms int`, `error text`
  - 成功时写入 `markdown_path text`（指向 Storage 对象）与 `docx_path text`
- `public.report_documents`
  - 存储生成的 Markdown/Docx 摘要（可裁剪），方便列出最近 N 次报告
- `public.report_templates`
  - 取代 `app/reports/data.ts`，字段包含 `slug`, `title`, `summary`, `tags[]`, `hero_image_url`, `sections jsonb`, `pills[]`
- `public.faq_entries` / `public.pricing_plans`
  - 让运营可在 Supabase Studio 修改 FAQ / 定价 copy
- `public.billing_subscriptions`
  - 追踪 Stripe webhook 写入：`user_id`, `plan`, `quota_bonus`, `status`, `period_end`, `raw_payload jsonb`
- Supabase Storage
  - Bucket `report-assets` (private)：Markdown / Docx / preview JSON
  - Bucket `public-media` (public)：Hero、reports 页面配图、徽标

### RPC / 触发器

- `fn_initialize_profile(p_user_id uuid, p_email text)`：Auth trigger 在 user signup 时调用，自动插入 `profiles` 并写初始 quota event。
- `fn_consume_report_credit(p_user_id uuid, p_symbol text, p_metadata jsonb) returns table(success bool, remaining int)`: 使用 `select ... for update` 对 `profiles` 与 `report_credit_events` 做原子扣减，记录原因（LLM、Finnhub payload hash）。
- `fn_record_report_run(p_run_id uuid, p_user_id uuid, p_payload jsonb)`：插入 `report_runs` 行并返回 Storage key，确保日志与文件命名一致。
- `policy profiles_rls`: allow select/update 同 user；service role 可 bypass。
- Supabase Webhook `auth.user_created`：触发 Edge Function 同步到 `profiles` & `report_credit_events`。

### 关键业务流程

1. **Auth & Session**
   - 浏览器侧 `SupabaseProvider` 建立 `createBrowserClient`，`useAuth` 改为读取 Supabase session + profile。
   - 登录页提供 Email OTP（Magic Link）和 Google/Apple/Microsoft 按钮，调用 `supabase.auth.signInWithOtp` / `signInWithOAuth`。
   - 服务端组件、`/api/*` 路由通过 `createServerClient({ cookies })` 获取 `session`；`/login` 与 `/account` 需 SSR friendly。
2. **报告生成 / 额度扣减**
   - `/api/report`
     1. 解析 `testToken`，若命中则跳过扣点但写 `report_runs` audit (user_id = `null`, mode = `test`).
     2. 非旁路请求：调用 `fn_consume_report_credit` 原子检验 quota；若返回 `success=false` 则 429。
     3. 拉取 Finnhub + 调 Helicone/OpenRouter；写入 `report_runs`（status=processing）。
     4. 成功后将 Markdown 写进 Storage (`report-assets/{user_id}/{run_id}.md`)，Docx 可沿用现有导出逻辑或在后台写 `docx` buffer。
     5. 更新 `report_runs`（status=success, markdown_path, docx_path, duration_ms），并触发 `profiles.reports_used` + `last_report_at`。
3. **报告历史 / UI**
   - 新增 `/api/report/history`（GET） 从 Supabase RLS 读取 `report_runs`（status=success），支持 `limit/offset`。
   - `ReportGeneratorSection` 调用 `history` 以渲染最近一次报告 / CTA。
4. **内容管理**
   - `/reports` page 改为 `async` server component，直接 `select * from report_templates order by published_at desc`。
   - FAQ / Pricing / Hero highlights 走 `faq_entries` / `pricing_plans` / `copy_modules` 表，语言字段 `language text` + `body jsonb`。
5. **支付 / Stripe**
   - Webhook（server action or route handler）收到事件后写入 `billing_subscriptions` + `report_credit_events`（bonus），并更新 `profiles.plan / quota_limit`。
   - Supabase cron job（pg_cron）每日检查过期订阅，回落 plan + 写 event。
6. **监控 / 分析**
   - 创建视图 `v_daily_report_usage`（date, total_runs, unique_users, quota_consumed, failures）。
   - 通过 Supabase Dashboard 或自建 `app/api/admin/metrics` (service role) 供 internal dashboard。

### 数据迁移策略

1. **准备**：冻结当前 NextAuth 登录入口，只允许已登录用户维持 session；运行脚本 `scripts/export-sqlite-users.ts` 导出 `id/email/plan/quota/reportsUsed`。
2. **Schema 部署**：使用 Supabase CLI `supabase db push` 建立表/RLS/RPC；生成最新 `types/database.ts` 并提交。
3. **导入数据**：借助 `supabase db remote commit` 或 `psql` 把导出的 CSV 插入 `profiles` + `report_credit_events`（delta = `reportsUsed * -1`），验证 `v_user_quota` 与 SQLite 数值一致。
4. **切换**：移除 NextAuth 路由/Prisma 依赖，`useAuth` 改为 Supabase；生产环境替换 env，回滚方案是保留 Prisma Schema 与 sqlite 文件一份 Snapshot。
5. **清理**：删除 `prisma/`、`lib/prisma.ts`、NextAuth 组件，更新 README/PLAN/ENV；保留 `scripts/migrate-to-supabase.ts` 记录手动迁移步骤。

### 环境变量 / 配置

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（仅 server route / webhook / scripts 使用）
- `SUPABASE_JWT_SECRET`（对齐 Supabase Auth 设置）
- `SUPABASE_STORAGE_REPORT_BUCKET=report-assets`
- `SUPABASE_DB_SCHEMA=public`
- `SUPABASE_TEST_USER_EMAIL`（端到端测试 seed）
- `NEXT_PUBLIC_ENABLE_DEV_LOGIN` 将被移除，改由 Supabase `auth.admin.createUser` 在脚本里创建测试账号

### 文案 key

- `auth.supabase.badge`: `由 Supabase Auth 托管 · 数据全程加密`
- `auth.magic.subtitle`: `我们通过 Supabase Auth 发送一次性登录链接，请在 10 分钟内完成验证。`
- `quota.banner.hint.refresh`: `额度由 Supabase 实时记录，登录即可同步所有剩余额度。`
- `quota.banner.description`: `每次生成报告都会写入 Supabase 的审计日志，方便跨设备追溯与恢复。`
- `history.empty.title`: `Supabase 尚未为你保存任何报告`
- `history.empty.caption`: `立即生成首份报告，系统会把 Markdown / Docx 安全存入 Supabase Storage，随时可重下。`

### 测试要求

1. **Unit**：为 `lib/supabase/server.ts`、`lib/supabase/client.ts`、`lib/services/quota.ts` 编写 Vitest，mock `@supabase/supabase-js`，验证 env 缺失/多实例/edge cases。
2. **Integration**：新增 `__tests__/api/report.supabase.test.ts`，通过 Supabase local stack (Docker) 或 `supabase start` + `TEST_REPORT_TOKEN` 触发真实 RPC，验证 `consume_report_credit` 正确阻止用尽场景。
3. **E2E 手动**：`npm run dev` + 本地 Supabase；执行 登录 → 生成报告 → 查看历史 → 下载 Docx 全链路，附截图 / screencast 到 CAVR。
4. **RLS**：使用 `supabase/tests/*.ts` 或 SQL 脚本，验证非本人 session 无法读取他人 `report_runs/report_documents`。
5. 所有 PR 必须附 `npm run lint` / `npm test` 输出，及 Supabase CLI 版本号（确保 schema 一致）。

### 风险 / 未决

- OAuth 凭证迁移：现有 Google/Apple/Azure 配置需要复制到 Supabase Auth，可能出现回调域名不一致，需要验证。
- 报告正文较长（> 50 KB），放在表里会膨胀；建议使用 Storage + CDN，但需评估下载延迟与权限（签名 URL）。
- 并发扣点依赖 Postgres transaction + `select for update`，需要确认 Supabase 共享计划的最大吞吐；必要时改用 Edge Function + queue。

### 实施提示

- 建议分阶段交付：① 落地 Supabase schema + CLI ；② 替换 auth + hooks；③ 重写 `/api/report` 扣点；④ 内容模块切换；⑤ 支付/审计。
- 所有脚本、SQL、CLI 输出要写入 `docs/reports/<date>-supabase-migration.md`，并把 `supabase/config.toml`/`seed.sql` 纳入版本控制。
- README / `.env.local.example` / Plan 同步新增变量及步骤。
