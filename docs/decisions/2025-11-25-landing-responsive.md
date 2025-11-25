# Landing 页移动端溢出修复

- **问题背景**：用户反馈缩小窗口后右侧内容被截断；首页依赖多个 section（Hero/Modes/ReportGenerator/Workflow/Templates/Pricing/Why/FAQ），大量 `overflow-hidden`、徽章行 `whitespace-nowrap`、固定导航与大光晕背景可能导致水平溢出，移动端缺乏专门适配。
- **设计目标**：
  1) 320px 起无水平滚动，主要文案/按钮完整可见；
  2) Hero 导航、生成器表单、Workflow/Template/Pricing/Why/FAQ 在手机端单列并可阅读操作；
  3) 保持现有深色玻璃风格与桌面端布局不受破坏。
- **技术约束**：
  - Next.js App Router + TypeScript + Tailwind v4 `@theme inline`；沿用现有 tokens/按钮样式，不新增依赖。
  - i18n 文案不可变更 key；所有 UI 改动集中在对应 section 组件，不触碰 API/业务逻辑。
- **文案 key**：导航/生成器/Workflow/Pricing/FAQ 标题文案均来自 i18n；Persona 句子（tone 列表）和各 badge 需允许换行/缩略，保持 CTA 顺序（主→次）。
- **方案要点**：
  - 全局：在 `html, body, main` 或页面容器加 `overflow-x-hidden max-w-full`；必要时为主要 wrapper 加 `max-w-full`。
  - 布局：在 Hero nav、生成器表单头/按钮行等 flex 容器补 `min-w-0` 与 `flex-wrap`，移除非必要 `whitespace-nowrap`；移动端收紧 `px/gap/text-sm`；确保 grids 在 `sm/md` 下为单列。
  - 卡片：模板/定价/Why/FAQ 卡片补 `w-full` 与 `flex-wrap` 的徽章行，避免阴影/光晕撑宽。
  - 交互：生成器输入右侧 hint 在 `sm` 以下换行或隐藏；下拉列表设 `max-height` + `overflow-y-auto`，避免溢出被 `overflow-hidden` 裁切；固定导航保留/调整占位高度防遮挡。
- **测试要求**：
  - `npm run lint`；（可选）`npm test` 回归。
  - 手动：Chrome DevTools 320/375/414/768 宽度检查：无水平滚动；导航/语言切换、生成器输入+下拉+按钮、Workflow/Template/Pricing/Why/FAQ/页脚均完整可见可点击；若新增 `overflow-x-hidden` 确认下拉未被裁切。
