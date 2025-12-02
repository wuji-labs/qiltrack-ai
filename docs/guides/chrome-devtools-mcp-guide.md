# Chrome DevTools MCP 使用指南

## 背景与适用场景

- 提供基于 Chrome DevTools Protocol 的远程浏览器自动化，适合无法直接打开浏览器或需要脚本化交互的场景。
- Codex/Claude 代理均可通过 MCP Server 访问浏览器，执行点击、输入、拖拽、截图、性能分析等操作。

## 环境要求

1. Node.js 18+（`node -v`）。
2. 已安装 Chrome/Chromium 浏览器，允许远程调试。
3. VS Code Codex CLI 或 Claude Code 版本 ≥ 0.6，且启用了 `/mcp` 命令。

## 安装步骤

### Codex CLI（OpenAI Codex）

```
/mcp install chrome-devtools
```

CLI 会自动通过 `npx -y chrome-devtools-mcp@latest` 下载并注册服务器。若之前移除过，可用 `/mcp reinstall chrome-devtools` 重新安装。

### Claude Code（Anthropic）

1. 打开命令面板输入 `/mcp` → `Manage MCP servers`。
2. 选择 `Add server`，填入：
   - **Name**: `chrome-devtools`
   - **Command**: `cmd /c npx -y chrome-devtools-mcp@latest`
3. 保存后在 `/mcp` 面板确认状态为 `connected`。

> 如果是 macOS/Linux，可直接使用 `npx -y chrome-devtools-mcp@latest`，无需 `cmd /c` 包装。

## 使用流程

1. 在本地运行 `npm run dev`，确保站点可通过 `http://localhost:3000` 访问。
2. 在 IDE 中运行 `/mcp` → `chrome-devtools` → `connect`（首次会自动启动一个带远程调试的 Chrome 实例）。
3. 常用命令（Codex/Claude 中以 `/tools` 或相应面板调用）：
   - `navigate`: 打开网址，如 `http://localhost:3000`。
   - `click`, `double_click`, `press_key`: 交互点击或键盘模拟。
   - `fill`, `fill_form`: 输入文本。
   - `drag`, `hover`: 拖拽/悬停元素。
   - `take_screenshot`, `take_snapshot`: 截图或获取可访问性树。
   - `performance_start_trace` / `performance_stop_trace`: 录制性能数据。
4. 完成调试后运行 `chrome-devtools.close_page` 或直接关闭浏览器窗口。

## 常见问题

| 问题                       | 解决方案                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 提示 `Auth: Unsupported`   | MCP 目前无需额外鉴权，可忽略。                                                                                    |
| `chrome-devtools` 无法启动 | 确认 Node/Chrome 版本满足要求，并允许 `npx` 访问网络。必要时先运行 `npx chrome-devtools-mcp@latest --help` 验证。 |
| 指令执行无响应             | 先调用 `take_snapshot` 确认页面结构，或执行 `navigate` 重新加载页面。                                             |
| 浏览器进程残留             | 在任务管理器中手动结束 `chrome.exe`/`chromium`，或运行 `/mcp reset` 重新连接。                                    |

## 注意事项

- 操作会持久化到 `chrome-mcp*.log`，必要时可附加到报告。
- 不要在生产环境执行破坏性脚本；使用前确保目标页面是可测试环境。
- 如果多位成员并行使用 MCP，建议各自开启独立的 Chrome 实例以避免控制权冲突。
