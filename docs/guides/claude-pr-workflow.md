# Claude 实现工程师 PR 推送工作流指南

> 本指南说明 Claude 在 investor-ai 项目中如何推送 PR，包括工具链检查、标准流程、常见问题与优化方案。

**快速版本**：详见 `CODEX_CLAUDE_COLLAB.md`；本文为详细操作手册。

---

## 1. 工具链检查清单

### 1.1 一键环境检查（推荐）

```bash
# 运行项目提供的环境检查脚本（已更新）
npm run env:check

# 该脚本会自动检查：
# ✓ Node.js 版本（需要 >=18.0.0）
# ✓ npm 版本（需要 >=8.0.0）
# ✓ Git 版本与配置
# ✓ SSH 密钥配置
# ✓ npm 依赖完整性
```

### 1.2 前置环境（必须可用）

```bash
# 检查 Git
git --version
# 预期：git version 2.50+ (Windows/Mac/Linux)

# 检查 Node & npm
node --version
npm --version
# 预期：Node v18+ / npm v8+

# 检查 SSH 连接
ssh -T git@github.com
# 预期：Hi <username>! You've successfully authenticated...

# 检查 Git 配置
git config user.name    # 应显示提交者名称
git config user.email   # 应显示提交者邮箱
```

### 1.3 项目配置检查

```bash
# 检查远程仓库
git remote -v
# 预期：origin  git@github.com:explore0012/investor-ai.git (fetch/push)

# 检查 PR 模板是否存在
ls -la .github/pull_request_template.md
# 预期：存在 .github/pull_request_template.md

# 检查 GitHub Workflows 是否配置
ls -la .github/workflows/
# 预期：至少有 1+ workflow 文件

# 检查 npm 依赖已安装
npm ls --depth=0
# 预期：显示依赖列表，无 ERR
```

---

## 2. 标准 PR 推送流程（实操）

### 2.1 创建或切换到 feature 分支

```bash
# 新建分支（从 main 分支）
git checkout -b feature/your-feature-name

# 或切换到已有分支
git checkout feature/your-feature-name

# 确认当前分支
git branch
# 预期：* feature/your-feature-name
```

**分支命名规范**：
- `feature/<topic>` — 新功能
- `fix/<topic>` — 缺陷修复
- `refactor/<topic>` — 重构
- `docs/<topic>` — 文档更新

### 2.2 进行代码修改

修改必要的文件，按照 Next.js / Tailwind v4 / Vitest 规范编码。

### 2.3 本地代码检查（必须通过）

**核心原则**：提交前必须通过所有检查，否则 PR 会在 CI 中失败，浪费时间。

```bash
# 一键检查（推荐）
npm run pr:ready

# 或逐步检查：
# 1. 检查 lint
npm run lint
# 预期：✓ 无 error（warning 可接受）

# 2. 运行单元测试
npm run test
# 预期：✓ 所有测试通过

# 3. 本地构建（可选但推荐）
npm run build
# 预期：✓ 构建成功无错误
```

**提前失败原则**：如果 lint/test 失败，必须修复后才能推送。不要把问题留给 CI。

**常见错误及快速修复**：
```bash
# Lint 错误：代码风格不符合规范
npm run lint -- --fix
# 这会自动修复大部分风格问题（如缩进、引号等）

# 依赖安装错误：node_modules 损坏或过期
rm -rf node_modules package-lock.json
npm install

# 类型错误：TypeScript 类型不匹配
npm run build
# 仔细阅读错误信息，可能需要添加类型注解
```

### 2.4 提交代码

```bash
# 查看当前修改
git status

# 添加变更文件
git add <file1> <file2>
# 或全部添加（谨慎）
git add .

# 提交（遵循项目提交规范）
git commit -m "feat: add feature description

Optional detailed explanation here."
```

**提交信息规范**：
- `feat:` — 新功能
- `fix:` — 缺陷修复
- `refactor:` — 重构
- `docs:` — 文档
- `test:` — 测试
- `chore:` — 配置/构建

