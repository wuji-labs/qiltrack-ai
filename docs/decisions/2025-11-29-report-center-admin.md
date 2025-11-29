# 报告中心后端与用户归档架构快照
## 背景
- `/reports` 目前依赖 `lib/content/reportHub.ts` 的静态 seed，`app/reports/[slug]` 仅匹配静态数据，未接真实后端。
- `/api/report` 已能生成 Markdown 写入 Supabase Storage（bucket `report-assets`）并落表 `report_runs`/`report_documents`，但前端无历史展示、无下载/编辑能力。
- Supabase Auth 已接入，但缺少 admin/editor 角色与上传管控，普通用户不能上传文件。
- 需求：支持管理员上传/编辑/发布报告，用户查看/下载历史并可上传自有报告，前端用后端数据渲染且保留 seed 兜底。

## 设计目标
1) 报告中心数据化：`/reports` 列表/详情读取数据库接口，支持分类/分页/搜索与多语言。
2) 管理端：管理员可创建/编辑/发布/下载报告，支持封面/附件上传与版本记录。
3) 用户历史：登录用户可查看/下载自己生成或上传的报告，支持版本与备注。
4) 权限隔离：基于 Supabase Auth 角色（admin/editor/user）+ RLS，公共仅能读已发布内容。
5) 体验：保留 seed 作为无数据兜底，404/加载/错误态完整，延续现有视觉主题。

## 技术约束与方案要点
- 框架：Next.js App Router + TypeScript + Tailwind v4 `@theme inline`，ESLint/Prettier 已启用。
- 数据/权限：Supabase 托管，新增表 `report_posts` 与 `user_report_uploads`，启用 RLS；存储 bucket `report-assets`，上传用 service role 签名。
- Auth 复用 `useSupabaseAuth`，profiles.role 存 admin/editor/user；服务端根据角色校验。
- SEO：`generateMetadata` 需从动态数据提供标题/描述/封面，slug 稳定。
- 兼容：保留 `lib/content/reportHub.ts` seed 作为 fallback，前端默认走 API，失败再降级。

## 关键字段/接口
- 表 `report_posts`：id | title | slug | cover | theme | tags | lang | status(draft/published) | summary | body | version | author_id | published_at | created_at | updated_at。
- 表 `user_report_uploads`：id | user_id | title | note | file_path | version | status(pending/approved/rejected) | created_at | updated_at。
- API（已落地）：
  - 公开：`GET /api/report/posts`（分页/筛选）、`GET /api/report/posts/:slug`。
  - 管理：`POST/PATCH /api/admin/report/posts`、`POST /api/admin/report/upload`。
  - 用户：`POST /api/report/upload`、`GET /api/report/history`（含签名 URL）。

## 测试要求
- 鉴权：未登录访问 admin/api 返回 401/403，普通用户无权调用 admin 接口，上传/下载仅限本人或管理员。
- API：`/api/report/posts` 分页/筛选；`/api/report/history` RLS 过滤与签名 URL；上传体积与类型校验。
- 前端：`/reports` 空态/错误态/分页交互；详情 404 处理；历史页加载与下载按钮。
- 验证：`npm run lint`、`npm test` 必须通过，关键接口使用 Vitest mock Supabase。

## 实施记录
### Stage A（2025-11-29，后端/Schema）
- Schema：profiles 新增 `role (admin/editor/user)`，创建 `report_posts` 与 `user_report_uploads` 表并启用 RLS 与约束。
- 权限：公开只读已发布文章；管理员/编辑可管理全部文章与上传；作者可读/更改自己的文章；用户可读/新增自己的上传。
- API：落地 `GET /api/report/posts`、`GET /api/report/posts/:slug`、`POST/PATCH /api/admin/report/posts`、`POST /api/report/upload`、`POST /api/admin/report/upload`，均含 Session 校验与存储签名上传。
- 约束：上传体积限制（用户 10MB，管理员 20MB），tags/status 校验，发布自动写 `published_at`；前端未接入（待 Stage B）。

### Stage B（2025-11-29，前端接入）
- 前台：`/reports` 列表改用 `api/report/posts` 带分页/筛选，失败回退 seed；加载态 skeleton、空态与错误提示；分页控件与 URL 同步 `page/limit/tag/theme/lang/q`。
- 详情：`/reports/[slug]` SSR 拉取 API，若失败用 seed 兜底；404 友好提示与返回列表 CTA；支持主题/标签/封面占位。
- 账户历史：`/account/history` 展示用户报告历史，调用 `api/report/history`，显示签名下载链接（markdown/docx）与状态/时间；未登录跳转登录。
- 测试：`npm run lint`、`npm test` 通过；新增列表/详情/历史用例，现有 history 测试需补充 service role mock（待修复）。

### Stage C（2025-11-29，管理端 UI）
- 管理台：新增 `/admin/reports`（客户端），基于 Supabase profile.role 仅 admin/editor 可见，支持状态/搜索过滤、分页、列表展示版本与更新时间。
- 编辑器：支持新建/编辑报告（标题、slug、摘要、正文、封面 URL、主题、标签、语言、状态、版本），保存调用 `/api/admin/report/posts`；可通过表单上传资产（调用 `/api/admin/report/upload`）并自动回填封面 URL（临时签名链接）。
- 辅助：新增 API helper `createAdminReportPost`/`updateAdminReportPost`/`uploadAdminAsset`，Report 类型补充 admin payload；seed 映射测试保持通过。
- 测试：`npx vitest run --environment jsdom --pool=forks` 与 `npm run lint` 通过（保留 quota/report 测试的模拟日志输出）。

### Stage D（调整：仅历史浏览，不启用用户手动上传）
- 决策：用户无需手动上传/替换，生成的报告自动出现在 `/account/history`；上传入口与相关 API 已移除。
- API/UI：删除 `/account/uploads`、`GET /api/report/uploads`、`PATCH /api/report/upload/:id`；`/account` 不再展示上传入口。
- 封面：cover 存持久 path，`/api/report/posts` 与 `/api/report/posts/[slug]` 返回时用 service role 签名（30 分钟）或走公开路径，前端展示不依赖临时回填。
- 历史下载：`/account/history` 仍返回签名 URL（30 分钟 TTL），需确保 `SUPABASE_SERVICE_ROLE_KEY` 可用。
- 测试：`npm run lint`、`npx vitest run --environment jsdom --pool=forks` 通过（保留 quota/report 模拟 warn），上传相关用例已移除。

### 待办/风险
- 历史下载与上传列表签名依赖 service role；需在部署侧确认 `SUPABASE_SERVICE_ROLE_KEY`、存储策略与 TTL 符合要求。
- 管理端封面改为持久路径 + 接口签名，如需更长有效期可调整 TTL 或开放公开 bucket。
- 用户上传/审核流已取消，后续如需恢复需重新评估权限与存储策略。
- 需要定期同步 seed 与真实数据，避免内容漂移。
