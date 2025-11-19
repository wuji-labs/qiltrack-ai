# Repository Guidelines

## Project Structure & Module Organization
- `app/`：Next.js App Router 入口，`layout.tsx` 管理全局字体与样式，`page.tsx` 提供唯一页面（搜索股票、展示报告、复制/导出功能）。  
- `app/api/`：包含 `search`, `quote`, `report` 三个路由，统一从 Finnhub/ OpenRouter 拉数据。  
- `public/`：静态资源 (`favicon.ico` 等)。`node_modules/、.next/` 属构建输出；`test-api.js` 用于独立验证 OpenAI SDK。

## Build, Test, and Development Commands
- `npm run dev`：在 `localhost:3000` 启动开发服务器。  
- `npm run build`：生成 `.next` 生产构建。  
- `npm start`：基于上一步构建启动 Node 进程。  
- `npm run lint`：执行 ESLint（Next core-web-vitals 规则）。运行前确保 `.env.local` 已包含 Finnhub 与 OpenRouter API Key。

## Coding Style & Naming Conventions
- 语言为 TypeScript + React 19 函数组件；Hook/state 命名遵循 `useXxx`、`[value, setValue]`。  
- 使用 Tailwind CSS v4 `@theme inline` 管控变量；全局 CSS 在 `app/globals.css`。  
- 使用 ESLint 9 + `eslint-config-next`，提交前运行 `npm run lint`。遵循 Prettier 默认 2 空格缩进和 `camelCase` 命名。

## Testing Guidelines
- 目前缺少正式测试框架；手动验证 `app/page.tsx` 功能以及 `test-api.js` 的 API 访问。  
- 若添加测试，建议放入 `__tests__/`，命名 `*.test.ts(x)` 并使用 Next 推荐的 Vitest/Jest 组合。文档测试可通过 `npm run lint` 覆盖。

## Commit & Pull Request Guidelines
- Commit 信息保持英文动词开头（如 `feat: add docx export fallback`），描述范围与改动。  
- PR 内容需包含：变更摘要、相关 Issue/需求链接、手动验证说明（含命令和截图，如报告生成流程）、若动到 API Key 配置需标注安全影响。  
- 代码评审前请确认依赖安装、`npm run lint` 结果、环境变量说明已更新到 README/部署脚本。
