# Snapshot：报告中心文章详情 404 修复（2025-11-30）
## 背景
- 线上用户反馈：在报告中心点击文章跳转到 `/reports/[slug]` 时出现 Next 默认 404（This page could not be found）。
- 现状：`app/reports/[slug]/page.tsx` 在 SSR 阶段使用 `fetch("/api/report/posts/:slug")` 获取文章，Node/SSR 环境的 `fetch` 不支持相对路径，调用直接抛错后落入 `notFound()`；seed 兜底只覆盖静态样例，真实 API 返回的 slug 无法匹配。
- 目标：恢复已发布文章的详情可读性，保持种子数据兜底与元数据生成正常运行。

## 设计目标
1) 文章详情 SSR 能正确调用内部 API，真实文章不再 404；未知 slug 仍返回 404。
2) 兼容部署环境（本地/Preview/Prod）的 host 解析，不依赖硬编码域名。
3) 保留 seed 兜底链路，确保在 API 异常时至少能展示示例文章。
4) 不影响现有 UI/动效与文案，metadata 仍依据文章标题/摘要生成。

## 技术约束与方案要点
- 框架：Next.js App Router（Server Component），`fetch` 在 Node 环境需要绝对 URL。
- 构造基准域名：优先 `process.env.NEXT_PUBLIC_SITE_URL`，否则从请求头 `x-forwarded-proto/host` 推断，默认回退 `http://localhost:3000`。
- API：沿用 `/api/report/posts/:slug`，保持 `cache: "no-store"`；slug 解析依旧支持 seed 查询。
- 不新增依赖，不改动数据库/Schema，仅调整 SSR 拉取方式与鲁棒性。

## 文案 key
- 详情页 CTA/返回文案沿用现有 i18n key：`reports.card.readMore`、`reports.page.hero.backHome` 等，无新增文案。

## 测试要求
- 手动：在有真实文章 slug 的情况下访问 `/reports/<slug>`，应展示正文而非 404；不存在的 slug 仍返回 404。
- 回归：seed 示例（如 `/reports/msft`）可正常渲染；metadata 无错误（标题/描述来自文章）。
- 自动：`npm test` / `npm run lint` 需通过；若因环境变量缺失导致失败需记录原因。
