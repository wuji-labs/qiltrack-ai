# Snapshot：主页生成器 placeholder & 报告中心卡片封面（2025-11-29）

## 问题背景
- 生成器输入框在 640-767px（sm 断点）显示的 zh-Hans placeholder 仍是 “NVDA / TSLA”，需要改为 “NVDA / Apple”。
- 首页“报告中心”三篇示例卡片目前仅文本，用户需要横版封面图的展示模式，要求保持原有模块节奏和占位，不拉长整体版面。

## 设计目标
1. 文案：仅在 sm 断点的 zh-Hans placeholder 替换示例为 “NVDA / Apple”，其他断点与语言不变。
2. 视觉：首页报告卡片引入横版封面（使用现有 cover 源），风格高级简约，保留三列栅格和卡片节奏，控制高度避免模块过长。
3. 体验：封面图需保持可读性（覆盖渐变/遮罩），信息层级清晰（主题/符号/读完时间/摘要/标签/日期），Hover 交互延续现有轻量浮动。

## 技术约束
- 代码栈：Next.js App Router + Tailwind CSS v4（@theme inline），保持现有 section 结构与暗色主题。
- 数据：复用 `getFeaturedReports(3)` 返回的 `cover` 字段（含渐变+url），不引入新数据源。
- 断点：占位文案逻辑已基于 `window.innerWidth` 选择 xs/sm/md/xl，不变更逻辑，仅更新目标 key。
- 无新增 API/环境变量，保持 SSR 安全（placeholder 仍在客户端切换）。

## 文案 key
- `generator.input.placeholder.sm` （zh-Hans）：`请输入代码/公司，例如 NVDA / Apple`
- 其余语言与断点 placeholder 保持现状，不改。

## 测试要求
- 手动：窗口宽度 <640/640-767/768-1023/≥1024 逐一检查 placeholder 文案是否匹配预期（重点核对 sm 变更）。
- 手动：首页“报告中心”卡片显示横版封面，文字覆盖可读；Hover 与点击跳转 `/reports/...` 正常，卡片高度与栅格对齐。
- 如时间允许，可运行 `npm run lint` / `npm test` 验证基础健康；否则人工回归交互与布局。
