# Tailwind MCP 握手失败 Architecture Snapshot（2025-11-24）

## 问题背景
- 症状：Claude CLI 启动时提示 “MCP client for `tailwind` failed to start: handshaking with MCP server failed: connection closed: initialize response”。
- 近期状态：2025-11-23 报告（`docs/reports/2025-11-23-tailwind-mcp.md`）记录 tailwind MCP 已通过 `npx -y tailwindcss-mcp-server` 配置并成功连接。
- 可能触发：配置回退为错误包名（`tailwindcss-mcp`）、npx 下载失败/噪声输出破坏 stdio、Node 版本或包更新导致进程崩溃。

## 设计目标
- 恢复 tailwind MCP 至 Connected 状态，确保 Claude Code 可查询 Tailwind 工具类/文档。
- 保持 context7 MCP 不受影响；不改动业务代码。
- 形成可复用的配置/验证记录，便于新环境复现。

## 技术约束
- 环境：Windows + PowerShell，Node ≥ 18（tailwindcss-mcp-server 依赖）；网络可用但需考虑 npx 首次下载延迟。
- 配置位置：`C:\Users\<user>\.claude.json`（项目级）与 `.claude/settings.local.json`（本地覆盖）。
- 协作：遵循 CODEX_CLAUDE_COLLAB，Claude 在独立 feature 分支 + PR，交付 CAVR。
- 产物：仅涉及 MCP 配置与文档，无需触碰 app 源码/样式。

## 文案 key
- 新增复盘/日志：`docs/reports/2025-11-24-tailwind-mcp-handshake.md`（CAVR + 验证命令输出）。
- 若需更新 Setup/README，可补充 tailwind MCP 命令（含版本 pin / 全局安装选项）。

## 测试要求
- `claude mcp list --verbose` 显示 `tailwind: … Connected`。
- `claude mcp get tailwind` 返回 command/args 正确。
- 直接运行 `tailwindcss-mcp-server --stdio`（或 `npx -y tailwindcss-mcp-server@<pin> --stdio`）可启动且无崩溃；终端日志记录在报告。
- 仅工具链变更，无需 `npm run lint` / `npm test`。

## 推荐修复路径
1) 诊断：检查 `~/.claude.json` 的 `mcpServers.tailwind` 是否仍为 `npx -y tailwindcss-mcp-server`（排除误写为 `tailwindcss-mcp`）；执行 `claude mcp list --verbose` 捕获完整错误；确认 `node -v` 和 `npm view tailwindcss-mcp-server version`。
2) 清理：`claude mcp remove tailwind -s local` 清除旧配置。
3) 稳定配置：
   - 首选：`claude mcp add tailwind -- npx -y tailwindcss-mcp-server@<pin>`（pin 到当前可用版本，减少未来破坏性更新）。
   - 若 npx 噪声影响 stdio，改用全局：`npm install -g tailwindcss-mcp-server@<pin>`，再设 command 为 `tailwindcss-mcp-server`，无 args。
4) 验证：重跑 `claude mcp list` / `claude mcp get tailwind`；手动 `tailwindcss-mcp-server --stdio` 确认进程不闪退；将命令与输出写入新报告。
5) 收尾：报告落地 `docs/reports/2025-11-24-tailwind-mcp-handshake.md`（含 CAVR、验证截图/输出）；如调整命令格式或版本 pin，更新 README/SETUP 说明。
