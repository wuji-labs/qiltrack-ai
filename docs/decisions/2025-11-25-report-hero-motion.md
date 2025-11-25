# Report Center Hero Motion Snapshot (2025-11-25)

## 背景 / 问题
- 报告中心页（/reports） hero 背景和 CTA 目前缺少可感知动效，用户反馈“没有动效”。
- 现状：仅应用 `.hero-mesh` 静态网格 + `animate-fade-in-up`，但 `motion-safe:animate-mesh-drift` 等类在 globals.css 未定义，prefers-reduced-motion 仅靠全局兜底，未针对 hero 降级。

## 设计目标
- 为 hero 背景、卡片和 CTA 提供轻量流动感（mesh 漂浮、卡片微浮、CTA 光晕/序列进入），强化“报告中心”入口的科技感。
- 遵守 Motion Refresh (2025-11-23) 节奏：transform/opacity 优先，160–220ms ease-out/ ease-in-out，保持可读性不跳屏。
- 保持文案与信息架构不变，兼容桌面/移动与 prefers-reduced-motion。

## 技术约束
- 不新增依赖；仅改 `app/globals.css` 与 `app/reports/page.tsx` 样式/类名。
- 文案保持 i18n key 不变：`reports.page.hero.kicker` / `title` / `description` / `cta` / `contact` / `backHome`。
- 不改变导航/锚点行为（CTA 仍指向 `#archive`），不调整布局层级。
- 动画需有降级：`prefers-reduced-motion` 下静态展示，无漂浮/光晕。

## 动效方案（建议）
- 背景：在 `app/globals.css` 新增 `@keyframes mesh-drift`（16–22s 缓慢 translate/scale/rotate），并提供 `.animate-mesh-drift` 实用类；`@media (prefers-reduced-motion: reduce)` 置零动画。
- 容器：新增 `.animate-hero-float`（3–4s 轻微上下浮动）与 `.animate-hero-glow`（伪元素柔光脉冲）供 hero 卡片使用，均受 motion-safe 限制。
- 文案/CTA：沿用 `animate-fade-in-up` 的延时阶梯；CTA 可加 `motion-safe:hover:glow-pulse`（8–10px 模糊光圈）提升悬停反馈。
- 可选辅助：在 hero 内添加一层半透明 radial gradient 覆盖，使用 `mix-blend-mode: screen` 低频缓动，确保不遮挡文字。

## 改动范围
- `app/globals.css`: 补充 `mesh-drift` / `hero-float` / `hero-glow` / `glow-pulse` keyframes 与对应 utility class，添加 reduce-motion 分支。
- `app/reports/page.tsx`: 给 hero 背景添加 `.hero-mesh motion-safe:animate-mesh-drift`，容器添加 `motion-safe:animate-hero-float`（或相同 class），CTA 增加 glow hover，必要时加辅助 gradient 层，保持现有文案与锚点。

## 测试要求
- 桌面/移动：进入页面时 kicker/标题/描述/CTA 顺序淡入；背景网格缓慢漂移；卡片轻微浮动但不抖动。
- 减少动态：开启 prefers-reduced-motion 后，动画停用，布局和可读性不受影响。
- 交互：CTA 悬停出现柔光，不影响点击区域；`Back home` / `mailto` / `#archive` 行为正常。
- 工具：`npm run lint` 必须通过；无需新增自动化测试，手测记录到 PR。
