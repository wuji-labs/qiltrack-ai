# 项目开发环境指南

> 本文档描述 **qiltrack-ai** 项目的开发环境要求、检查方法、常见问题及优化方案。
> 该指南面向所有项目成员，确保开发环境一致，提高协作效率并减少环境相关的错误。

---

## 1. 环境要求速查表

| 工具                    | 最小版本 | 推荐/实际版本 | 检查命令             |
| ----------------------- | -------- | ------------- | -------------------- |
| **Node.js**             | 18.0.0   | v25.2.1+ ✅   | `node --version`     |
| **npm**                 | 8.0.0    | 11.6.2+ ✅    | `npm --version`      |
| **Git**                 | 2.40.0   | 2.52.0+ ✅    | `git --version`      |
| **Python** (可选)       | 3.8.0    | 3.14.0+ ✅    | `python --version`   |
| **GitHub CLI** (可选)   | 1.12.0   | 2.83.1+ ✅    | `gh --version`       |
| **Supabase CLI** (可选) | 1.0.0    | 2.62.10+ ✅   | `supabase --version` |

---

## 2. 快速环境检查

### 2.1 一键检查命令

运行以下命令快速验证开发环境是否满足要求：

```bash
npm run env:check
```

该命令会输出类似以下结果：

```
✅ Environment Check Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 开发工具版本

  ✓ Node.js: v25.2.1 (需求: >=18.0.0)
  ✓ npm: 11.6.2 (需求: >=8.0.0)
  ✓ Git: git version 2.52.0.windows.1 (需求: >=2.40.0)

2. 可选工具

  ✓ GitHub CLI: gh version 2.83.1 (2025-11-13) (需求: >=1.12.0)
  ✓ Python: Python 3.14.0 (需求: >=3.8.0)
  ✓ Supabase CLI: supabase version 2.62.10 (需求: >=1.0.0)

3. Git 配置

  ✓ Git 用户: Codex Agent <agent@example.com>
  ✓ SSH 密钥已配置 (GitHub 认证成功)

4. GitHub CLI 认证

  ✓ GitHub CLI 已认证

5. 项目文件

  ✓ package.json
  ✓ .git (版本控制)
  ✓ .env.local (环境变量)

6. npm 脚本

  ✓ 核心 npm 脚本已配置 (dev, build, lint, test)

7. npm 依赖

  ✓ npm 依赖已安装 (31 个包)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 环境检查完毕 - 所有检查通过！

你的开发环境已准备好。可以开始以下操作:

  npm run dev      # 启动开发服务器
  npm run lint     # 代码质量检查
  npm test         # 运行单元测试
  npm run build    # 生成生产构建
```

### 2.2 手动逐项检查

#### Node.js 与 npm

```bash
# 检查 Node.js 版本（需要 >=18.0.0）
node --version

# 检查 npm 版本（需要 >=8.0.0）
npm --version

# 查看详细信息
npm --version --long
```

**预期输出**：

```
v20.19.5      (Node.js)
10.8.2        (npm)
```

#### Git

```bash
git --version
# 预期: git version 2.52.0 或更高
```

#### SSH 连接验证

```bash
ssh -T git@github.com
# 预期: Hi <username>! You've successfully authenticated with the key...
```

#### Git 配置

```bash
# 检查 Git 用户名
git config user.name

# 检查 Git 邮箱
git config user.email

# 如未配置，执行以下命令
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### GitHub CLI（可选）

```bash
gh --version
# 预期: gh version 2.83.1 或更高

# 验证认证状态
gh auth status
```

#### Supabase CLI（可选）

```bash
supabase --version
# 预期: supabase version 2.62.10 或更高

# 验证认证状态（已登录）
supabase projects list
# 或
supabase auth whoami
```

#### npm 依赖

```bash
# 检查依赖是否完整
npm ls --depth=0

# 如缺失依赖，重新安装
npm install
```

---

## 3. 初始化开发环境（新团队成员）

### 第一步：克隆仓库

```bash
# 使用 GitHub CLI（推荐）
gh repo clone explore0012/qiltrack-ai

# 或使用 Git SSH
git clone git@github.com:explore0012/qiltrack-ai.git
cd qiltrack-ai
```

### 第二步：安装依赖

```bash
npm install
```

### 第三步：环境检查

```bash
npm run env:check
```

### 第四步：配置环境变量

```bash
# 复制示例文件
cp .env.local.example .env.local

