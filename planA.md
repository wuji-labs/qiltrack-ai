# 方案讨论 - Investor AI 扩展

## 背景

- 当前架构：Next.js 16 + React 19 + Tailwind v4，前端直连 Finnhub + Helicone/OpenRouter 生成 Markdown，Supabase 负责用户/额度/报告存储。
- 现存问题：关键协作文档存在乱码，Supabase schema 仍要求 report_runs.template_id 且无 embeddings 表，前端缺乏历史推荐与可视化，LLM 调用缺少可观测性。

## 目标

- 提升生成链路可观测性与错误定位效率。
- 提高报告复用度，减少重复 LLM 调用，支持历史相似报告推荐。
- 逐步增加可视化能力，提升可读性与决策支持。
- 控制外部数据源成本与熔断策略，避免用户侧体验波动。

## 路线与优先级

1. **P1：Langfuse/Tracing（立即）**
   - 在 `/app/api/report/route.ts` 封装 LLM/Finnhub 调用的 trace/span，记录 symbol/lang/tone/model/latency/配额结果与 Finnhub 响应状态。
   - 增补 `LANGFUSE_*` 环境变量示例并在 test bypass 模式标记 `mode:test` 避免污染生产指标。
2. **P2：pgvector 历史检索（评估后启动）**
   - 新建 `reports_embeddings` 表（report_run_id, chunk, embedding, lang, tone, created_at），选择低成本 embedding 模型；报告生成后落库并在 `/api/report` 追加“相似报告”查询链路，UI 展示 3-5 条推荐。
   - 先修复 schema：`report_runs.template_id` 需允许 NULL 或设默认模板 ID，否则当前插入会失败。
3. **P3：可视化（数据就绪后）**
   - 以 KPI 卡片 + 新闻情绪摘要为先；如需 @finos/perspective，需补充时间序列（价格/财报）数据源，再行实现表格/热力图。
4. **P4：OpenBB 数据源（待成本评估）**
   - 作为 Finnhub 补充，需评估配额与 Key 管理；在 `lib/services/api` 抽象数据源优先级与熔断策略，避免前端耦合。

## 风险与注意

- Schema 不一致：`report_runs.template_id`、缺 embeddings 表会导致生成链路写库失败，需先迁移。
- 成本与限流：Langfuse/Helicone/OpenRouter 需设超时与重试，embedding 写库需批量/速率限制。
- 编码与文案：协作文档需统一 UTF-8，界面文案继续保持 i18n，避免再次出现乱码。

## 建议的下一步

- T0：创建 schema 热修（允许 `report_runs.template_id` 为空或默认模板；补 `reports_embeddings` 表草案）。
- T1：在 `/app/api/report/route.ts` 实装 tracing，并补 `.env.local.example` / `ENVIRONMENT.md`。
- T2：设计 embeddings 写入与相似推荐 API，确认所选 embedding 模型与成本。
- T3：根据数据可用性选择简单 KPI 卡片或推迟 Perspective。
