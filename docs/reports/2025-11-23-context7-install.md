# Context7 MCP 安装标准文档（2025-11-23）

> 依据 `docs/decisions/2025-11-23-context7-install.md` Snapshot，本文为 Codex 与 Claude 在各自 CLI/IDE 中安装 Upstash Context7 MCP 的统一指引。叙述统一中文，命令/配置保持英文。

---

## 1. Quickstart / 前置条件

- **Node.js ≥ 18**：确保 `node -v` 输出满足要求，`npx`/`bunx`/`deno`/`claude mcp` 等命令可用。
- **API Key**：访问 <https://context7.com/dashboard> 申请 Context7 API Key，建议存入安全存储或 `.env`；文档示例用 `YOUR_API_KEY` 占位。
- **网络可达**：远程模式需访问 `https://mcp.context7.com/mcp`，若受代理/防火墙影响请先打通 `443`。
- **目标客户端**：至少覆盖 OpenAI Codex CLI、Claude Code（CLI）、Cursor、VS Code MCP；其它客户端可参照同一配置模板。
- **验证准备**：安装 `@modelcontextprotocol/inspector`（或复用 npx），用于快速检测本地/远程 Context7 服务。

---

> ℹ️ **项目当前约定**：Codex / Claude 默认使用“本地 npx 方式”并不配置 API Key（继续使用 Context7 免费速率）。如果未来需要更高配额，可再启用下方远程 HTTP / API Key 方案。

## 2. 安装路径概览

### 2.1 远程 HTTP 方式（可选）

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

- 适用于支持 HTTP/streamableHttp 传输的客户端（Cursor、VS Code、部分 CLI）。
- 优点：无需安装本地依赖；缺点：依赖网络、API Key 放在配置文件中需注意权限（本项目默认 **不** 配置 API Key）。

### 2.2 本地 npx 方式（离线/自管）

```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

- 在 Windows 上可替换为 `"command": "powershell", "args": ["/c", "npx", "-y", "@upstash/context7-mcp"]` 或直接给出 `npx.cmd` 绝对路径。
- 优点：可在无公网或内网环境使用；缺点：首次运行下载依赖稍慢，需要本地 Node 环境健康。

### 2.3 Windows 特殊配置提示

1. **npx 路径问题**：若 CLI 找不到 npx，可使用绝对路径：
   ```toml
   command = "C:\\Users\\<name>\\AppData\\Roaming\\npm\\npx.cmd"
   ```
2. **环境变量**：也可通过 `env` 字段传入 `CONTEXT7_API_KEY`，避免在 args/headers 中明文出现。
3. **代理**：若走企业代理，可设置 `HTTPS_PROXY`/`https_proxy` 环境变量，Context7 MCP 会自动读取。

---

## 3. 客户端落地说明

### 3.1 OpenAI Codex CLI（`config.toml`）

```toml
[mcp_servers.context7]
# 远程 HTTP
url = "https://mcp.context7.com/mcp"
type = "http"
http_headers = { "CONTEXT7_API_KEY" = "YOUR_API_KEY" }

# 若需切换至本地 npx，请改用：
# command = "npx"
# args = ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
# startup_timeout_ms = 40000
```

- Windows 若需兼容 cmd，可改为 `command = "cmd"` + `args = ["/c", "npx", ...]`。
- 建议在 Codex CLI 中运行 `mcp info context7` 确认已列出 `resolve-library-id` / `get-library-docs`。

### 3.2 Claude Code（CLI / Desktop）

```powershell
# 远程方式
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: YOUR_API_KEY"

