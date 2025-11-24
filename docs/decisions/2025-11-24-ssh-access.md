# Architecture Snapshot - Git SSH Access

## 背景
- 现状：仓库 `origin` 已切换为 SSH `git@github.com:explore0012/ai-report.git`。
- 问题：当前机器没有在 GitHub 账户中登记 SSH 公钥，导致 AI 无法推送/提 PR。

## 设计目标
- 确保本机能通过 SSH 认证到 GitHub，并完成 push（含 `git push --dry-run` 验证）。
- 用户侧操作最小化：仅需在 GitHub Web UI 添加公钥。
- 保持远端地址使用 SSH，避免再回退到 HTTPS。

## 技术约束
- 需要在本机生成或复用 SSH 密钥（推荐 `ed25519`）。
- GitHub 端必须由用户登录账户添加公钥；AI 无法代替完成 Web 操作。
- 网络需能访问 `github.com` 的 SSH（端口 22/443）。

## 文案 key
- 生成密钥（如不存在）：`ssh-keygen -t ed25519 -C "your_email@example.com"`
- 加载密钥到 agent：`Start-Service ssh-agent` + `ssh-add $env:USERPROFILE\\.ssh\\id_ed25519`
- 查看公钥以便复制：`Get-Content $env:USERPROFILE\\.ssh\\id_ed25519.pub`
- 验证 SSH：`ssh -T git@github.com`
- 验证推送权限：`git push --dry-run`

## 测试要求
- `ssh -T git@github.com` 返回认证成功提示。
- `git push --dry-run` 在当前仓库通过且无权限错误。
