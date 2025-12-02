# 2025-11-25 Hero 区对齐（Architecture Snapshot）

## 背景

- 主页 Hero 容器使用 `max-w-full` + px padding，与主体 `max-w-6xl` 容器不一致，左右边界和圆角卡片未与下方 sections 对齐。
- 导航容器用 `max-w-7xl`，Hero 内容与导航/主体中心线偏移，锚点滚动后视觉参考线不齐。

## 设计目标

- Hero 卡片、导航、主体 sections 水平对齐，同一中心线，桌面端 1280-1440 视口下边缘一致。
- 保留现有视觉效果（mesh 背景、阴影、圆角），不裁切装饰光晕。
- 移动端保持全宽体验且无水平滚动。

## 技术约束

- Next.js App Router + Tailwind v4 inline token；避免新增全局 CSS/依赖。
- 优先统一容器宽度为 `max-w-6xl`（与 generator/pricing 等一致），复用 `px-4 sm:px-6 lg:px-10`；如导航需单独宽度也要与该容器对齐。
- 保持 hero 顶部 spacer（h-[120px]/h-[140px]）防止固定导航遮挡；锚点 id `#hero/#generator` 不变。
- 不改动文案/CTA 文案 key；仅调整布局。

## 文案 key

- hero.title / hero.description / hero.positioning / hero.brandline / hero.cta.primary / hero.cta.secondary
- nav items keys：nav.product, nav.generator, nav.templates, nav.pricing, nav.faq
- 锚点：#hero, #generator, #overview, #pricing, #faq

## 实施要点

- 提取公共容器类（示例：`const pageContainer = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10"`），HeroSection 与 page 主内容共用，导航容器也调整到同宽以避免跳动。
- Hero 外层从 `max-w-full` 改为公共容器；允许 mesh/光晕绝对元素溢出但内容边框受容器限制（`overflow-hidden` 已有）。
- 检查 fixed 导航和移动抽屉定位：保持 top/left 定位，但宽度随容器，必要时用 `left-1/2` + `max-w-6xl`。
- 保持 hero 与下方 section 间距（现有 h-[120px]/h-[140px] spacer + section padding），避免过大/过小。

## 测试要求

- 手动：Chrome 下 1280/1440/1920 宽度，确认 hero 卡片左右边缘与 generator/pricing 卡片对齐；点击导航锚点不被导航遮挡。
- 手动：移动 390/768 宽度，确认 hero 与下方 section 全宽一致，无横向滚动条。
- 自动：`npm run lint`、`npm test` 需通过（现有 Vitest 覆盖 api + useProgress）。
