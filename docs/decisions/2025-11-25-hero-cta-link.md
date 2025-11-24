# Hero 区示例 CTA 跳转 /reports 决策

- **问题背景**：首页 Hero 区的次级 CTA（View example）当前指向页面锚点（#generator）。用户希望从 Hero 直接访问报告示例页 `/reports`，与导航“Report Hub”保持一致。
- **设计目标**：
  1) 次级 CTA 直接跳转 `/reports`，减少滚动和二次点击；
  2) 复用既有文案与视觉样式，不新增翻译 Key；
  3) 保持导航/移动端表现一致，不引入布局抖动。
- **技术约束**：
  - Next.js App Router + TypeScript + Tailwind v4；Hero 位于 `app/sections/HeroSection.tsx`。
  - 使用 `next/link` 取代裸 `<a>`，保持客户端路由体验；样式类名原样保留。
  - i18n Key `hero.cta.secondary` 已存在，不改文案。
- **文案 Key**：`hero.cta.secondary`（多语言已就绪；无需新增翻译）。
- **测试要求**：
  - 手动：在桌面与移动视口点击“View example/查看示例”应跳转到 `/reports`，无控制台报错。
  - 运行 `npm run lint`（若触发 ESLint 以确保无未使用导入/类型警告）。
