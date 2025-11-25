# 导航栏锚点校准（再次）

- **问题背景**：顶部导航点击锚点（生成器/解决方案/定价/FAQ 等）落点存在偏移或被固定导航遮挡，部分区块未统一 scroll margin，导航文案与锚点顺序也存在轻微错位，影响首屏引导体验。
- **设计目标**：1) 导航“产品/生成报告/定价/FAQ”及 Hero 主 CTA 均能对齐对应区块标题，落点完整可见；2) 桌面/移动导航滚动行为一致且平滑，无过冲或抖动；3) 复用现有路由与文案，不引入新依赖或大规模样式扰动。
- **技术约束**：Next.js App Router + TypeScript + Tailwind v4；导航交互在 `app/sections/HeroSection.tsx`，目标区块定义于 `app/page.tsx`。固定导航高度约 72–80px，Hero 下方已留 120/140px 间距，需通过统一 `scroll-margin-top`（建议 ~144px，可用 CSS 变量）或 JS offset 补偿。现有锚点为 `#generator`/`#overview`/`#pricing`/`#faq`；`nav.templates` 仍走 `/reports`。
- **文案 key**：复用 `nav.product`、`nav.generator`、`nav.pricing`、`nav.faq` 及 `hero.cta.primary`/`cta.preview`，不新增翻译。
- **测试要求**：手动在桌面与移动视口点击导航项与 Hero 主 CTA，确认平滑滚动且区块标题未被遮挡；定价卡 CTA 的跳转与 Hero 主 CTA 一致指向生成器区块。若时间允许，运行 `npm run lint` 以确保无新增告警。
- **实施要点（供 Claude）**：1) 为各锚点 section 统一添加 offset 样式（如 `.anchor-offset { scroll-margin-top: var(--nav-offset, 144px); }`），覆盖 `#generator/#overview/#pricing/#faq`，可顺便给 Why/模板区块预留以备后续导航扩展；2) 让 `handleNavClick` 与 `handlePrimaryCta` 复用同一滚动函数，若用 JS offset 则从 CSS 变量读取，保持桌面/移动一致；3) 校验锚点顺序与导航文案映射（product→overview/workflow，generator→生成器卡片，pricing→定价，faq→FAQ），避免重复 id 或缺失。
