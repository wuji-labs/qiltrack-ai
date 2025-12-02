# 配额显示/登录跳转异常 Snapshot (2025-11-30)

## 背景 / 问题

- 用户 **xiuluart@foxmail.com** 在 Supabase DB 中有剩余额度，但首页配额显示 0，点击生成被重定向到登录。
- 现有流程：前端 `useSupabaseAuth` 维护 session；`/api/report/credits` 从 `v_user_quota` 读 `remaining_credits`；`/api/report` 先校验 session，再查视图并调用 `fn_consume_report_credit`。
- 症状提示服务器未识别 session 或视图查询失败，导致 401/0，前端按未登录处理。

## 设计目标

1. 登录用户配额展示与 Supabase `v_user_quota` 实时值一致，首屏不再错误显示 0。
2. 报告生成接口正确区分 401/429/500，避免误跳转登录，并给出可操作提示。
3. 提供可靠的配额刷新与会话刷新路径（`quotaLoaded` 标记），消除默认 0 的假空额度。
4. 增强可观测性：API 在异常时输出匿名 user_id + 状态码，方便诊断。

## 技术约束

- Next.js App Router（node runtime），Supabase Auth + RLS；配额视图 `v_user_quota` 返回 `remaining_credits`。
- 前端 `fetchCredits` → `/api/report/credits`；生成接口 `/api/report` 依赖同一视图与 RPC。
- 需兼容 test bypass（`TEST_REPORT_TOKEN`），默认生产路径不得走 mock。
- 不新增第三方依赖，沿用 `@supabase/auth-helpers-nextjs` / `@supabase/ssr`。

## 文案 key（若需新增/替换）

| key                       | zh-Hans                            | en                                                 | 说明                                  |
| ------------------------- | ---------------------------------- | -------------------------------------------------- | ------------------------------------- |
| `quota.status.mismatch`   | 检测到配额未同步，请刷新会话后重试 | Detected quota mismatch, refresh session and retry | 用于前端提示配额=0但 API 返回 401/500 |
| `quota.status.refreshing` | 正在同步会话与额度...              | Refreshing session and quota...                    | 刷新按钮状态文案                      |

## 工作拆解（交付给 Claude）

- **API 层**
  - `/api/report/credits`：返回 payload 增加 `source: "v_user_quota"`，401/500/200 区分，console warn 附 user_id/trace。
  - `/api/report`：401/429/500 时在 body 附 `code: "unauthorized" | "quota_exceeded" | "quota_fetch_failed"`，保留 Set-Cookie。
- **客户端**
  - 首页加载 credits 时设置 `quotaLoaded=true`；401 用 `quota.status.mismatch` 提示刷新会话/重新登录。
  - `ReportGeneratorSection` 根据 error.code 区分 login vs quota；`refreshQuota` 更新 `remainingQuota` 且写入 `quotaLoaded`。
  - 首页配额卡/顶部状态展示真实 `remainingQuota`，避免默认 0 误导。
- **验证**
  - 单测：mock `fetchCredits` 401/429/200，断言 `quotaLoaded` 与错误提示分支；`lib/services/api` `handleJson` 保留 error code。
  - 手测：登录后首页显示正确配额；额度>0 正常生成；额度=0 返回 429 显示额度不足，不再误跳转登录；未登录点击生成跳转登录。

## 测试要求

1. `npm run lint` 必须通过。
2. Vitest：新增/更新测试覆盖 `fetchCredits` 与 `ReportGeneratorSection` 错误分支。
3. 手动验证（生产 Supabase）：登录账号 **xiuluart@foxmail.com**，确认 `/api/report/credits` 返回 `remaining_credits=数据库值`；生成一次后额度减少且不被重定向。

## 时间线 / 产出

- 立即：Claude 认领并补充实施清单。
- D+0：完成 API/前端改动 + 单测。
- D+0：手动验证并记录到 `docs/reports/2025-11-30-quota-auth-mismatch.md`（Claude 填 CAVR）。