### 2.5 同步 main 分支（推送前必做）

```bash
# 拉取最新 main
git fetch origin

# 变基到 main（保持提交历史整洁）
git rebase origin/main

# 如有冲突，手工解决后继续
# git rebase --continue

# 确认无改动未提交
git status
# 预期：On branch feature/xxx, nothing to commit
```

### 2.6 推送到远程

```bash
# 首次推送该分支
git push origin feature/your-feature-name

# 后续推送（若有新改动）
git push origin feature/your-feature-name
# 或使用当前分支简写
git push origin HEAD

# 预期输出示例：
# remote: Create a pull request for 'feature/xxx' on GitHub by visiting:
# remote: https://github.com/explore0012/ai-report/pull/new/feature/xxx
```

### 2.7 创建 PR（选择方案）

#### **方案 A：使用 GitHub CLI（推荐）**

```bash
# 前提：已安装 gh CLI
gh --version

# 创建 PR（自动填充 PR 模板）
gh pr create --fill

# 或手工指定标题和描述
gh pr create \
  --title "feat: your feature title" \
  --body "## Summary\n- Point 1\n- Point 2" \
  --base main
```

#### **方案 B：访问 GitHub 网页创建 PR**

Git 推送时会输出链接：
```
https://github.com/explore0012/ai-report/pull/new/feature/your-feature-name
```

访问该链接，GitHub 会自动：
1. 检测到你的分支
2. 加载 `.github/pull_request_template.md` 模板
3. 让你填写 CAVR、验证、风险等信息

#### **方案 C：使用 Git 别名加速**

```bash
# 一次性设置别名（全局）
git config --global alias.pr \
  '!git push origin $(git rev-parse --abbrev-ref HEAD) && \
    echo "✅ 分支已推送，访问：https://github.com/explore0012/ai-report/pull/new/$(git rev-parse --abbrev-ref HEAD)"'

# 之后只需一条命令
git pr
```

---

## 3. PR 描述填写规范

### 3.1 使用 PR 模板

提交 PR 时，`.github/pull_request_template.md` 会自动加载。遵循以下结构：

```markdown
## Summary
- Snapshot / Decision doc: docs/decisions/2025-11-26-your-topic.md
- Feature branch: feature/your-topic
- Primary report doc: docs/reports/2025-11-26-your-topic-cavr.md

## CAVR

### Context
背景要点、范围界定、依赖/约束

### Actions
- [ ] 主要实现步骤 1
- [ ] 主要实现步骤 2
- [ ] 运行 lint + test

### Verification
- [ ] npm run lint → ✓ 通过 / ❌ 失败（列出问题）
- [ ] npm test → ✓ 通过 / ❌ 失败（列出问题）
- [ ] 手动验证 → 链接到 docs/reports 中的截图

### Risks
- 剩余风险 / 待补验证 / 需 Codex 指派事项
```

### 3.2 终端汇报三行格式

完成后，在终端输出 `@Codex` 汇报（符合 CODEX_CLAUDE_COLLAB.md 第 5 章）：

```
@Codex
Report: docs/reports/2025-11-26-your-topic-cavr.md
Status: 完成实现并通过 lint/test，PR #XX 已开启
Next: 请审阅 PR 并反馈或合并
```

---

## 4. 工具链完整对照表

| 步骤 | 工具 | 状态 | 命令示例 |
|------|------|------|---------|
| 分支管理 | Git | ✅ 必有 | `git checkout -b feature/xxx` |
| 修改编辑 | VS Code / IDE | ✅ 必有 | 编辑器打开文件 |
| Lint 检查 | npm (ESLint) | ✅ 必有 | `npm run lint` |
| 单元测试 | npm (Vitest) | ✅ 必有 | `npm test` |
| 提交代码 | Git | ✅ 必有 | `git commit -m "..."` |
| 推送分支 | Git + SSH | ✅ 必有 | `git push origin feature/xxx` |
| 创建 PR | GitHub CLI 或 网页 | ⚠️ 二选一 | `gh pr create --fill` 或 浏览器 |
| PR 模板 | GitHub | ✅ 必有 | `.github/pull_request_template.md` |

