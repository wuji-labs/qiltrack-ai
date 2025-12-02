# Supabase 报告工作流 Stage 2 Snapshot（2025-11-24）

## 背景 / 问题

- Stage 1 已完成 Supabase Schema + Auth Hook + CLI 初始化，但 `/api/report` 仍使用 NextAuth + Prisma + SQLite，导致额度扣减、日志与历史记录无法落在 Supabase 的“单一事实源”。
- 报告生成 API 缺少原子化额度消费（`fn_consume_report_credit`）与 Storage 写入，Quota UI 与历史页也无法读取最新 Supabase 数据；当前实现无法满足 Snapshot 中对审计、跨设备同步的要求。
- 现有 `TEST_REPORT_TOKEN` 旁路逻辑、LLM/Finnhub 调用、Markdown/DOCX 生成流程需要与 Supabase RPC/Storage 协同，必须重新设计 service 层，避免把 Supabase 逻辑散落在组件内。
- Stage 2 需要把报告 API、额度查询、历史读取切换到 Supabase，同时保留 `useSupabaseAuth` 已实现的 session 状态，作为 Stage 3（内容模块）与 Stage 4（支付/审计）的基础。

## 设计目标

1. `/api/report` 完整改造：使用 Supabase server client + RPC `fn_consume_report_credit` 扣点，成功时写入 `report_runs`、`report_documents` 并上传 Markdown/DOCX 到 Storage `report-assets/`.
2. 新增 `/api/report/history`（GET）与 `/api/report/credits`（GET）：利用 Supabase RLS 直接读取 `report_runs` / `v_user_quota`，供前端展示剩余额度与最近报告。
3. 服务端与客户端共享统一的 Supabase service：封装 `createServerClient(cookies)`、`createServiceRoleClient()`、Storage 上传、签名 URL 生成，避免重复实例化。
4. 保持 `TEST_REPORT_TOKEN` 旁路：旁路请求跳过扣点并写入审计记录（`report_runs` 中标记 `mode = 'test'`），同时禁止写入真实用户数据。
5. 维持现有 LLM / Finnhub 流程（Helicone/OpenRouter + Finnhub API），在 Supabase 持久化公司快照、生成摘要和剩余额度，确保报表历史可追溯。

## 技术约束

- Next.js 16（App Router）、React 19，API Route 默认 Node runtime；Supabase SDK 必须使用 `@supabase/ssr`（server）+ `@supabase/supabase-js`（client），禁止在 route handler 里直接创建匿名 client。
- `fn_consume_report_credit`、`fn_record_report_run`、`report_credit_events` 依赖 Supabase RLS，除 service role 以外必须通过用户 session；API handler 只能通过 `createServerClient({ cookies })` 获取 session，service role key 仅限扣点与审计写入。
- Storage Bucket：`report-assets`（private），Markdown/DOCX 需以 `{user_id}/{run_id}.md|.docx` 命名；需返回签名 URL 或路径供客户端下载。
- 环境变量：延用 `.env.local` 中的 Supabase 配置，并新增 `SUPABASE_STORAGE_REPORT_BUCKET`（若 Stage 1 未落地则补充），严禁把 service role key 揭露到客户端。
- 需兼容现有 Helicone/OpenRouter/Finnhub 速率限制，确保 Supabase 写入失败时能回滚（使用事务或顺序保障），避免扣点成功但报告写入失败。

## 文案 / UI Key

- `history.banner.title`: `Supabase 已为你保留最近的报告`
- `history.banner.subtitle`: `每次生成都会写入审计日志与 Storage，可随时回溯`
- `quota.refresh.cta`: `刷新额度`
- `quota.refresh.toast.success`: `额度已与 Supabase 同步`
- API 错误提示：`"Quota exceeded" → "Supabase 配额不足，请查看账户页"`
- History 空状态：`"暂未生成报告"`、`"登录后 Supabase 将展示完整历史"`

## 测试要求

1. **Unit（Vitest）**
   - `lib/supabase/server.ts`: mock `@supabase/ssr`，校验 env 缺失、cookies 注入、service role 分支。
   - `lib/services/quota.ts`: mock Supabase RPC，验证成功/失败/旁路模式的额度计算。
   - Markdown/DOCX Storage helper：mock `supabase.storage.from().upload()`，确保命名、ACL、错误处理。
2. **Integration**
   - `__tests__/api/report.supabase.test.ts`: 使用 Vitest + MSW mock Supabase RPC（或本地 Supabase stack，如果可用）验证：无 session、quota 用尽、成功生成、Storage 失败回滚。
   - `__tests__/api/report.history.test.ts`: mock server client，验证 RLS 查询与分页。
3. **Manual / CAVR**
   - 本地 `npm run dev` + `npx supabase start`：执行登录 → 生成报告 → 下载 Markdown/DOCX → 查看历史；在 CAVR 中附命令及截图。
   - 记录 `supabase --version`，并在 PR 说明 `npm run lint` / `npm test` 输出。
4. **回归**
   - Helicone/OpenRouter/Finnhub mock 仍需通过现有 `lib/services/api` 测试。
   - 保证 `TEST_REPORT_TOKEN` 流程继续可用（通过 header/query 触发），并在日志中打标签。
