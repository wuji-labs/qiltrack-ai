# Motion & Interaction Refresh Snapshot (2025-11-23)

## 背景 / 问题
- 当前站点交互动效较少，鼠标悬停/点击反馈单薄，缺乏科技感与层次。
- 深色 + 绿/蓝霓虹主题已有基础，但动效未统一，易显得呆板。

## 目标
1. 为主要交互元素增加一致、轻量的动效反馈，提升科技感但不过度炫目。
2. 保持现有信息架构与文案逻辑不变，仅增加/微调样式与动画。
3. 遵循性能与可访问性：优先 transform/opacity，尊重 `prefers-reduced-motion`。

## 约束
- 不改文案、数据结构和业务逻辑；仅改样式/动画/状态反馈。
- 使用现有颜色体系：深色底 + 绿/蓝霓虹，避免新增高饱和杂色。
- 统一动画节奏：时长 160–220ms，`ease-out` / `ease-in-out`。

## 范围与版块
- 按钮/CTA（含 Hero、Pricing、报告生成、导航 CTA）。
- 卡片/Section（Hero highlights、Modes、Pricing 卡片、Templates、FAQ）。
- 导航与锚点 hover。
- 表单/输入（生成器区域）：focus/hover/提交 loading。
- FAQ 折叠动效。

## 设计与交互准则
- 按钮/CTA：hover 轻微提升 + 微光；active 轻按压；禁用态降低饱和度与阴影。
- 卡片：hover 提升 1–2px、描边亮度提升或轻渐变蒙层；active 短暂收敛；阴影克制。
- FAQ：展开时高度 + 透明度淡入，箭头 90° 旋转；收起反向，尊重 `prefers-reduced-motion`（直接跳转状态）。
- 输入/表单：focus 外描边发光；提交按钮 loading spinner；进度条平滑过渡。
- 导航：hover 底线或亮点动画，当前锚点保持高亮；动画细线 1–2px。
- 动画降级：检测 `prefers-reduced-motion`，在全局样式中禁用/弱化动画。

## 技术实现建议
- 复用 Tailwind class：新增/组合 transition、transform、shadow、border 亮度 class；必要时在 `app/globals.css` 增补少量 keyframes（如底线滑动、spinner）。
- 在组件 className 增加 `transition-all duration-200 ease-out`，hover/active 通过 `hover:-translate-y-[1px]`、`active:translate-y-[1px]`、`hover:shadow-[...]` 等实现。
- FAQ 展开：利用 `<details>` 的 `[open]` 选择器 + 内层内容 `transition-[opacity,transform]`（或退化为无动画）。
- Loading spinner：可用现有色值的边框旋转动画，时长 600–900ms linear infinite。

## 验收 / 测试
- 视觉：桌面与移动检查主 CTA、Pricing 卡片、FAQ 折叠的动效是否统一且不过度；无跳闪。
- 可访问性：启用 `prefers-reduced-motion` 时，动画降级为无或极轻微；键盘 focus 可见。
- 性能：无明显掉帧，无大面积盒阴影导致的卡顿。
- 常规：`npm run lint` 与 `npm test` 必须通过。

## 交付给 Claude 的指令
- 从 `main` 新建 feature 分支，仅在现有组件上添加/微调动效，范围限于上述元素；不改文案/逻辑/数据。
- 修改主要集中在 `app/page.tsx` 及公共样式（如需少量全局 keyframes，可在 `app/globals.css` 追加）。
- 统一时长与缓动，使用 transform/opacity 优先；尊重 `prefers-reduced-motion`。
- 完成后以 CAVR 汇报，并附 `npm run lint` / `npm test` 结果；提交 PR 等待 Codex 审核再合并。
