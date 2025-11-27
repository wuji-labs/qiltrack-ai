# Supabase 本地 CLI Snapshot (2025-11-27)

## 背景
- 报告 API (`app/api/report/route.ts`) 与配额服务 (`lib/services/quota.ts`) 100% 依赖 Supabase 表 / RPC / Storage。
- 团队已要求安装 Supabase CLI（见 `ENVIRONMENT.md`），但使用方式不统一，仍有人直接在 Hosted 控制台改 schema。
- 目标是做到“克隆仓库 → 启动 CLI → 更新 `.env.local` → `npm run dev`”即可复刻完整后端。

## 设计要点
1. `npx supabase start` 是唯一支持的本地入口，读取 `supabase/config.toml`，自动应用 `supabase/migrations` + `seed.sql`。
2. schema 仅由 SQL 迁移维护，`types/database.ts` 必须通过 `npx supabase gen types typescript` 生成。
3. Hosted 同步：`npx supabase link` + `db push` / `remote commit`，先本地验证再推远端，禁止直接在 Dashboard 改表。
4. `.env.local` 模板必须同时列出 Hosted / Local 两套值，方便 API、hooks、测试一键切换。
5. 最小验收固定为 `npm run lint` + `npm test`；牵涉 migrations 时，PR 描述需附 `supabase db push` 与 `gen types` 的运行结果。

## 技术约束
- Node ≥18、npm ≥8、Docker Desktop（或兼容 runtime）与 Supabase CLI ≥2.58 为硬性前提。
- `.env.local` 中 `NEXT_PUBLIC_SUPABASE_URL | NEXT_PUBLIC_SUPABASE_ANON_KEY | SUPABASE_SERVICE_ROLE_KEY | SUPABASE_STORAGE_REPORT_BUCKET | TEST_REPORT_TOKEN` 必须与当前 stack 匹配；service role key 只能在 server 端使用。
- 所有迁移/seed 文件必须 ASCII、命名 `YYYYMMDDHHMMSS_slug.sql`；禁止手改 `types/database.ts`。
- API Route 统一通过 `lib/supabase/server.ts` 暴露的 `createServerClient / createServiceRoleClient` 获取 Supabase client。

## 文案 / 产出
- README 的 Supabase 章节引用本 Snapshot，并附 CLI 命令与 `.env.local` 示例。
- 操作细节集中在 `docs/guides/supabase-local-cli.md`；状态汇报/CAVR 链接该指南即可，终端不贴长文本。
- 报告模板与免责声明文本以 `app/api/report/route.ts` 中定义为准，任何流程文档不得修改或衍生。

## 测试清单
1. `npm run lint`
2. `npm run test`
3. （可选）`curl "http://localhost:3000/api/report?symbol=AAPL&testToken=<TEST_REPORT_TOKEN>"` 验证 CLI stack 报告写入情况（结果记录到 docs/report）。
4. 若修改 schema，PR 中附 `npx supabase db push` 与 `npx supabase gen types typescript --local --schema public > types/database.ts` 的执行摘要。