**说明**：✅ 必有 = 项目已配置，必须可用；⚠️ 二选一 = 至少一种可用

---

## 5. 故障排查

### 问题 1：`git push` 时显示"Permission denied"

**原因**：SSH 密钥未配置或 GitHub 不信任该密钥。

**解决方案**：
```bash
# 验证 SSH 连接
ssh -T git@github.com

# 如失败，重新生成密钥
ssh-keygen -t ed25519 -C "your-email@example.com"

# 添加到 SSH Agent
ssh-add ~/.ssh/id_ed25519

# 将公钥上传到 GitHub Settings > SSH Keys
cat ~/.ssh/id_ed25519.pub
```

### 问题 2：`npm run lint` 或 `npm test` 失败

**原因**：代码不符合项目规范或依赖缺失。

**解决方案**：
```bash
# 清除 node_modules 并重新安装
rm -rf node_modules package-lock.json
npm install

# 重新运行 lint/test
npm run lint
npm test
```

### 问题 3：`gh pr create` 命令不存在

**原因**：GitHub CLI 未安装。

**解决方案**：安装 GitHub CLI（见第 6 节）或使用网页创建 PR。

### 问题 4：`git rebase origin/main` 冲突

**原因**：本地分支与 main 有代码冲突。

**解决方案**：
```bash
# 查看冲突文件
git status

# 手工编辑冲突文件，保留所需代码

# 标记为已解决
git add <conflicted-file>

# 继续 rebase
git rebase --continue

# 如需中止 rebase
git rebase --abort
```

### 问题 5：`git push` 无响应或提示 `aborted by user`

**原因**：常见于 push 命令在终端被意外中断（Ctrl+C、SSH 会话断开），或网络缓慢导致长时间无输出。

**解决方案**：
```bash
# 1. 确认当前分支仍有需要推送的提交
git status

# 2. 如果刚刚中断 push，直接重新执行
git push --set-upstream origin feature/your-branch

# 3. 若终端显示 read-only 或权限不足，先运行
ssh -T git@github.com
# 确认 SSH 仍有效，再重新 push

# 4. 若多次失败，可改用 HTTPS（临时）或在其它终端再次执行
# git push https://github.com/explore0012/ai-report.git HEAD:feature/your-branch
```

---

## 6. 可选优化方案

### 6.1 安装 GitHub CLI（推荐）

**Windows 用户**：
```bash
# 用 Scoop
scoop install gh

# 或用 Choco
choco install gh

# 验证
gh --version
```

**Mac 用户**：
```bash
brew install gh
```

**Linux 用户**：
```bash
# Ubuntu/Debian
sudo apt install gh

# 或手动安装（见 https://cli.github.com）
```

**首次认证**：
```bash
gh auth login --web
# 或交互式
gh auth login
```

### 6.2 设置 Git Alias

```bash
# 简化 PR 推送命令
git config --global alias.pr \
  '!git push origin $(git rev-parse --abbrev-ref HEAD) && echo "✅ 已推送"'

# 使用
git pr

# 简化 status 查看
git config --global alias.st status

# 简化 log 查看
git config --global alias.lg "log --oneline -10"
```

### 6.3 配置 Pre-commit Hook（自动检查）

创建 `.git/hooks/pre-commit`（Git 根目录）：

```bash
#!/bin/bash
echo "Running lint and tests before commit..."

npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Lint failed, commit aborted"
  exit 1
fi

npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed, commit aborted"
  exit 1
fi

echo "✅ All checks passed"
```

使其可执行：
```bash
chmod +x .git/hooks/pre-commit
```

### 6.4 快速脚本 `scripts/pr-push.sh`

创建 `scripts/pr-push.sh`：

