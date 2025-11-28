# Snapshot：生成器占位文案响应式（2025-11-29）
## 背景
- 当前问题：移动端输入框 placeholder 过长，易截断；希望在 640/768/1024/1280 四个断点上使用更短/完整的提示文案。
- 影响范围：`app/sections/ReportGeneratorSection.tsx` 输入框 UI 与 i18n 文案；不改提交流程、校验规则、API。
- 现状：单一 placeholder，Tailwind 布局在极窄屏幕上会溢出。

## 设计目标
1. 核心：根据视口宽度切换占位文案，覆盖 <640、≥640、≥768、≥1024 四档（≥1024 沿用原文）。
2. 体验：小屏保持简短样例，桌面显示完整示例（NVDA / TSLA / Apple），不影响输入、聚焦与下拉行为。
3. 技术：不新增依赖；仅在前端用 `window.innerWidth`；SSR 初始渲染安全；保持 aria-label、校验逻辑不变。

## 技术约束
- 技术栈：Next.js App Router（React 19）、Tailwind v4（`@theme inline`）。
- 兼容性：桌面/平板/移动端输入、下拉、提交流程正常；resize 时占位文案及时刷新。
- 安全/性能：无新增 API；监听 `resize` 时避免重复 setState。
- 环境：无需新增 env；`npm run lint` / `npm test` 需可正常运行。

## 文案 key
- 新增：`generator.input.placeholder.xs` / `sm` / `md`；`>=1024` 复用现有 `generator.input.placeholder`。
- 文案（zh-Hans）：<640 `请输入`；≥640 `请输入代码/公司，例如 NVDA / TSLA`；≥768 `请输入美股代码或公司名，例如 NVDA / TSLA`；≥1024 `请输入美股代码或公司名，例如：NVDA / TSLA / Apple`。其他语言沿用原有示例。
- 语言：en / ja / ko / zh-Hant / zh-Hans 提供对等文案。

## 工作拆解（G2）
- 增加 breakpoint -> `placeholderVariant` 映射与 `resize` 监听，计算 `placeholderText` 并应用到输入框。
- 在 i18n 中补齐三档断点文案 key，保留原 key 为 ≥1024。
- 手动自测：<640、640-767、768-1023、≥1024 占位符切换；搜索/选择/提交/错误提示不回归。
- （可选）如时间允许跑 `npm run lint` / `npm test`。

## 测试 / 验收
- 功能：不同视口下 placeholder 文案与预期匹配；输入/自动补全/提交/错误提示正常；登录/配额逻辑未受影响。
- 兼容：窗口 resize 后占位文案更新；SSR 不报错。
- 通用：`npm run lint`、`npm test` 通过（如执行）。
