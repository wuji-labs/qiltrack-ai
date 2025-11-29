# Snapshot：Report tracing & reuse — 2025-11-29

## 背景
- 前端：Next.js App Router + React 19 + Tailwind v4，`app/api/report/route.ts` 直接串 Finnhub + Helicone/OpenRouter 生成 Markdown，并将生成结果上传 Supabase 存储。
- 痛点：缺 tracing/集中日志，LLM/Finnhub 调用失败或延迟难以定位；`report_runs.template_id` 为 NOT NULL，当前生成链路写库会失败；缺 embeddings 表，无法做历史推荐；部分协作文档存在乱码，易再次误用。
- 约束：保持现有 API 边界与 i18n 约定；不破坏现有测试绕过逻辑（`TEST_REPORT_TOKEN`）；优先避免增加同步路径耗时。

## 目标
- 为报告生成链路提供端到端可观测性（trace/span、关键参数、错误定位）。
- 提升报告复用度：写入 embeddings，支持“相似报告”推荐，减少重复 LLM 成本。
- 在方案落地前先修复 Supabase schema，确保生成链路可写库。

## 方案

### P1：Langfuse / Tracing（立即）
- 在 `app/api/report/route.ts` 注入 trace：一个 root trace 覆盖请求全链路，子 span 包含 Finnhub 各个 fetch、LLM 调用（区分 Helicone/OpenRouter）、上传存储、Supabase 写库/配额校验。
- span metadata：`symbol`、`lang`、`tone`、`model`（LLM & embedding）、`isTestBypass`、Finnhub 响应状态码/耗时、LLM tokens/latency、配额结果、上传路径；错误时附 error message 与 request id。
- 采样与隐私：默认全采样；当 `TEST_REPORT_TOKEN` 命中时，在 trace tag 写 `mode:test`，并可降采样；避免记录用户提示、LLM 原文。
- 环境变量示例：`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`、`LANGFUSE_HOST`（或 cloud 域名）、`LANGFUSE_SAMPLING_RATE`（可选），并在 `.env.local.example` / `ENVIRONMENT.md` 补充说明。

### P2：Schema fix + pgvector（评估后启动）
- 迁移修复：
  - 将 `report_runs.template_id` 设为可空或加默认模板 id；建议 `REFERENCES ... ON DELETE SET NULL` 以避免删除模板导致失败。
  - 新建 `reports_embeddings`：`id UUID PK DEFAULT uuid_generate_v4()`、`report_run_id UUID REFERENCES report_runs(id) ON DELETE CASCADE`、`chunk_index INT`、`embedding vector`、`lang TEXT`、`tone TEXT`、`created_at TIMESTAMPTZ DEFAULT now()`；索引：`GIN` on `embedding vector`（pgvector ivfflat 需 `lists` 配置）+ `btree(report_run_id)`。
- 写入流程：
  - 生成 Markdown 成功并持久化后，使用 service role 拉取 Markdown，按 800–1000 tokens 切分，调用低成本 embedding（如 `text-embedding-3-small` 或 `nomic-embed-text` 经 OpenRouter）写入 `reports_embeddings`。
  - 将 embedding 写入放在异步路径（后台 Promise，不阻塞响应；失败仅记录 trace），并限制批量速率/超时。
- 相似推荐：
  - 在 `/api/report` 增补可选查询：如有 embedding，按 `lang`、`tone` 过滤，返回 3–5 条最近/最相关报告（`report_run_id` + 标题/时间/符号）；无数据时返回空列表。
  - UI 在报告详情/生成结果区域展示“相似报告”卡片，可点击跳转历史记录。

### P3：可视化（数据就绪后）
- 先做轻量 KPI 卡片（市值、PE、ROE、近 60 天新闻情绪摘要）依赖现有 Finnhub 数据；更重的 Perspective/热力图需补充时间序列数据源后再启。

### P4：数据源补充（待评估）
- OpenBB 作为 Finnhub 补充，需在 `lib/services/api` 抽象数据源优先级/熔断，并明确 Key/成本与超时重试策略。

## 文案 key（预留）
- `report.similar.heading`: `相似报告` / `Similar reports`
- `report.similar.empty`: `暂无可推荐的历史报告` / `No similar reports yet`
- `report.similar.open`: `查看` / `View`
- `report.trace.hint`: `遇到问题请提供 traceId 便于排查` / `Share traceId for debugging`

## 测试要求
- 必跑 `npm run lint`、`npm test`；新增 tracing/util 逻辑需添加单测（可用 TEST_REPORT_TOKEN 模式验证 trace 标签）。
- 对 `/api/report` 在测试模式调用：验证无 session 时 401、缺 key 时 500、quota 用尽 429；记录的 trace/spans 包含 symbol/lang/tone/latency。
- 迁移后通过 Supabase CLI/DB 检查：`report_runs.template_id` 可空或默认值生效；`reports_embeddings` 表/索引存在，写入/查询向量成功。
- 推荐接口：当 embeddings 为空时返回空列表；存在 embeddings 时按 lang/tone 过滤后返回有限条目且顺序稳定。

## 风险 / 注意
- 升级 pgvector 及 ivfflat 索引需要 ANALYZE；需在迁移脚本注明。
- Tracing 不应落敏感提示/LLM 原文；仅记录结构化参数/耗时/错误。
- 嵌入写入置于异步路径，避免拖长 API 响应；失败仅记录，不影响主流程。
- 修复 encoding：新文档与 code 注释统一 UTF-8，避免再次出现乱码。

## 下一步
1) 先出数据库迁移草案（template_id 允许 NULL + `reports_embeddings`），提交 SQL 供评审。  
2) 在 `app/api/report/route.ts` 接入 Langfuse tracing，补 env 文档。  
3) 评估/选型 embedding 模型与预算，设计 chunk 策略与 Supabase 查询接口；再接 UI 的“相似报告”模块。  
4) 数据可视化与 OpenBB 接入根据数据准备度再行决策。
