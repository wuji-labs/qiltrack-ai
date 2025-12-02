# CAVR：report embeddings migration — 2025-11-29

## Context

- 生成链路在缺省模板时会因 `report_runs.template_id` NOT NULL 写库失败，且模板被删除无法级联为 NULL。
- 缺少 embeddings 表，无法落盘向量用于“相似报告”推荐或复用。
- Snapshot 要求先修复 schema，再接入 tracing/embedding 流程。

## Actions

- 新增迁移 `supabase/migrations/20251129000005_report_embeddings_and_template_nullable.sql`：
  - 引入 `vector` 扩展。
  - 将 `report_runs.template_id` 改为可空，外键调整为 `ON DELETE SET NULL`。
  - 创建 `reports_embeddings`（id/report_run_id/chunk_index/lang/tone/embedding vector(1536)/created_at），无默认 chunk_index，约束 `(report_run_id, chunk_index)` 去重，btree 索引 + ivfflat(cosine，lists=100)，附带 `ANALYZE`。
  - 启用 RLS；service_role 全权限；用户按所属 run 只读。
  - 备注：更换 embedding 维度需同步调整列定义与索引。
- 修复 `20251124000002_align_hosted_schema.sql`：用 DO 块按 matview/view 检测并删除 `v_user_quota`，避免本地 reset 因对象类型不符报错。
- 本地执行 `supabase start`（已在跑）+ `supabase db reset` 成功；提示 ivfflat 数据量少；repo 无 seed.sql。

## Verification

- 未跑 `npm run lint`、`npm test`（仅 SQL 迁移修改）。
- 本地：`supabase db reset` 成功，ivfflat 创建提示数据量少。

## Risks

- 向量维度固定 1536；如改用 2048（如 nomic），需调整列/索引并重建数据。
- ivfflat 需足够数据且 `ANALYZE` 后才生效；lists/probes 需随数据量调优。
- 上层代码若仍假定模板必填，需要同步放宽校验逻辑，避免请求层报错。
