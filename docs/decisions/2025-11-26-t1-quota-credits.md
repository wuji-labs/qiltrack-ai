# Architecture Snapshot · Credits/Quota UX (2025-11-26)

## 背景 / 范围

- main 将吸收 WT1（含 Supabase storage）；WT2 需在新分支 `feat/t1-quota` 完成额度 429 / 未登录 UI 与 Vitest。
- 现状：`ReportGeneratorSection` 仅用 inline 错误文本处理 401/429，没有明确 CTA；`lib/services/api.ts` 通过 `handleJson` 透传后端错误。
- 后端接口：
  - `GET /api/report`：无 session → 401 `{ error: "Unauthorized" }`；额度不足 → 429 `{ error: "Quota exceeded" }`；成功返回 `remainingQuota`。
  - `GET /api/report/credits`：无 session → 401；成功返回 `{ userId, credits: { remaining_credits } }`。
  - Quota 逻辑在 `lib/services/quota.ts`（view `v_user_quota` + RPC `fn_consume_report_credit`）；Storage bucket 默认 `report-assets`。

## 设计目标

1. 清晰处理 401：阻断提交，展示“未登录”提示 + CTA（登录/注册），可触发 `onRequireLogin()`。
2. 友好处理 429：显示额度用尽面板（剩余额度=0），提供“刷新额度/重试”与“查看价格/升级”行动，保持输入区可用。
3. UI 与 quota 卡片联动：登录态展示 plan/email/剩余额度；未登录展示试用提示；额度 0 时突出 badge“用尽”。
4. 流程不死锁：错误清除后可重新提交；进度条/按钮状态恢复；测试模式（testToken）可绕过登录/额度。

## 技术约束

- App Router + TS + React 19；样式 Tailwind v4 `@theme inline`。
- 主交互文件：`app/sections/ReportGeneratorSection.tsx`（依赖 `auth` props：`isAuthenticated`, `remainingQuota`, `refreshSession`, `refreshQuota?`，以及 `onRequireLogin`）。
- API 封装：`lib/services/api.ts` (`generateReport`, `fetchCredits`)；错误信息取自后端 `error` 字段。
- Supabase 依赖：session 从 cookies 读取；额度视图 `v_user_quota`；测试绕过 token：`TEST_REPORT_TOKEN` / `NEXT_PUBLIC_TEST_REPORT_TOKEN`。

## UI 方案

- 未登录提交：直接阻断，设置 error=未登录文案，调用 `onRequireLogin()`；错误区域展示 CTA（登录/注册）。
- 额度用尽：
  - 前置校验：`auth.remainingQuota <= 0` 时提示额度用尽，提供“刷新额度”/“查看价格”按钮。
  - 调用报错 429 时：捕获错误，error 区展示额度面板；调用 `auth.refreshQuota?.()` 可刷新；CTA 指向 `/pricing#quota`。
  - 清除错误后允许重新提交；保持输入值不清空。
- 顶部 quota 卡片联动：未登录显示登录提示；额度 0 显示 “用尽” badge + 升级 CTA；`refreshSession` 继续可用。
- 测试模式：若存在 testToken 且启用 `NEXT_PUBLIC_ENABLE_TEST_SEARCH`，跳过登录/额度拦截（保留 QA 通路）。

## 文案 key（新增/更新）

- `generator.alert.unregistered`：未登录提示 + CTA。
- `generator.alert.quota`：额度用尽提示 + CTA。
- `quota.badge.exhausted`：额度已用完标记。
- `quota.action.upgrade`：查看价格/升级。
- `quota.action.refresh`：刷新额度/重试。
- `quota.error.unauthorized`：401 提示。
- `quota.error.generic`：额度查询失败的 fallback。
  （在 `lib/i18n.tsx` 按现有结构新增四语翻译，复用 quota 节点命名。）

## 测试要求（Vitest）

- `lib/services/api.test.ts`：
  - `generateReport` 429 `{ error: "Quota exceeded" }` 时抛出相同 message。
  - 401/500 抛出后端 message。
  - `fetchCredits`：200 解析 `remaining_credits`；401 抛出 "Unauthorized"。
- UI 测试（建议 `__tests__/ReportGeneratorSection.test.tsx`）：
  - 未登录提交触发 `onRequireLogin`，展示未登录文案。
  - 模拟 429 抛错：显示额度用尽 UI；点击“刷新额度”调用 `refreshQuota`。
  - 错误清除后可再次提交（按钮与进度恢复）。
- 必跑：`npm run lint`、`npm test`。

## 交付 / 分支

- 待 WT1 合并后：从最新 `main` 切 `feat/t1-quota` 开发；完成后提 PR，注明基于含 storage 的 main，附 lint/test 结果。

---

@Claude

- 先确认依赖与待办；WT1 合并 main 后执行：`git checkout main && git pull` → `git checkout -b feat/t1-quota`。
- 按本 Snapshot 补齐 401/429 UI 与 Vitest；完成后跑 `npm run lint && npm test`。
- 提 PR（模板必填），在终端用 `@Codex` 三行简讯通知。
