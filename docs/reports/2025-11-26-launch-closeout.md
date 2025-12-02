# 2025-11-26 上线收尾报告

## Context

- 基于 `docs/decisions/2025-11-26-launch-plan.md` 的 48–72h 上线目标，五组并行完成：存储桶/RLS、额度闭环、工作流 i18n 统一、支付 CTA fallback、文档与测试补全。
- 当前基线：`main@96f0c18`，包含 WT1/WT2/WT3/WT5 全部改动。

## 完成的工作

- **额度闭环**：`/api/report/credits` 实时读取；`quotaLoaded` 避免初始 0 误阻；401/429 UX 与 CTA fallback；生成成功后强制 `refreshSession()` + `refreshQuota()`。
- **测试覆盖**：新增 `__tests__/ReportGeneratorSection.test.tsx`（6 项 UI）、`lib/services/api.test.ts`（11 项 API）；vitest 全绿。
- **Supabase 存储**：私有桶 `report-assets` 创建并配置 3 条 RLS（service_role 上传/删改，authenticated 读取）；指南 `docs/setup/supabase-bucket-setup-guide.md`。
- **工作流/i18n**：Workflow/生成器文案与徽章统一使用 i18n key；多语言补齐（quota\*、stripe fallback 文案）。
- **支付 CTA fallback**：Stripe 未接通时降级到提示/预约方案，5 语种覆盖；决策与验证文档齐备。

## 验证

- `npm run lint`：通过（WT2 报告 0 errors / 0 warnings）。
- `npm test -- --run`：通过（Test Files 8 passed | Tests 51 passed），包含 API 与生成器 UI。
- 文档归档：决策/实施/验证见 `docs/decisions/2025-11-26-t1-quota-credits.md`、`docs/decisions/2025-11-26-stripe-fallback.md`、`docs/reports/2025-11-26-t1-quota-implementation.md`、`docs/reports/2025-11-26-stripe-fallback-verification.md`、`docs/reports/2025-11-26-launch-plan-wt1.md`。

## 遗留与建议

- **端到端冒烟**：使用有效 Supabase/NextAuth 配置跑登录→生成→额度扣减→导出/复制链路，记录至 `docs/reports/<date>-launch-smoke.md`。
- **支付 T+2**：若需实付，按 `docs/design/stripe-integration-mini-design.md` 接 Stripe Checkout（月/年计入 plan/quota）；未接通时保留预约表单。
- **监控**：关注 `fn_consume_report_credit` 失败率、RLS 拒绝率；如有，补日志/报警。
- **发布动作**：准备发布说明并打 tag `v0.1.0-launch`（包含变更摘要、验证清单、已知风险）。

## 当前状态

- 分支：`main`（干净）。
- 依赖：Supabase 项目 `inmtounwqcjwsxkfnsfd` 已建私有桶与策略；环境变量样例在 `.env.local.example`。
- 风险：无阻塞；若使用新的支付流需追加测试。\*\*\*
