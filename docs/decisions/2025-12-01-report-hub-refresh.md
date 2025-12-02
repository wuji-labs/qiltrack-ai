# Report Hub Refresh & Reuse Plan (2025-12-01)

## 背景

- 报告中心 hero 按钮需改为「热门公司 / 我的报告 / 返回首页」，原绿色按钮移到「我的报告」下方。
- 热门公司 = 管理员发布/标记的公开报告，非会员可浏览列表但点击详情需高级提示。
- 我的报告需内嵌在报告中心，列表 + 详情展示与生成页 UI 完全一致（复制/导出 Word/PDF/图标）。
- 复用：同一用户 7 天内同公司弹窗「查看历史(不扣额度) / 生成最新(扣额度)」；其他用户命中 7 天内最新报告直接复用并扣额度，进度条仍显示；复用也记历史，指向 reused_from_run_id。
- 存档：全站生成报告落库，管理员可见，可一键标记为热门；管理员可批量下架 30 天前的热门（仅下架展示，不删数据库）。
- 排序：热门公司页新增排序「最新 / 最热门」，最热门按过去 30 天生成次数（历史记录聚合）。
- 账号：需创建管理员账号（邮箱+强密码，密码不入代码，可在 Supabase Dashboard 设定）。

## 设计目标

- 明确入口与分区：热门公司（公开）/ 我的报告（私有）/ 返回首页。
- 复用省成本：命中 7 天内最新报告时复用内容但仍扣额度；同用户可选择重跑。
- 体验一致：我的报告详情复用生成页组件（复制/导出/图标/布局一致），复用时进度条照常。
- 权限与拦截：未登录访问我的报告跳登录；非会员查看热门详情弹高级文案付费提示。
- 管理可运营：管理员能查看 runs、标记热门、批量下架 30 天前热门；支持最热门排序。

## 技术约束

- 前端：Next App Router、Tailwind v4 `@theme inline`，TypeScript/React 19，ESLint/Prettier 规范。
- 测试：Vitest + Testing Library，必须保持 lint/test 通过；API 连接使用现有配置（Finnhub/OpenRouter）。
- 数据：继续使用 Supabase；敏感信息不入库/代码；管理员账号密码不写入仓库。

## 范围与实现要点

### 数据/后端

- runs 表新增/确认字段：
  - `hash`（内容 hash，用于复用判定），`reused_from_run_id`（复用链路），`is_featured`（热门标记），`lang`、`mode`、`docx_path`、`pdf_path`、`markdown_path`、`content_md`、`content_html`（可选）、`meta` JSON（tone/prompt），`created_at`、`status`。
- 新接口/扩展：
  - `GET /api/report/availability?symbol&lang&mode` → { reusable_run_id, created_at, symbol, lang, mode }（7 天窗口）。
  - `POST /api/report` 支持 `forceRegenerate`，未强制且命中复用时返回已有 run 内容并写历史（含 `reused_from_run_id`），仍扣额度。
  - `GET /api/report/popular?range=30d&limit=…` → symbol 热度列表（按历史生成次数聚合）。
  - `/api/report/history` 返回 `reused_from_run_id`、`is_featured`、`docx_signed_url`、`pdf_signed_url`。
  - 管理员：`GET /api/admin/runs`（分页/按时间过滤），`POST /api/admin/runs/{id}/feature|unfeature`；批量下架：`POST /api/admin/runs/unfeature-bulk`（filters: olderThanDays=30）。
- 管理员账号：在 Supabase Dashboard 创建，如 `admin@investor.ai`，密码由运营设置（不入代码）。

### 前端

- 报告中心 hero CTA：改文案为「热门公司 / 我的报告 / 返回首页」，绿框按钮放在「我的报告」下面。
- 排序/筛选：保留主题/行业筛选；新增排序 tab「最新 / 最热门」并调用热门接口；热门卡片显示“热门”徽标。
- 我的报告：在 `/reports` 内嵌 tab/section，列表使用历史接口；点击进入详情复用生成页组件（复制/导出 Word/PDF/图标/布局相同）；未登录跳转登录。
- Paywall：非会员点击热门详情弹高级提示，文案高级体面（见文案 key）。
- 复用弹窗：同一用户 7 天内同 symbol 时弹出「查看历史(不扣额度) / 生成最新(扣额度)」，历史跳转我的报告对应 run；生成页进度条在复用时照常播放（可在前端模拟渐进状态，后台立即返回内容）。
- 管理入口：管理员登录后看到「管理报告」按钮，进入列表可勾选 30 天前热门并确认下架（仅移除热门/展示，不删数据）。

## 文案 / i18n key（示例 zh-Hans）

- `reports.page.hero.cta`: 热门公司
- `reports.page.hero.myReports`: 我的报告
- `reports.page.hero.backHome`: 返回首页
- `reports.page.hero.myReports.cta`: 打开我的报告
- `reports.paywall.premium`: 此报告为会员专享，开通后即可阅读全文与下载。
- `reports.reuse.title`: 我们找到了 7 天内的最新报告
- `reports.reuse.sub`: 可直接查看历史或重新生成最新版本
- `reports.reuse.viewHistory`: 查看历史（不扣额度）
- `reports.reuse.regenerate`: 生成最新（扣额度）
- `reports.sort.latest`: 最新
- `reports.sort.popular`: 最热门
- `reports.admin.manage`: 管理报告
- `reports.admin.unfeature.confirm`: 确认下架所选热门报告？源数据保留，仅从报告中心移除。

## 测试要求

- 单元：复用判定（同用户/跨用户、forceRegenerate）、历史记录包含 reused_from_run_id、热门聚合排序、paywall gating。
- 集成：生成 → 命中复用 → 历史列表呈现 → 复用跳转；热门排序正确；管理员下架 30 天前热门不影响数据。
- 手动：未登录访问我的报告跳登录；非会员点热门详情出现高级提示；复用时进度条仍完整展示；导出/复制在我的报告详情可用。

## 待办/后续

- 创建管理员账号（Supabase Dashboard，密码线下设定）。
- 确认热门窗口期默认 30 天；下架依据 run `created_at`。