```bash
#!/bin/bash
set -e

echo "🔍 Running lint..."
npm run lint

echo "🧪 Running tests..."
npm test

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📤 Pushing branch: $BRANCH"
git push origin $BRANCH

echo "✅ All done! Create PR at:"
echo "https://github.com/explore0012/ai-report/pull/new/$BRANCH"
```

使用：
```bash
bash scripts/pr-push.sh
```

---

## 7. 完整工作流示例

### 场景：实现新功能 "Add User Profile Page"

```bash
# 1️⃣ 创建分支
git checkout -b feature/user-profile-page

# 2️⃣ 编辑代码
# ... 使用 IDE 修改文件 ...

# 3️⃣ 检查 lint/test
npm run lint
npm test

# 4️⃣ 提交
git add app/profile/page.tsx lib/services/user.ts
git commit -m "feat: add user profile page with auth guard"

# 5️⃣ 同步 main
git fetch origin
git rebase origin/main

# 6️⃣ 推送
git push origin feature/user-profile-page

# 7️⃣ 创建 PR（选一）
#    选项 A：使用 gh
gh pr create --fill

#    选项 B：打开网页
open "https://github.com/explore0012/ai-report/pull/new/feature/user-profile-page"

# 8️⃣ 填写 PR 模板（包括 CAVR、验证、风险）

# 9️⃣ 汇报 Codex
# @Codex
# Report: docs/reports/2025-11-26-user-profile-cavr.md
# Status: 完成实现，lint/test 已通过，PR #42 已开启
# Next: 请审阅并反馈
```

---

## 8. 快速参考

### 最简单的 PR 推送流程（5 步）

```bash
# 1. 创建分支
git checkout -b feature/my-feature

# 2. 修改并提交
git add . && git commit -m "feat: describe change"

# 3. 同步 main
git fetch origin && git rebase origin/main

# 4. 推送
git push origin feature/my-feature

# 5. 创建 PR（gh 或网页）
gh pr create --fill
```

### 常用命令速查

```bash
# 查看当前分支
git branch

# 查看修改状态
git status

# 查看修改内容
git diff

# 查看提交日志
git log --oneline -10

# 切换分支
git checkout <branch>

# 更新远程分支列表
git fetch origin

# 同步最新 main
git rebase origin/main

# 推送当前分支
git push origin $(git rev-parse --abbrev-ref HEAD)
```

---

## 9. 相关文档

- **协作手册**：`CODEX_CLAUDE_COLLAB.md` — 双方角色、职责、沟通规范
- **快速启动**：`docs/guides/codex-claude-quickstart.md` — 1 页速查版
- **PR 模板**：`.github/pull_request_template.md` — CAVR 填写指南
- **GitHub Workflows**：`.github/workflows/` — CI/CD 自动检查

---

## 10. FAQ

**Q1：我推送后能改 PR 吗？**
A：可以。继续在本地修改，重新提交并推送到同一分支，PR 会自动更新。

```bash
git add .
git commit -m "fix: address review feedback"
git push origin feature/xxx
```

**Q2：如何放弃该分支？**
A：删除本地和远程分支。

```bash
git checkout main
git branch -D feature/xxx
git push origin --delete feature/xxx
```

**Q3：我想在 PR 合并前拉取最新 main 再检查一次？**
A：可以，rebase 并重新测试。

```bash
git fetch origin
git rebase origin/main
npm test
git push origin feature/xxx -f  # 注意：-f 仅在私人分支使用
```

**Q4：能多个 PR 同时开吗？**
A：可以。为每个功能创建独立分支。但同时维护多个分支会增加复杂度，建议优先合并一个再开下一个。

**Q5：我提交时写错了 commit message，能改吗？**
A：推送前可改；推送后改需要用 `git commit --amend` 并强制推送（仅限私人分支）。

```bash
git commit --amend -m "新 message"
git push origin feature/xxx -f
```

---

**最后更新**：2025-11-26
**适用分支**：feature/* / main
**维护者**：Codex + Claude
