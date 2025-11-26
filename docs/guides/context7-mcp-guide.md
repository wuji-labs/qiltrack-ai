# Context7 MCP 使用指南

## 能力概述
- Context7 MCP 提供在线文档检索能力，可通过 `resolve-library-id` 查找库的唯一 ID，再用 `get-library-docs` 拉取 API 参考、示例或概念指南。
- 适用于需要快速查阅 npm/框架 API（例如 React、Next.js、Supabase 等）的场景，避免手动搜索。

## 安装
### Codex CLI
```
/mcp install context7
```
CLI 会自动执行 `npx -y @upstash/context7-mcp@latest` 并注册服务器。

### Claude Code
1. 打开 `/mcp` → `Manage MCP servers` → `Add server`。
2. **Name**: `context7`
3. **Command**: `npx -y @upstash/context7-mcp@latest`
4. 保存并确认状态为 `connected`。

## 使用流程
1. 运行 `/mcp` → `context7`。
2. 若只知道库名，先执行 `resolve-library-id`，例如输入 `next` 会返回 `/vercel/next.js` 等候选。
3. 获取到 ID 后，调用 `get-library-docs`，示例：
   ```json
   {
     "context7CompatibleLibraryID": "/vercel/next.js",
     "topic": "app-router",
     "mode": "code",
     "page": 1
   }
   ```
   - `mode` 可选 `code`（默认）或 `info`。
   - `page` 用于翻页查看更多章节。
4. 结果会返回结构化文本，可直接粘贴到设计/PR 中，并注明来源。

## 注意事项
- 使用前确认网络允许访问 Context7 服务。
- 若一次返回内容有限，可通过 `topic` 精准过滤或继续翻页。
- 输出内容较长时记得节选并标注库名与章节，保持引用清晰。
