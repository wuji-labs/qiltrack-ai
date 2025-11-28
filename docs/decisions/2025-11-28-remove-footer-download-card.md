# Remove Footer Download Card
Date: 2025-11-28
Status: Approved

## 问题背景
- 页脚右侧“下载应用”卡片暂无真实落地链接，占据布局空间。
- 需求：删除该模块，保持页脚简洁。

## 设计目标
- 移除下载卡片组件与相关入口，桌面端仅保留品牌 + 链接列 + meta。
- 调整栅格为四列布局，避免空白占位。
- 清理 i18n 文案避免遗留死键。

## 技术约束
- Next.js App Router + Tailwind v4 `@theme inline`；保持现有 CSS 变量方案。
- 页脚依旧使用 `useLanguage` 文案读取，链接 JSON 解析逻辑保持不变。

## 文案 key
- 删除：`footer.download.title`，`footer.download.caption`。
- 新增：无。

## 测试要求
- 视觉冒烟：桌面端品牌列 + 链接列对齐，无空列；移动端栈叠正常。
- a11y：footer 链接 tab 顺序与聚焦态不受影响。
- i18n：语言切换仍可正常读取 footer 其他文案。
- 建议执行：`npm run lint`，`npm test`。
