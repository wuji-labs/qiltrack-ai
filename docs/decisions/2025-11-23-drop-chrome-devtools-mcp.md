# Chrome DevTools MCP 下线决议 (2025-11-23)

## 背景 / 动机

- 项目当前包含 Chrome DevTools MCP 脚本与依赖（scripts/devtools-mcp.ps1/.sh、npm mcp:* 命令、chrome-devtools-mcp 包）。
- 这些脚本在 Windows/WSL 跨主机维护中产生额外复杂度，不符合"一次设置、开箱即用"的原则。
- npm scripts 中的 mcp:* 命令污染了命名空间，且文档中大量说明与 MCP 相关，增加新开发者认知负担。
- 用户已验证标准工作流（npm run dev + 浏览器 DevTools）满足全部需求；MCP 方案为可选优化，暂无强硬用户诉求。

## 决策

完整下线 Chrome DevTools MCP 工具链，包括：
1. 删除所有脚本文件：scripts/devtools-mcp.ps1/.sh、demo-chrome-debug.ps1、start-debug-chrome.ps1、DEVTOOLS_DEMO.md
2. 从 package.json 移除 chrome-devtools-mcp 依赖和所有 mcp:* npm 脚本
3. 从 README.md、AGENTS.md 等文档中删除 MCP 调试说明
4. 重新生成 package-lock.json，清除 MCP 依赖树
5. 保留下线决议与 CAVR 报告作为历史记录

## 技术约束

- 必须保留 Node 18+、Next.js 16、TypeScript、React 19、Tailwind v4 为核心开发栈；npm run dev/lint/test/build 必须可用
- 删除脚本过程中不得破坏 .claude 自定义配置；若需清理，仅移除 MCP 相关条目
- 下线后代码库应该"看起来从未引入过 MCP"，即：活跃代码零 MCP 引用；仅保留决议与报告文件供查询

## 验收标准

- ✅ `npm run lint` 0 error（允许预期的 warnings）
- ✅ `npm test` 全部通过
- ✅ `rg "mcp|chrome-devtools-mcp|devtools-mcp"` 仅在 docs/decisions 和 docs/reports 中有匹配（无活跃代码引用）
- ✅ package.json 中不含 chrome-devtools-mcp 依赖或 mcp:* 脚本
- ✅ README.md、AGENTS.md 中不含 MCP 调试说明；新增一句"已下线"说明，指向决议文件

## 关键决策点

- **删除 vs 标记弃用**：采用完全删除，理由是 MCP 为实验性方案，无生产依赖
- **历史文档处理**：保留下线决议和 CAVR 报告，删除详细讲解 devtools-mcp 用法的报告（避免新开发者照搬）
- **分支策略**：在 feature 分支上完成清理，通过 PR 提交审查，禁止直推 main

## 时间线

- **执行**：2025-11-23（实施清理、验证 lint/test）
- **审查**：Codex 对 CAVR 与 PR 评审
- **合并**：通过审查后合并至 main

