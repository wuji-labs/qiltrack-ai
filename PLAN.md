# Investor AI MVP 执行计划

## Phase 0 - 基础建设 (Day 0)
1. **信息架构**：确认导航组织、核心页面和状态（访客/登录/订阅）。
2. **环境文件**：新增 `.env.local.example`，列出 `FINNHUB_API_KEY`、`OPENROUTER_API_KEY`、`STRIPE_SECRET_KEY` 等。
3. **Feature Flag**：`NEXT_PUBLIC_FEATURE_PAYWALL` 控制付费模块灰度。
4. **README**：替换模板内容，描述项目简介、依赖、开发/部署步骤。

## Phase 1 - 导航 + 核心入口 (Day 1-2)
1. **layout.tsx**：实现响应式顶栏（Logo、导航、CTA、登录状态）。
2. **page.tsx**：拆分 Hero/流程/FAQ，并保留现有报告生成功能。
3. **体验检查**：跑 `npm run dev` 手动验证导航跳转、滚动锚点、移动端菜单。

## Phase 2 - 登录/注册闭环 (Day 3-4)
1. **鉴权选型**：NextAuth Email OTP；数据库暂用 SQLite + Prisma。
2. **API 路由**：`/api/auth/[...nextauth]`，配置邮件发送或 Magic Link。
3. **UI**：增加登录/注册页，主页 CTA 调度登录流程；导航显示 Session。
4. **验证**：新用户注册→验证→生成首份报告→刷新保持登录。

## Phase 3 - 支付与额度 (Day 5-6)
1. **额度存储**：`users` 表新增 `plan`, `quota`（默认 1）。
2. **后端校验**：`/api/report` 生成前校验 `quota`，成功后扣减；不足时返回错误。
3. **Stripe**：Checkout Session、webhook 更新 `plan/quota`；前端订阅页+模态。
4. **体验**：试用额度→消耗→支付→额度刷新，记录链路日志。

## Phase 4 - 辅助功能 (Day 7+)
1. **历史报告**：持久化报告内容，支持列表/重导出。
2. **分享/导出**：分享链接、CSV/PNG 导出。
3. **Watchlist**：用户自定义关注列表 + 警报。
4. **模板切换 & AI QA**：多风格报告、附加问答框。

## 节奏安排
- 每周一规划、周二三开发、周四联调、周五验证与复盘。
- 每功能上线附手动验证记录和截图，确保闭环稳定。

## 版本控制与回滚策略
1. 所有开发在 `main` 之外的专题分支上进行（例如 `feat/apple-visual-refresh`），完成阶段性交付后再合并。
2. 关键节点立即 `git commit` 并附清晰信息，可随时通过 `git revert <commit>` 回滚单次尝试，或 `git reset --hard <commit>` 回到任意快照。
3. 与远端协作时，将主分支设置为受保护，仅允许经 Review 的 PR 合入，同时为上线版本打 `git tag vX.Y.Z` 便于定位。
4. 如需额外保险，可在大版本前手动备份导出 `git archive`，确保设计实验失败时也能瞬间恢复。
