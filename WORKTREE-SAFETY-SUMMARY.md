# Worktree 安全机制 - 完整总结

## 问题

在 git worktree 模式下，多个 AI 同时工作时，某个 AI 执行重启服务器命令会杀死**所有 worktree** 的进程。

## 解决方案

通过 **PID 文件隔离** + **安全命令** + **AI 指南** 三管齐下，确保每个 worktree 只管理自己的进程。

---

## 📦 新增文件

### 核心脚本
| 文件 | 作用 |
|------|------|
| `scripts/dev-safe.js` | 安全启动服务器，保存 PID 到 `.dev.pid` |
| `scripts/dev-stop.js` | 安全停止服务器，仅停当前 worktree 的进程 |
| `scripts/dev-restart.js` | 安全重启服务器 |

### 文档
| 文件 | 作用 |
|------|------|
| `AI-COMMANDS.md` | AI 快速命令参考（根目录） |
| `docs/AI-WORKTREE-GUIDE.md` | AI 详细使用指南 |
| `docs/DEPLOY-WORKTREE-SAFETY.md` | 部署指南 |
| `WORKTREE-SAFETY-SUMMARY.md` | 本文件 |

### 同步工具
| 文件 | 作用 |
|------|------|
| `scripts/sync-safety-to-worktrees.ps1` | PowerShell 同步脚本 |
| `scripts/sync-safety-to-worktrees.sh` | Bash 同步脚本 |

### 修改文件
| 文件 | 修改内容 |
|------|----------|
| `package.json` | 添加 `dev:safe`, `dev:stop`, `dev:restart` 命令 |

---

## ⚡ 快速开始

### 1. 同步到所有 worktree

**方案 A: 使用自动化脚本（推荐）**

```powershell
# PowerShell
pwsh scripts/sync-safety-to-worktrees.ps1
```

或

```bash
# Bash / Git Bash
bash scripts/sync-safety-to-worktrees.sh
```

**方案 B: 通过 Git 同步**

```bash
# 在当前 worktree 提交
git add .
git commit -m "feat: 添加 worktree 安全进程管理机制"
git push

# 在其他 worktree 拉取
cd ../qiltrack-ai-g1
git pull origin develop
```

### 2. 更新其他 worktree 的 package.json

在每个 worktree 的 `package.json` 中添加（如果还没有）：

```json
{
  "scripts": {
    "dev:safe": "node scripts/dev-safe.js",
    "dev:stop": "node scripts/dev-stop.js",
    "dev:restart": "node scripts/dev-restart.js"
  }
}
```

### 3. 告知所有 AI

在每个 worktree 的 AI 对话中发送：

```
请阅读 AI-COMMANDS.md

从现在开始：
- 启动服务器用 npm run dev:safe
- 停止服务器用 npm run dev:stop
- 重启服务器用 npm run dev:restart
- 绝对不要使用 pkill node 或 taskkill /F /IM node.exe
```

---

## 🎯 核心命令

### ✅ 正确命令

```bash
# 启动服务器（推荐）
npm run dev:safe

# 停止服务器（仅当前 worktree）
npm run dev:stop

# 重启服务器（仅当前 worktree）
npm run dev:restart

# 检查服务器状态
cat .dev.pid
```

### ⛔ 禁止命令

```bash
# ❌ Windows
taskkill /F /IM node.exe
taskkill /F /IM npm.exe

# ❌ Linux/Mac
pkill node
pkill npm
killall node

# ❌ 任何系统
lsof -ti:PORT | xargs kill
bash scripts/dev-start.sh
```

---

## 🔍 验证部署

在每个 worktree 中运行：

```bash
# 检查文件存在
ls scripts/dev-safe.js
ls scripts/dev-stop.js
ls scripts/dev-restart.js
ls AI-COMMANDS.md
ls docs/AI-WORKTREE-GUIDE.md

# 测试命令
npm run dev:safe
# Ctrl+C 停止

npm run dev:stop
```

---

## 🛡️ 工作原理

### 进程隔离

每个 worktree 的开发服务器启动时，会在当前目录创建 `.dev.pid` 文件：

```
qiltrack-ai-g1/.dev.pid  → PID: 12345
qiltrack-ai-g2/.dev.pid  → PID: 67890
qiltrack-ai-g4/.dev.pid  → PID: 11223
```

停止/重启命令只会读取当前目录的 `.dev.pid`，操作特定 PID 的进程，**不会影响其他 worktree**。

### 端口配置

每个 worktree 通过 `.env.local` 配置不同端口（已有机制）：

```json
// scripts/worktree-ports.json
{
  "main": 3000,
  "g1/develop": 3001,
  "develop": 3002,
  "g3/develop": 3003,
  "g4/develop": 3004,
  "g5/develop": 3005
}
```

---

## 📊 监控所有 Worktree

### 检查所有服务器状态

```bash
# PowerShell
Get-ChildItem D:\Projects\qiltrack-ai* | ForEach-Object {
    $pid_file = Join-Path $_.FullName ".dev.pid"
    if (Test-Path $pid_file) {
        $pid = Get-Content $pid_file
        Write-Host "$($_.Name): PID $pid"
    } else {
        Write-Host "$($_.Name): not running"
    }
}
```

```bash
# Bash
for wt in /d/Projects/qiltrack-ai*; do
    echo "=== $(basename $wt) ==="
    cat "$wt/.dev.pid" 2>/dev/null || echo "  (not running)"
done
```

### 安全停止所有服务器

```bash
# 在每个 worktree 中执行
for wt in /d/Projects/qiltrack-ai*; do
    echo "Stopping $(basename $wt)..."
    cd "$wt"
    npm run dev:stop 2>/dev/null || echo "  (already stopped)"
done
```

---

## 🔧 故障排除

### PID 文件过期

```bash
# 检查进程是否真的在运行
cat .dev.pid

# Linux/Mac
ps -p $(cat .dev.pid)

# Windows
tasklist | findstr "$(type .dev.pid)"

# 如果进程不存在，删除 PID 文件
rm .dev.pid
```

### 端口冲突

```bash
# 重新设置端口
npm run worktree:setup-port

# 查看当前端口
grep PORT .env.local

# 重启服务器
npm run dev:restart
```

### AI 仍使用危险命令

1. 确保 `AI-COMMANDS.md` 在根目录
2. 在对话开始时明确提醒 AI
3. 考虑将指南添加到 `.claude/` 配置

---

## 📚 详细文档

- **AI 快速参考**: `AI-COMMANDS.md`
- **AI 详细指南**: `docs/AI-WORKTREE-GUIDE.md`
- **部署指南**: `docs/DEPLOY-WORKTREE-SAFETY.md`

---

## ✨ 优点

1. ✅ **进程隔离** - 每个 worktree 独立管理自己的进程
2. ✅ **安全可靠** - 防止误杀其他 worktree 的服务器
3. ✅ **简单易用** - 统一的 `npm run dev:*` 命令
4. ✅ **AI 友好** - 清晰的命令指南和文档
5. ✅ **兼容现有** - 不影响原有的 `npm run dev` 命令

---

## 🚀 下一步

1. ✅ 运行同步脚本部署到所有 worktree
2. ✅ 告知所有 AI 新的命令规则
3. ✅ 测试验证每个 worktree 的功能
4. ✅ 开始使用新的安全命令

**记住**: 安全机制需要所有 AI 共同遵守才能发挥作用！
