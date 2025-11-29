# Report: observability & reuse impl（2025-11-29）

## Implementation Checklist
- 环境：`app/api/report/route.ts` 引入 Langfuse，配置 `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST/LANGFUSE_SAMPLING_RATE`，同步 `.env.local.example` 与 `ENVIRONMENT.md`；兼容 `TEST_REPORT_TOKEN`。
- Tracing：为 `/api/report` 整条链路建 root trace，子 span 覆盖 Finnhub fetch、LLM（OpenRouter/Helicone）、Supabase upsert、embedding 写入，统一 tags：`symbol/lang/tone/model/isTestBypass/requestId`，错误写入 span error。
- Migration：`report_runs.template_id` 改为可空 + `ON DELETE SET NULL`，新建 `reports_embeddings` 表及索引，跑 `ANALYZE`。
- Embedding 流程：Markdown 生成成功后按 800–1000 tokens、100–150 overlap 切块，调用低成本 embedding（默认 `text-embedding-3-small`，`OPENROUTER_EMBEDDING_MODEL` 可覆盖），异步写入 `reports_embeddings`，失败仅记 trace。
- 相似报告：`/api/report` 支持返回最近 3 条相似报告（lang/tone 过滤、向量检索，排除当前 run），前端结果卡片展示 “Similar reports” 链接列表。
- 测试：新增 tracing util、embedding 分块/入库单测；运行 `npm run lint`、`npm test`。

## 迁移 SQL（Supabase）
```sql
-- extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- allow null + safer FK
alter table public.report_runs
  alter column template_id drop not null,
  alter column template_id set default null;
alter table public.report_runs
  drop constraint if exists report_runs_template_id_fkey;
alter table public.report_runs
  add constraint report_runs_template_id_fkey
  foreign key (template_id) references public.templates(id) on delete set null;

-- embeddings table
create table if not exists public.reports_embeddings (
  id uuid primary key default uuid_generate_v4(),
  report_run_id uuid not null references public.report_runs(id) on delete cascade,
  chunk_index int not null,
  embedding vector(1536) not null,
  lang text,
  tone text,
  created_at timestamptz not null default now()
);

alter table public.reports_embeddings
  add constraint reports_embeddings_report_run_chunk_uniq
  unique (report_run_id, chunk_index);

create index if not exists reports_embeddings_report_run_id_idx
  on public.reports_embeddings(report_run_id);
create index if not exists reports_embeddings_embedding_ivfflat
  on public.reports_embeddings using ivfflat (embedding vector_l2_ops) with (lists = 100);
analyze public.reports_embeddings;
```
- 若改 embedding 模型需同步调整 `vector(<dim>)` 与 ivfflat 索引参数。
- ivfflat 索引需在数据量 >1k 向量后使用，并在构建后执行 `set ivfflat.probes = <N>`（建议 4–10）按延迟/精度调优；冷启动先走 seq scan 或关闭 ivfflat。

## Tracing 方案
- SDK：`langfuse-node` 单例初始化；采样率取 `LANGFUSE_SAMPLING_RATE`（默认 1.0），`TEST_REPORT_TOKEN` 时 trace tag 写 `mode:test` 并可强制采样。
- 结构：root trace 覆盖 handler；子 spans：`finnhub.quote`、`finnhub.news`（含 status/code/duration）、`llm.generate`（model/provider/tokens/latency/prompt_hash）、`supabase.upsert`、`supabase.embedding_insert`。
- 数据：统一 tags `symbol/lang/tone/model/isTestBypass/requestId`；不记录原始 prompt、敏感公司字段（只保留 symbol/lang/tone 等摘要/哈希）；仅写数字/枚举，排除 PII。
- 失败与超时：各环节异常记录 error span，主流程按既有逻辑返回 500/429；embedding 失败仅记 span，不影响响应。

## Embedding 设计
- 模型：默认 `text-embedding-3-small`（OpenRouter），可用 `OPENROUTER_EMBEDDING_MODEL` 切换 `nomic-embed-text` 等；建议 2–4 并发调用。
- 切块：对最终 Markdown 语义分段，目标 800–1000 tokens，overlap 100–150；字段落库 `chunk_index/lang/tone/embedding`。
- 写入：使用 service role 在 `/api/report` 后置异步 Promise 写入 `reports_embeddings`（声明 `export const runtime = "nodejs";`，与边缘隔离），失败不抛出；关联 root trace span；需要服务端 key；upsert 语义：`on conflict (report_run_id, chunk_index) do update set embedding = excluded.embedding, lang = excluded.lang, tone = excluded.tone, created_at = now()`
- 检索 SQL：
  ```sql
  select report_run_id
  from public.reports_embeddings
  where report_run_id <> $4
    and (lang is null or lang = $1)
    and (tone is null or tone = $2)
  order by embedding <-> $3, created_at desc
  limit 3;
  ```
  `$3` 为向量，`$4` 为当前 run id；无数据返回空数组；结果附带标题/时间用于 “Similar reports” 展示。

## Verification
- 跑 `npm run lint`、`npm test`；新增单测覆盖 tracing tags 与 embedding 分块。
- Supabase CLI/DB 检查：`report_runs.template_id` 允许 NULL + 默认，`reports_embeddings` 表与索引存在，插入/查询成功。

## Risks / Notes
- ivfflat 需 `ANALYZE`，并在低负载窗口执行；lists 可按数据量再调。
- 避免在 trace 中记录原始 prompt，防泄露；采样率可调低生产开销。
- embedding 写入在异步路径，注意 Promise 未捕获错误要落地 span。