# 补齐必要的密钥（联系项目维护者获取）
# - OPENROUTER_API_KEY
# - FINNHUB_API_KEY
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# 等
```

### 第五步：启动开发服务器

```bash
npm run dev
# 访问 http://localhost:3000
```

---

## 4. 常用开发命令

### 4.1 核心命令

| 命令                | 说明           | 备注                     |
| ------------------- | -------------- | ------------------------ |
| `npm run dev`       | 启动开发服务器 | http://localhost:3000    |
| `npm run build`     | 生成生产构建   | 产物在 `.next` 目录      |
| `npm start`         | 运行生产构建   | 需先运行 `npm run build` |
| `npm run lint`      | 代码质量检查   | 基于 ESLint              |
| `npm test`          | 单元测试       | 基于 Vitest              |
| `npm run test:ci`   | CI 模式测试    | GitHub Actions 使用      |
| `npm run env:check` | 环境检查       | 新增命令                 |

### 4.2 扩展命令（建议）

```bash
# 项目设置建议在 package.json 的 scripts 中添加
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest --environment jsdom --pool=forks",
  "test:ci": "cross-env CI=true vitest --environment jsdom --pool=forks run",
  "env:check": "node scripts/check-env.js",
  "pr:ready": "npm run lint && npm run test && echo '✅ Ready for PR'",
  "dev:debug": "DEBUG=* npm run dev"
}
```

---

## 5. 环境故障排查

### 5.1 npm install 失败

**问题**：执行 `npm install` 时报网络错误或超时。

**解决方案**：

```bash
# 1. 清除 npm 缓存
npm cache clean --force

# 2. 更新 npm 为最新版本
npm install -g npm@latest

# 3. 重新安装依赖
npm install

# 4. 如网络缓慢，可切换国内镜像（临时）
npm install --registry https://registry.npmmirror.com

# 5. 或配置全局镜像源
npm config set registry https://registry.npmmirror.com
```

### 5.2 Node 版本不兼容

**问题**：运行 `npm run dev` 或 `npm run build` 时提示版本错误。

**解决方案**：

```bash
# 检查当前版本
node --version

# 使用版本管理工具升级（推荐使用 nvm 或 Scoop）

# Windows (Scoop)
scoop update nodejs

# Mac (Homebrew)
brew upgrade node

# Linux (nvm)
nvm install 20
nvm use 20
```

### 5.3 ESLint 或 Vitest 找不到

**问题**：运行 `npm run lint` 或 `npm run test` 时报找不到命令。

**解决方案**：

```bash
# 1. 确保依赖完整
npm install

# 2. 清除 node_modules 并重新安装
rm -rf node_modules package-lock.json
npm install

# 3. 检查 package.json 中的脚本配置
npm run lint --verbose

# 4. 查看详细错误信息
npm test -- --reporter=verbose
```

### 5.4 SSH 连接失败

**问题**：运行 `ssh -T git@github.com` 时显示"Permission denied"。

**解决方案**：

```bash
# 1. 生成 SSH 密钥（如未生成）
ssh-keygen -t ed25519 -C "your-email@example.com"

# 2. 启动 SSH Agent
ssh-agent -s

# 3. 添加私钥
ssh-add ~/.ssh/id_ed25519

# 4. 复制公钥并添加到 GitHub Settings > SSH Keys
cat ~/.ssh/id_ed25519.pub
# 然后访问 https://github.com/settings/keys 粘贴公钥

# 5. 测试连接
ssh -T git@github.com
```

### 5.5 Git 用户未配置

**问题**：`git commit` 时提示"Author identity unknown"。

**解决方案**：

```bash
# 配置全局用户名和邮箱
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 验证配置
git config --global --list | grep user
```

### 5.6 .env.local 密钥缺失

**问题**：运行应用时提示环境变量缺失。

**解决方案**：

```bash
# 1. 复制模板文件
cp .env.local.example .env.local

# 2. 编辑 .env.local 补齐密钥
# 必要的环境变量：
# - OPENROUTER_API_KEY: OpenRouter API 密钥
# - FINNHUB_API_KEY: Finnhub 股票数据 API 密钥
# - SUPABASE_URL: Supabase 项目 URL
# - SUPABASE_ANON_KEY: Supabase 公开密钥
# - 等

