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

### Phase 1.5 — 旗舰级品牌视觉系统重建 (Day 2-3)

**愿景**：打造 Apple/Linear/Notion/Bloomberg 级别的金融科技审美，让用户第一秒就感知到“稳定、可靠、安静、高智商”，并确信它值得付费。

1. **品牌气质**
   - 关键词：Silent Confidence / Premium Minimalism / High-Intelligence Density / Financial Neutrality / Crisp Precision。
   - 禁忌：过度渐变、情绪插画、花哨玻璃拟态、夸张动效、多色彩。越贵越克制。

2. **Design Tokens（Tailwind `@theme`）**
   - 颜色：`--bg-base #0A0A0C`、`--bg-layer rgba(255,255,255,.03)`、`--bg-frosted rgba(255,255,255,.07)`、`--stroke-soft rgba(255,255,255,.08)`、`--stroke-glow rgba(255,255,255,.18)`、`--accent-blue #5F8FFF`、`--accent-purple #A58AFF`。所有组件必须引用 token，不得裸写色值。
   - 字体：Inter + SF Pro Display；Headline/Body 样式依照 36–48 / 28–32 / 18 / 16 / 14 的层级及对应字重行高。
   - 半径/间距/阴影：r-xs 6、r-sm 10、r-md 16、r-lg 24；Spacing 使用 4/8/12/16/24/32；阴影/发光用 `shadow-soft`, `shadow-focus`, `shadow-depth`，营造冷静折射光感。
   - 模糊：blur-sm 8px、blur-md 12px，Frosted 层统一 `rgba(255,255,255,.06)` 背景 + 0.5px 边 + 内发光。

3. **核心模块重构**
   - 导航：半透明 Apple 风玻璃、极简内容结构、200ms fade+blur 动效，桌面/移动统一气质。
   - Hero：固定结构（主标题/副标题/主次 CTA/轻量光效背景），信息密度高但秩序感强。
   - 生成器：类似 Apple 设置页的沉稳界面；输入/按钮/提示全部采用单色+内描边风格，CTA hover 仅调亮度。

4. **动效系统**
   - 哲学：Less Movement, More Feeling。统一 200–240ms，属性限制在 opacity / brightness / blur，位移 ≤4px，scale ≤1.02。悬浮层使用 blur 8→12 + opacity 0→1 + 内描边亮起。

5. **组件库**
   - 需统一 Button/Badge/Input/TextArea/Card/Modal/Sheet/Dropdown/Progress/Toast 等十类组件的视觉语法与状态机（默认/hover/press/disabled/focus）。

6. **验收标准**
   - 首页开屏即给人“99 美元/月”级产品质感；任何页面摆脱 Indie Hacker 风；导航/Hero/生成器风格一致；所有 UI 引用 tokens；动效克制统一；布局遵循 8/16/24 网格；深色背景呈现 Apple × Bloomberg 气质。

7. **交付物**
   - tokens 文档、首页/生成器前后对比截图、动效录屏、导航/Hero/生成器代码重构、components/ 目录与 `tailwind.config.js` 更新。

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
