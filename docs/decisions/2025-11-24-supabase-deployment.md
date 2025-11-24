# Supabase 部署架构快照（Stage 2 → Prod）

## 背景
- 分支：`feat/supabase-integration` 已完成 Stage 2 代码（`/api/report` + `history` + `credits`，服务端 Supabase 客户端封装、配额服务、存储上传）。
- 当前状态：本地未提交改动（README/doc relocation 等）；Supabase 尚未完成“可部署”交付（schema 校准、存储桶、环境变量文档、上线流程）。
- 依赖：Next.js App Router，Tailwind v4，Vitest，仅托管 Supabase（Hosted，默认运行时）。

## 设计目标
- 仅针对托管 Supabase（Hosted）交付可部署形态，不再维护本地 Stack 文档。
- Schema 与代码、类型一致：RLS 友好，RPC/视图输出字段与 API/测试期望一致。
- 提供明确的部署/环境指引（env、CLI、存储桶创建），并补齐 README/指南跳转。
- 保持测试绕过能力（`TEST_REPORT_TOKEN`）供开发/验收。

## 技术约束
- 服务端仅可使用 Service Role Key；客户端仅暴露 anon key，遵守 RLS。
- Node 18+，Supabase CLI ≥ 2.58；存储桶需私有 + 签名 URL。
- LLM 供应：Helicone 优先，OpenRouter 兜底；至少配置其一。
- 文件命名与路径：存储桶 `report-assets/{user_id}/{report_run_id}.md`，避免泄漏。
- 部署形态：仅 Hosted 项目，必须通过 `supabase link` 指向目标实例后再执行迁移/类型生成。

## Hosted Schema 范围（需与代码/类型一致）
- `report_runs`：`id`（uuid, pk）、`user_id`（uuid, not null, ref `auth.users`）、`mode`（text）、`status`（text）、`symbol`（text）、`created_at`（timestamptz, default now）、`markdown_path`/`docx_path`（text, nullable）。
- `report_documents`：`id`（uuid, pk）、`report_run_id`（uuid, fk -> `report_runs.id`, on delete cascade）、`document_type`（text, enum-like，受控于代码）、`storage_path`（text, not null）、`created_at`（timestamptz, default now）。
- `report_credit_events`：`id`（uuid, pk）、`user_id`（uuid, not null, ref `auth.users`）、`event_type`（text, enum-like）、`delta`（integer, not null）、`metadata`（jsonb, nullable，用于审计）、`created_at`（timestamptz, default now）。
- 视图 `v_user_quota`：暴露 `user_id`、`remaining_credits`（与代码/测试期望一致）。
- RPC `fn_consume_report_credit`：输入 `p_user_id uuid`，输出包含 `remaining_credits`，逻辑与视图保持一致。

## RLS 策略（Hosted）
- `report_runs`：
  - `select/insert/update/delete` 仅允许 `auth.uid() = user_id`；`on delete cascade` 保护下游；Service Role 作为 bypass。
- `report_documents`：
  - 读取与插入必须满足存在父级 `report_runs.user_id = auth.uid()`；删除同理；Service Role bypass。
- `report_credit_events`：
  - `select/insert` 约束 `auth.uid() = user_id`；阻止跨用户读写；Service Role 用于结算/审计。
- 全局：确保 `postgres` 角色启用 RLS，Service Role 可执行 RPC/存储写入；客户端仅使用 anon key 走 `createServerClient`。

## 存储配置（Hosted）
- 桶名：`report-assets`（私有）。
- 策略：
  - 仅 Service Role 允许 `storage.objects.insert`/`update`/`delete`/`select`；
  - 客户端读取通过签名 URL（有效期受代码控制），禁用公开访问；
  - 路径规范：`report-assets/{user_id}/{report_run_id}/{document_type}.md|docx`。
- 运行时：上传由 `/api/report` 使用 Service Role 完成，下载通过签名 URL 暴露给前端。

