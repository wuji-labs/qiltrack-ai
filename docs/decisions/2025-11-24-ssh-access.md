# Decision Record - Git SSH Access Setup

## 背景
- 现状：仓库 `origin` 已切换为 SSH `git@github.com:explore0012/ai-report.git`。
- 问题：当前机器没有在 GitHub 账户中登记 SSH 公钥，导致无法推送代码。
- 决策日期：2025-11-24

## 设计目标
- 确保本机能通过 SSH 认证到 GitHub，并完成推送（含 `git push --dry-run` 验证）。
- 用户侧操作最小化：仅需在 GitHub Web UI 添加公钥。
- 保持远端地址使用 SSH，避免回退到 HTTPS。

## 技术约束
- 需要在本机生成 SSH 密钥（推荐 `ed25519`）。
- GitHub 端必须由用户登录账户添加公钥；无法自动完成 Web 操作。
- 网络需能访问 `github.com` 的 SSH（端口 22）。
- Windows 环境需启动 ssh-agent 服务。

## Context（上下文）
- 仓库地址：`git@github.com:explore0012/ai-report.git`
- 当前分支：`feat/supabase-deployment`
- 本地环境：Windows + Git Bash
- 需求来源：@Codex 关于 SSH key 推送权限验证

## Actions（已执行操作）
1. **检查现有密钥**：`~/.ssh/` 不存在 `id_ed25519` 密钥
2. **生成新密钥**：`ssh-keygen -t ed25519 -C "explorer@example.com" -f ~/.ssh/id_ed25519 -N ""`
   - 公钥指纹：`SHA256:8nj8UnzqdUYStpGmkvO05wg0jL0wwEsoa0TwD3JL/O8`
3. **启动 SSH agent**：`eval "$(ssh-agent -s)"`
4. **加载私钥**：`ssh-add ~/.ssh/id_ed25519` ✅ Identity added
5. **GitHub 公钥添加**：用户登录 GitHub Settings → SSH and GPG keys → New SSH key，粘贴公钥
6. **验证 SSH 连接**：`ssh -T git@github.com` → ✅ `Hi explore0012! You've successfully authenticated...`
7. **验证推送权限**：`git push --dry-run --set-upstream origin feat/supabase-deployment`
   - ✅ Would set upstream
   - ✅ `[new branch] feat/supabase-deployment -> feat/supabase-deployment`
8. **文档更新**：在 `README.md` 的「开发指南」section 新增「SSH 配置（推送代码）」subsection（第 34–76 行）
   - 包含 5 个配置步骤：密钥生成 → Agent 启动 → 公钥添加 → 连接验证 → 推送命令
9. **提交与推送**：
   - `2f46c90` - docs: add SSH key setup guide to README
   - `bb9d101` - docs: add ssh access snapshot
   - ✅ 已推送至 `origin/feat/supabase-deployment`

## Verification（验证结果）
### 本地验证
```
$ ssh -T git@github.com
Hi explore0012! You've successfully authenticated, but GitHub does not provide shell access.

$ git log --oneline -3
bb9d101 docs: add ssh access snapshot
2f46c90 docs: add SSH key setup guide to README
0c91f2d docs: add final handoff checklist for Hosted deployment completion

$ git status
On branch feat/supabase-deployment
Your branch is up to date with 'origin/feat/supabase-deployment'.
nothing to commit, working tree clean
```

### 推送验证
```
To github.com:explore0012/ai-report.git
 * [new branch]      feat/supabase-deployment -> feat/supabase-deployment
branch 'feat/supabase-deployment' set up to track 'origin/feat/supabase-deployment'.
```

## Risks（风险 / 已处理）
1. ✅ **SSH agent 生命周期**：当前 shell session 有效；新开 terminal 需重新 `ssh-add`
   - 建议长期方案：在用户 shell profile 中添加 ssh-agent 启动逻辑（如 `.bashrc` 或 `.zshrc`）
2. ✅ **密钥丢失风险**：未加密保存在 `~/.ssh/id_ed25519`
   - 建议：定期备份，权限检查 `ls -la ~/.ssh/id_ed25519` 应为 `600`
3. ✅ **多机器协作**：如其他开发者需要推送，需各自添加各自的公钥
   - 当前已处理：文档在 README 中说明配置步骤

## Decision（最终决策）
- SSH 密钥配置已完成并验证通过
- README 已更新，后续开发者可按文档自行配置
- feat/supabase-deployment 分支已推送至远程
- 建议 Codex review 决策文档内容是否完整