# 3. 联系项目维护者获取实际的密钥值
```

---

## 6. CI/CD 环境

### 6.1 GitHub Actions 配置

项目使用 GitHub Actions 进行自动化测试和构建，配置文件位于 `.github/workflows/ci.yml`。

**CI 流程**：

1. 在 `main` 分支 push 或 PR 时触发
2. Node.js 版本：20（与 package.json 对齐）
3. 执行步骤：
   - 检出代码
   - 安装 Node.js 20
   - 运行 `npm install`
   - 运行 `npm run lint` — 代码质量检查
   - 运行 `npm run test:ci` — 单元测试

**本地模拟 CI 环境**：

```bash
# 安装 act 工具（GitHub Actions 本地模拟）
scoop install act  # Windows
brew install act   # Mac

# 运行本地 CI 流程
act -j test

# 或只运行特定步骤
act -j test -s CI=true
```

### 6.2 本地提交前检查清单

在推送代码到远程之前，遵循以下步骤确保 PR 能通过 CI：

```bash
# 1. 代码质量检查
npm run lint
# 预期：无 error（warning 可接受）

# 2. 运行单元测试
npm run test
# 预期：所有测试通过

# 3. 本地构建（可选但推荐）
npm run build
# 预期：构建成功，无错误

# 4. 确认 Git 状态
git status
# 预期：所有修改已提交或已暂存

# 5. 同步最新 main 分支
git fetch origin
git rebase origin/main

# 6. 推送到远程分支
git push origin feature/your-feature-name
```

---

## 7. 系统环境信息示例

在向团队报告环境问题时，请提供以下信息：

```bash
# 生成完整的环境报告
npm run env:check

# 或手动收集以下信息
echo "=== System & Tools ==="
node --version
npm --version
git --version
gh --version 2>/dev/null || echo "GitHub CLI not installed"
python --version 2>/dev/null || echo "Python not installed"

echo "=== Project Info ==="
git remote -v
git branch

echo "=== Dependencies ==="
npm ls --depth=0
```

**示例输出**：

```
=== System & Tools ===
v20.19.5       (Node.js)
10.8.2         (npm)
git version 2.52.0.windows.1
gh version 2.83.1
Python 3.14.0

=== Project Info ===
origin  git@github.com:explore0012/qiltrack-ai.git (fetch)
origin  git@github.com:explore0012/qiltrack-ai.git (push)
* feature/your-feature

=== Dependencies ===
qiltrack-ai@0.1.0 /path/to/qiltrack-ai
├── next@16.0.3
├── react@19.2.0
├── react-dom@19.2.0
├── @prisma/client@6.19.0
└── ...
```

---

## 8. 可选工具安装指南

### 8.1 GitHub CLI（推荐用于 PR 管理）

**为什么装**：快速创建/管理 PR，不需打开浏览器。

**Windows**：

```bash
scoop install gh
```

**Mac**：

```bash
brew install gh
```

**Linux**：

```bash
sudo apt install gh  # Ubuntu/Debian
```

**验证安装**：

```bash
gh --version
gh auth login
```

### 8.2 版本管理工具（nvm / Scoop）

**使用 Scoop（Windows）**：

```bash
# 安装 Scoop
iwr -useb get.scoop.sh | iex

# 更新 Node.js
scoop install nodejs
scoop update nodejs
```

**使用 nvm（Linux/Mac）**：

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装并切换 Node.js
nvm install 20
nvm use 20
```

### 8.3 调试工具

**VS Code 调试**：

- 在 `.vscode/launch.json` 中配置：
  ```json
  {
    "version": "0.2.0",
    "configurations": [
      {
        "name": "Next.js",
        "type": "node",
        "request": "launch",
        "runtimeExecutable": "npm",
        "runtimeArgs": ["run", "dev"],
        "console": "integratedTerminal",
        "internalConsoleOptions": "neverOpen"
      }
    ]
  }
  ```

### 8.4 Supabase CLI（可选但推荐用于数据库管理）

**为什么装**：管理 Supabase 项目、数据库迁移、本地开发。

**Windows（使用 Scoop）**：

```bash
scoop install supabase
```

**Mac（使用 Homebrew）**：

```bash
brew install supabase/tap/supabase
```

**Linux（使用 npm）**：

```bash
npm install -g supabase
```

**验证安装**：

```bash
supabase --version
# 预期: supabase version 2.62.10 或更高

# 登录 Supabase 账户
supabase login
# 按提示在浏览器中验证

# 查看已登录的账户
supabase auth whoami

# 列出项目
supabase projects list
```

**常用命令**：

