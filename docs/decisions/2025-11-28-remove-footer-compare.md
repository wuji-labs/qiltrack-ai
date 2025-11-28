# Remove Footer Compare Module
Date: 2025-11-28
Status: Approved

## 问题背景
- 页脚新增的 Compare 链接列（vs. Bloomberg/FactSet/Manual）与当前落地页焦点不符，被要求直接移除。
- 涉及组件：`app/sections/FooterSection.tsx`、`lib/i18n.tsx` 中对应文案 key。

## 设计目标
- 删除 Compare 链接列及全部文案，不留空白占位；保留 Product/Solutions/Company/Resources 四列布局。
- 不新增新文案或占位，保持现有排版、焦点态与无障碍行为不变。
- 清理 i18n dead key，避免多语言读取空字符串或报错。

## 技术约束
- 技术栈：Next.js App Router + Tailwind v4 `@theme inline`，保持现有样式变量。
- `FooterLinks` 仍使用 JSON 文案解析，其他列结构不变；Grid 维持 4 列配置。
- 语言切换继续通过 `useLanguage`，删除 compare key 后不得有残留引用。

## 文案 key
- 删除：`footer.links.compare.title`，`footer.links.compare.items`（所有语言）。
- 新增：无。

## 测试要求
- 视觉：桌面端和移动端页脚仅展示 4 列链接，无空列；品牌/Meta 区域布局不变。
- a11y：Tab 顺序、focus ring、aria-label 与删除 Compare 列后仍正常。
- i18n：切换各语言页脚不报错，其他列文案正常显示。
- 建议执行：`npm run lint`，`npm test`。