## 交付物与任务拆解
1) **Schema & 类型校准**
   - 补齐 SQL 迁移：`report_runs`（需含 `mode`、`status`、`symbol`、`created_at`、`user_id`，可选 `markdown_path`/`docx_path`）、`report_documents`（字段应与代码 `report_run_id`/`document_type`/`storage_path` 对齐）、`report_credit_events`（`event_type`+`metadata` JSON，支持审计）。
   - RPC `fn_consume_report_credit` 返回字段与代码期望一致（`remaining_credits`），视图 `v_user_quota` 暴露 `remaining_credits`。
   - 更新 `types/database.ts` 以匹配实际 schema（避免 API/测试类型错配）。

2) **环境与部署文档**
   - README 增补 Supabase 部署段落：Hosted 推荐 + 本地选项；必需/可选 env 表；存储桶创建步骤；LLM 供应最少一项；测试 token 用法。
   - `docs/guides/README.md` / `supabase-report-stage2-cavr.md` 补“部署清单”跳转。
   - `.env.local.example` 与文档保持一致（含 `TEST_REPORT_TOKEN`、`SUPABASE_STORAGE_REPORT_BUCKET`、Helicone/OpenRouter 二选一提示）。

3) **存储与安全**
   - 创建/校验私有桶 `report-assets`，为 Service Role 开启上传/读策略，客户端仅走签名 URL。
   - 确认 RLS 不放宽：所有查询通过 RLS（`createServerClient`），Service Role 仅用于配额/存储。

4) **验证与移交**
   - 本地：`npm test`、`npm run lint`（无需 `--runInBand`），手动打通 `/api/report?symbol=AAPL&testToken=...`、`/api/report/credits`、`/api/report/history`。
   - 可选：`supabase db push`（针对本地 Stack 或 Hosted 测试项目）验证迁移。
   - 输出变更说明与风险列表；更新 PR_NOTE（如有）。

## 文案 key
- README “Supabase 部署”小节：环境表、存储桶创建、CLI 命令、测试 token 用法、Helicone/OpenRouter 至少一项。
- guides 索引项：添加 “Supabase Stage2 部署/验证” 链接。
- 免责声明继续使用现有报告模板，不新增额外文案要求。

## 测试要求
- 必跑：`npm run lint`、`npm test`。
- 手动：`/api/report`（带 testToken 与不带，验证 401/429/200）、`/api/report/credits`、`/api/report/history`。
- 可选：`supabase db push`（确认迁移可用）；Supabase Studio 检查表/视图/桶。

## 风险与缓解
- **类型与 schema 不一致**：先调 schema，再同步 `types/database.ts`，确保测试通过。
- **Service Role 泄漏**：仅 server 端使用；检查 README 警示，不写入前端配置。
- **存储桶公开**：必须私有 + 签名 URL；代码已有上传 + 签名逻辑，需验证策略。
- **LLM 未配置**：文档强调 Helicone/OpenRouter 至少一项，否则 `/api/report` 返回 500。

## 初始化命令（仅托管项目，先 link 再迁移）
```bash
git checkout feat/supabase-integration
git pull
git checkout -b feat/supabase-deployment

# 1) 连接托管项目（需已在 Supabase 控制台创建项目）
npx supabase link --project-ref <your-project-ref>

# 2) 推送迁移 + 生成类型（保持与 Hosted 实例一致）
npx supabase db push
npx supabase gen types typescript --linked --schema public > types/database.ts

# 3) 本地校验
npm run lint
npm test
```

---

@Claude
Report: docs/decisions/2025-11-24-supabase-deployment.md
Status: 需要实施
Next: 在新分支完成以下动作并提 PR：1) 编写 Supabase 迁移脚本（对齐 `report_runs/report_documents/report_credit_events` 与 RPC/视图字段），同步 `types/database.ts`；2) 更新 README 与 guides（部署/环境/存储桶/测试 token 说明），校验 `.env.local.example`；3) 跑 `npm test`、`npm run lint`，并手动验证三个 API（含 testToken）。***