```bash
# 初始化本地 Supabase 环境
supabase init

# 启动本地开发服务器
supabase start

# 停止本地服务
supabase stop

# 查看本地数据库连接信息
supabase status

# 推送数据库迁移到远程
supabase db push

# 查看项目中的表结构
supabase db tables list
```

---

## 9. 常见问题解答（FAQ）

**Q1：我应该用哪个 Node.js 版本？**
A：项目支持 Node.js 18+，推荐使用 v20.19.5 或更高。GitHub Actions 使用 20，建议本地也使用 20 保持一致。

**Q2：为什么本地通过，PR 在 CI 失败？**
A：常见原因：

- Node.js 版本不一致（本地用 18，CI 用 20）
- npm 依赖版本波动（使用 `package-lock.json` 锁定版本）
- 环境变量缺失（.env.local 本地有，CI 没有）
- 未运行 lint/test（本地通过不等于满足 CI 要求）

**解决**：在推送前运行 `npm run lint` 和 `npm run test`，确保本地通过。

**Q3：我该如何贡献新功能？**
A：遵循 `docs/guides/claude-pr-workflow.md` 的步骤：

1. 创建新分支（`feature/your-feature`）
2. 本地修改和测试（`npm run lint && npm run test`）
3. 推送到远程
4. 创建 PR（使用 `gh pr create --fill` 或网页）
5. 等待 CI 通过及代码审查

**Q4：如何快速验证我的改动不会破坏构建？**
A：运行本地 PR 检查脚本：

```bash
npm run pr:ready
# 或逐步执行
npm run lint && npm run test && npm run build
```

**Q5：我的电脑上有多个项目，如何避免 Node.js 版本冲突？**
A：使用版本管理工具（nvm 或 Scoop）：

```bash
# Scoop
scoop install nodejs  # 安装最新版
scoop reset nodejs@20  # 切换到特定版本

# nvm
nvm install 20
nvm use 20
nvm alias default 20
```

---

## 10. 贡献者检查清单

新团队成员加入时，按以下清单确保环境就绪：

- [ ] 已安装 Node.js 20+ 和 npm 10+
- [ ] 已配置 Git 用户名和邮箱
- [ ] 已生成并添加 SSH 密钥到 GitHub
- [ ] 已克隆仓库并运行 `npm install`
- [ ] 已运行 `npm run env:check` 并通过所有检查
- [ ] 已配置 `.env.local` 并获得必要的 API 密钥
- [ ] 已成功运行 `npm run dev` 并访问 http://localhost:3000
- [ ] 已成功运行 `npm run lint` 和 `npm run test`
- [ ] （可选）已安装 Supabase CLI 并运行 `supabase projects list` 验证认证
- [ ] 已阅读 `docs/guides/claude-pr-workflow.md`（PR 工作流）
- [ ] 已理解项目的协作规范（见 `CODEX_CLAUDE_COLLAB.md`）

### 2.3 Worktree 协作指引

每个 worktree 拥有**独立的 `node_modules`**，避免 Turbopack 缓存冲突。

**创建 worktree**：

```powershell
# 使用 prep 脚本（自动运行 npm ci）
powershell -ExecutionPolicy Bypass -File scripts/prep-group.ps1 -Name g1 -Branch g1/feature-x
```

**每次新任务前重置**：

```powershell
# 重置到最新 main（保留 node_modules）
.\scripts\reset-worktree.ps1 -Name g1
```

**多 worktree 并行开发**：

```bash
# 每个 worktree 用不同端口
cd D:\Projects\qiltrack-ai-g1 && npm run dev -- --port 3001
cd D:\Projects\qiltrack-ai-g2 && npm run dev -- --port 3002
```

详见 `docs/guides/worktree-multi-team.md`。

---

## 11. 相关文档

- **PR 工作流指南**：`docs/guides/claude-pr-workflow.md`
- **协作手册**：`CODEX_CLAUDE_COLLAB.md`
- **快速启动**：`docs/guides/codex-claude-quickstart.md`
- **CI 配置**：`.github/workflows/ci.yml`
- **项目说明**：`README.md`

---

**最后更新**：2025-11-27（已验证所有环境配置，补充 Supabase CLI）
**维护者**：团队全体

## 10. 服务状态环境关�?

- GitHub CLI 已关联环境表�? explore0012，接受与 CI 可访问，可以直接使用 `gh` 接口查看/接口提供业务，老确保无需�? repo 提前登录信息�?
- Supabase 参数在地设置，要止可能上传密钥�?�需从本地游例环境的 env 配置获取，私安全�?