# 本地 npx 方式
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key YOUR_API_KEY
```

- 运行 `claude mcp list` 应显示 `context7`，并可用 `claude mcp info context7` 查看工具列表。
- 若在 Claude Desktop，需要到设置 -> Connectors -> Add Custom Connector，填写相同 URL 即可。

### 3.3 Cursor（全局/项目 MCP）

`~/.cursor/mcp.json`（全局）或 `<project>/.cursor/mcp.json`（项目）：

```json
{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

本地运行方式：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

> 提示：Cursor 1.0 以后可点击 Context7 README 中的 “Install MCP Server” 按钮实现一键安装，仍需在设置页检查 API Key 是否已写入。

### 3.4 VS Code（Copilot Chat MCP）

`settings.json`（VS Code Insider/Copilot Chat 支持 MCP 的版本）：

```json
"mcp": {
  "servers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

本地 npx 变体：

```json
"mcp": {
  "servers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

> 若 VS Code 报 “request timed out”，可把 `"startup_timeout_ms": 40000` 加入配置，并确认 `npx` 路径可执行。

---

## 4. 验证步骤

1. **Inspector 快速校验**（适用于本地 npx）：

   ```bash
   npx -y @modelcontextprotocol/inspector npx -y @upstash/context7-mcp --api-key YOUR_API_KEY
   ```

   - 预期输出：`resolve-library-id` 与 `get-library-docs` 两个工具，返回 “Ready for requests”。

2. **客户端自检**：
   - **Codex CLI**：`mcp info context7` / `mcp query context7 --tool resolve-library-id --args '{"libraryName":"next"}'`
   - **Claude Code CLI**：运行 `claude mcp list`，确保出现 `context7`；可发一条指令 `use context7 查询 next.js routing` 验证自动注入。
   - **Cursor**：在 Rules 中添加 `Always use context7 ...`，然后发 `use context7 next middleware`，应自动出现 MCP 回执。
   - **VS Code**：在 Chat 面板输入 “use context7 获取 Prisma 示例”，查看上下文中是否注入最新文档。

3. **命令提示**：安装完成后，可在各客户端的 rule/配置中新增一条说明：“遇到库/API 相关问题自动调用 context7”。

---

## 5. 常见问题 / 故障排除

| 问题                   | 现象                                                           | 解决方案                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Node 版本过低          | `SyntaxError: Unexpected token '??'` 或 `fetch is not defined` | 升级到 Node ≥ 18（可用 nvm / fnm），或改用 bunx。                                                                                             |
| `ERR_MODULE_NOT_FOUND` | npx 启动报模块不存在                                           | 使用 `bunx -y @upstash/context7-mcp` 或 `npx --node-options=--experimental-vm-modules ...`；必要时先 `npm install -g @upstash/context7-mcp`。 |
| Windows 找不到 npx     | `command not found: npx`                                       | 在配置中写入绝对路径（`C:\Users\<你>\AppData\Roaming\npm\npx.cmd`），或通过 `cmd /c npx`。                                                    |
| TLS/代理问题           | 远程 HTTP 连接报 TLS 错误                                      | 设置 `--node-options=--experimental-fetch`，或在系统中配置 `HTTPS_PROXY`；必要时换成本地 npx 模式。                                           |
| API Key 泄露风险       | 配置文件明文存储 Key                                           | 使用环境变量 (`env` 字段) 或密码管理器；注意不要将配置文件提交到版本库。                                                                      |
| 大量客户端             | 需要安装 >4 个客户端                                           | 先完成核心 4 个（Codex/Claude/Cursor/VS Code），额外客户端需经过 mini design review，并把配置示例写入附录。                                   |

---

## 6. CAVR 记录模板（供 Codex / Claude 使用）

每位成员完成安装后请在 PR 或 docs 报告中更新以下内容：

```
Context：<CLI/IDE>
Actions：
  - <命令/配置>
Verification：
  - Inspector 输出 / 客户端 "context7 ready"
  - `npm run lint` / `npm test` 结果（实现文件发生改动时）
Risks：
  - <如有遗留问题/后续计划>
```

---

## 7. Claude Code 安装验证报告（2025-11-23）

### Context（上下文）

在 Claude Code CLI 中安装 Context7 MCP，使用本地 npx 方式（免费速率，无需 API Key）。

### Actions（执行行动）

**第一步**：移除旧配置

```bash
claude mcp remove context7
```

输出：`Removed MCP server "context7" from local config`

**第二步**：安装本地 npx 版本

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

输出：

```
Added stdio MCP server context7 with command: npx -y @upstash/context7-mcp to local config
File modified: C:\Users\xiuluart\.claude.json [project: D:\Projects\investor-ai]
```

### Verification（验证结果）

**命令**：`claude mcp list`

**输出**：

```
Checking MCP server health...

context7: npx -y @upstash/context7-mcp - ✓ Connected
```

**验证状态**：✅ 安装成功

- MCP 服务已在本地注册
- 连接状态正常（✓ Connected）
- npx 命令可正确执行并拉取依赖

### 配置文件

**位置**：`C:\Users\xiuluart\.claude.json` (project-level)

**内容**：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Risks（风险与缓解）

| 风险             | 缓解方案                             | 状态 |
| ---------------- | ------------------------------------ | ---- |
| npx 首次下载耗时 | 已缓存本地，后续启动快速             | ✅   |
| 免费速率限制     | 足够开发和测试使用                   | ✅   |
| Windows 兼容性   | 已验证在 Windows PowerShell 工作正常 | ✅   |
| 网络连接依赖     | Upstash 服务稳定，若超时检查防火墙   | ✅   |

### 备注

- 无需配置 API Key，保持免费使用
- 若未来需要更高速率，可通过 `--api-key` 参数或远程 HTTP 方式升级
- 已准备就绪用于文档检索任务

---

## 8. 下一步 / 注意事项

- Codex 与 Claude 必须分别在 **各自的 CLI** 完成安装，建议截屏或保存命令输出，作为后续验证凭证。
- 若未来增添新客户端或自动化脚本，请复用本标准文档的结构（Quickstart / 安装路径 / 客户端 / 验证 / FAQ）并在 Snapshot 中记录。
- 提交 PR 之前仍需跑通仓库现有 `npm run lint`、`npm test`（虽然本次文档更新不触发代码执行，流程照旧）。

> 📌 若安装过程中遇到未覆盖的问题，请在 `docs/reports/` 下追加 FAQ，或在 Snapshot 中触发 mini design review，避免口头漂移。
