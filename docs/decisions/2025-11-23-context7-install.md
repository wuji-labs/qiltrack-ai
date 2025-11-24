# Context7 MCP 安装标准文档 Snapshot (2025-11-23)

## 背景 / 问题
- 团队准备把 Upstash Context7 MCP 作为默认文档检索工具，但目前缺少一份统一的安装指引，Codex 与 Claude 需要按照同一流程在各自 IDE/CLI 中配置。
- 官方 README 覆盖的安装场景非常多（20+ 客户端），如果直接引用容易造成噪音，不利于团队快速落地。
- 当前环境含 Windows + WSL、Codex CLI、Claude Code、Cursor/VS Code 等多种客户端，需要梳理关键差异（远程 HTTP vs 本地 npx、API Key、验证方式）。

## 目标
1. 生成一份可复制的《Context7 MCP 安装标准文档》，语言为中文、命令为英文，帮助 Codex 与 Claude 各自独立完成安装。
2. 文档应覆盖：
   - 前置条件与 API Key 申请方式；
   - 远程 HTTP 连接与本地 `npx` 方式的通用配置模板；
   - 重点客户端（OpenAI Codex CLI、Claude Code、Cursor、VS Code 系 MCP）的落地步骤与 Windows 差异；
   - 验证、故障排除与常见 flags（`--transport`、`CONTEXT7_API_KEY` 等）。
3. 输出需易于维护：将命令块按场景分组（Quickstart、客户端章节、验证、故障排除），方便复制。

## 技术约束
- Node.js ≥ 18；`npx`、`bunx`、`claude mcp`、`cursor` 等命令需在对应终端可用，Windows 路径使用反斜杠。
- API Key 通过 <https://context7.com/dashboard> 申请，优先存放在 `.env` 或终端安全存储；文档中使用占位符 `YOUR_API_KEY`。
- 远程连接统一指向 `https://mcp.context7.com/mcp`，Headers 使用 `CONTEXT7_API_KEY`；本地连接统一 `npx -y @upstash/context7-mcp --api-key ...`。
- 验证命令优先采用 `npx -y @modelcontextprotocol/inspector ...` 与客户端自带 `list` 命令；禁止在仓库中硬编码实际密钥。

## 交付范围
- 新增文档：`docs/reports/2025-11-23-context7-install.md`（若 `docs/reports` 需要子目录，可放入 `docs/reports/context7/`）。
- 建议结构：
  1. **Quickstart / 前置条件**：列出 Node 版本、API Key、受支持客户端。
  2. **安装路径**：分为“远程 HTTP”“本地 npx”“Windows 特殊配置”，每节提供 JSON/CLI 模板。
  3. **客户端落地**：至少覆盖 OpenAI Codex CLI、Claude Code（桌面/CLI）、Cursor（remote & local）、VS Code（MCP 配置）。可附其他客户端链接以供扩展。
  4. **验证步骤**：统一 `npx -y @modelcontextprotocol/inspector npx @upstash/context7-mcp --api-key ...`、`claude mcp list`、`cursor rules` 检查等。
  5. **常见问题 / 故障排除**：Node 版本不足、`ERR_MODULE_NOT_FOUND`、`npx` Windows 路径、TLS 等（取材自 README “Troubleshooting”）。
- 文档内引用本仓指南（语言约定、CAVR）并提示后续 lint/test 要求（`npm run lint` / `npm test`）。

## 文案 Key
- “前置条件”“远程 HTTP 方式”“本地 npx 方式”“API Key 管理”“验证命令”“常见报错与修复” 等小节标题保持中英文关键字，方便检索。
- 命令块全部使用英文，必要时补充中文注释；JSON 示例保持 `context7` 键名。
- 强调“Codex 与 Claude 需分别在自己的客户端完成安装，并将验证截图附到 CAVR/PR”。

## 测试 / 验收
- 至少提供两条可执行验证指令（Inspector + 客户端自检），并说明预期输出。
- 文档完成后需在 PR / docs 报告中声明“已在 Codex CLI / Claude Code 分别验证”或标记阻塞。
- 本任务不涉及代码运行，但提交前依旧要求 `npm run lint` / `npm test`（由 Claude 在实现阶段执行）。

## 风险与缓解
- **网络限制**：若墙或 TLS 报错，提供 `--experimental-fetch`、代理环境变量示例。
- **Windows npx 路径**：加入 `cmd /c npx` 与 `C:\\Users\\<name>\\AppData\\Roaming\\npm\\npx.cmd` 方案。
- **API Key 泄露**：提醒不要写入仓库，利用 `.env` + `.env.local.example`。
- **范围膨胀**：若新增客户端 >4 个或需图文教程，需触发 mini design review。

## Claude 实施提示
- 以此 Snapshot 为准创建安装文档，遵循仓库语言规范（中文叙述、英文命令）。
- 先建 feature 分支，完成文档后在 `docs/reports/2025-11-23-context7-install.md` 输出 CAVR 风格的验证说明，并在 PR 中引用。
