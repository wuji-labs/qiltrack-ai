# 2025-11-26 Quota/Login 会员卡样式（精简版 Snapshot）

## 背景
主页生成器左侧“额度 / 登录提醒”卡片需要变成高端会员卡风格（黑金金属卡），右侧亮点卡不改。

## 目标
- 一张黑金卡承载额度/状态：顶行 plan+状态点，中部额度大数字（或登录解锁提示），底部邮箱与 CTA 组。
- 登录态突出额度与计划；未登录同一卡面但提示登录解锁；额度为 0 时有轻微警示色。
- 无夸张光晕，质感来自渐变/噪点/内凹描边；尊重 reduced-motion。

## 约束
- 仅改 `app/sections/ReportGeneratorSection.tsx` 左侧卡片；i18n key 不变；不新增依赖/全局 CSS。
- 使用 Tailwind v4 inline 类，复用全局 token（`--accent-emerald`、`--accent-blue`、`--stroke-soft`、`--bg-layer`）。
- 交互保留：登录态主按钮调用 `auth.refreshSession`，未登录主按钮 `onRequireLogin`，次按钮滚动 `#generator`。

## 状态与文案
- **已登录额度>0**：标题 `{planLabel}`，额度大号 `quota.card.count`，副文案 `quota.card.note`。主按钮 `quota.card.refreshCta`，次按钮 `quota.card.exampleCta`。
- **已登录额度=0**：同上但额度数字用 amber，小闪点/警示色。
- **未登录**：标题 “Guest Pass”，中部文案 `quota.banner.description`（替代额度），主按钮 `cta.preview`→`onRequireLogin`，次按钮 `quota.card.exampleCta`。

## 视觉要素
- 卡面：圆角 24-28px，深色金属渐变+细噪点，内凹 1px 描边；斜向柔光（linear-gradient）即可，避免大光晕。
- 装饰：右上角小“芯片”矩形（16x22 渐变边框），中部浅灰“签名条”。可加微网格，淡化处理。
- 布局：三行信息清晰，按钮区在底部；md+ 时左右两列，sm- 堆叠且按钮满宽。

## 实施要点
- 保持现有网格，只替换左卡内部结构/样式；右卡 highlightCards 不动。
- 背景与折光用 `before/after` 或绝对层，文本区域需高对比度；动画可省略或极轻。
- 额度数字/状态色由 `auth.isAuthenticated` 与 `auth.remainingQuota` 控制；未登录沿用 guest 占位邮箱 `auth.session.fallback`。

## 测试
- 手动：桌面 1280/1440；移动 390/428，无横向滚动，CTA 可点击。
- 功能：登录态刷新触发 `auth.refreshSession`；未登录主按钮触发 `onRequireLogin`；示例按钮滚动 `#generator`。
- 自动：`npm run lint`、`npm test` 通过（现有 Vitest）。
