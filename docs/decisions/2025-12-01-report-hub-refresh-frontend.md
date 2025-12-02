# Report Hub Refresh 前端落地 Snapshot (2025-12-01)

## 背景

- 后端（feature/report-hub-refresh）已完成 migration 20251201000001、5 个新 API（availability/popular/admin runs 等）、i18n 文案与测试脚本。
- 前端现状：`/reports` 仍为种子数据+基础筛选；生成页无复用提示；热门/我的报告/排序/Paywall/管理员批量下架尚未接入。
- 目标：按决策文档《2025-12-01-report-hub-refresh》完成报告中心体验更新，并接通后端新接口。

## 设计目标

1. 报告中心 Hero CTA 更新为「热门公司 / 我的报告 / 返回首页」，并跳转正确 anchor/路由。
2. 列表支持「最新/最热门」排序，热门卡片显示标记；热门数据调用 `/api/report/popular`。
3. 「我的报告」在 `/reports` 内嵌 tab/section，复用生成页的详情/导出 UI，数据来自 `/api/report/history`。
4. 复用弹窗：生成前调用 `/api/report/availability`，7 天内有可复用则弹窗提供「查看历史（不扣额度）」与「生成最新（扣额度）」选项。
5. Paywall：未登录访问「我的报告」提示登录；非会员点击热门详情时出现高阶提醒（使用 i18n `reports.paywall.premium`）。
6. 管理员界面：在前端提供批量下架 30 天前热门的入口，调用 `/api/admin/runs/unfeature-bulk`（olderThanDays=30），并刷新列表。

## 技术约束

- Next.js App Router + TypeScript + Tailwind v4 `@theme inline`；保持现有视觉风格与动效。
- Auth 复用 `useSupabaseAuth`：admin 识别来源 `profiles.plan='admin'` 或邮箱后缀 `@investor.ai`（与后端一致）。
- API 需传递 lang/mode，与后端默认 `mode=production` 对齐；错误态需回退到 seed 数据。
- 前端不得写入/暴露密钥；Paywall 为前端拦截，不影响后端 RLS。
- 保持种子兜底逻辑，避免接口不可用时白屏。

## 文案 key

- Hero：`reports.page.hero.cta`（热门公司）、`reports.page.hero.myReports`、`reports.page.hero.backHome`、`reports.page.hero.myReports.cta`。
- 排序：`reports.sort.latest` / `reports.sort.popular`。
- 复用弹窗：`reports.reuse.title` / `reports.reuse.sub` / `reports.reuse.viewHistory` / `reports.reuse.regenerate`。
- Paywall：`reports.paywall.premium`。
- 管理：`reports.admin.manage`、`reports.admin.unfeature.confirm`。

## 方案与接口

- 报告中心页面
  - Hero CTA：按钮跳转 `#popular`、`#my-reports`、`/`。`#popular` section 使用热门列表；`#my-reports` section 懒加载历史。
  - 排序 tabs：latest 调用 `/api/report/posts`（现有），popular 调用 `/api/report/popular` 再映射为卡片（按 symbol 填充 title/snippet 需兜底）。
  - 热门标记：当 `is_featured=true` 或来源 popular API 时，在卡片显式 “热门” badge。
- 我的报告
  - 数据源：`/api/report/history`（分页，字段含 `pdf_signed_url/docx_signed_url/reused_from_run_id/is_featured/lang/mode`）。
  - UI 复用生成页的详情/导出逻辑，使用 signed URL 下载；未登录引导登录。
- 复用弹窗
  - 生成前（生成页 handleSubmit）请求 `/api/report/availability?symbol&lang&mode`。
  - 如果返回 `reusable_run_id`，展示对话框：1) View history -> 跳 `/account/history` 或 `/reports#my-reports` 并高亮；2) Regenerate -> 继续 generateReport with `forceRegenerate=true`。
  - 需要阻止二次提交、处理 unauthorized/quota 与错误态回退为直接生成。
- Paywall拦截
  - 热门详情点击：未登录 -> 登录；已登录但 `plan` 为空/免费 -> 弹高阶提示文案；允许 admin/付费用户直达详情。
  - 实现方式：在 `/reports` 列表点击前检查 plan（`useSupabaseAuth` -> profile.plan or user_metadata.plan），否则展示前端弹窗，不调用详情。
- 管理员批量下架
  - 仅 admin 可见按钮（/reports 或 /admin/reports 入口），调用 `/api/admin/runs/unfeature-bulk`，默认 olderThanDays=30。
  - 成功后刷新热门列表或 admin runs 列表；错误提示保持轻量。

## 测试要求

- 单元/集成：
  - availability 复用流程：有/无复用、forceRegenerate、未登录、quota 用尽。
  - popular 排序：接口失败回退种子且 badge 不报错。
  - 我的报告：未登录跳转、历史分页渲染、下载链接存在时渲染下载按钮。
  - Paywall：未登录/免费用户拦截，admin/付费放行。
  - 管理员批量下架：admin 可调用，普通用户按钮不可见。
- 手动：
  - Hero CTA 跳转正确；最新/热门 tab 切换；热门 badge；复用弹窗可选查看历史或生成；点击热门详情非会员弹窗；批量下架 30 天前热门后热门列表更新。
- `npm run lint`、`npm test` 必须通过。

## 交付物

- `/app/reports/page.tsx`、`/app/sections/ReportGeneratorSection.tsx` 等前端实现与 UI 调整。
- 如需新增组件/Hook，放入 `app/components` / `hooks`，命名 `useXxx`。
- 代码内保持简短注释，仅对复杂逻辑做说明。
