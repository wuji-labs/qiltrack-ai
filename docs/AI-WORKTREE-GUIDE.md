# AI Worktree 安全指南

## 重要提示

本项目使用 **git worktree** 模式，多个 AI 同时在不同分支工作。每个 AI 必须遵守以下规则，**禁止影响其他 worktree 的操作**。

---

## ⛔ 严格禁止的命令

以下命令会杀死所有 Node 进程，**影响所有 worktree**，绝对禁止使用：

### Windows 禁止命令
```bash
# ❌ 禁止 - 会杀死所有 Node 进程
taskkill /F /IM node.exe
taskkill /F /IM npm.exe

# ❌ 禁止 - 会杀死所有 Next.js 进程
taskkill /F /FI "WINDOWTITLE eq Next.js*"
```

### Linux/Mac 禁止命令
```bash
# ❌ 禁止 - 会杀死所有 Node 进程
pkill node
pkill npm
killall node
killall npm

# ❌ 禁止 - 会杀死所有 Next.js 进程
pkill -f "next dev"
```

### 其他禁止命令
```bash
# ❌ 禁止 - 可能杀死错误的进程
lsof -ti:3000 | xargs kill
kill -9 $(pgrep node)

# ❌ 禁止 - 不要运行这个脚本（它会杀死端口进程）
bash scripts/dev-start.sh
npm run dev:start
```

---

## ✅ 正确的服务器管理命令

使用以下**安全命令**来管理**当前 worktree** 的开发服务器：

### 启动服务器
```bash
# ✅ 推荐 - 使用安全启动脚本（会保存 PID）
npm run dev:safe

# ✅ 或使用原始命令（但不会保存 PID）
npm run dev
```

### 停止服务器
```bash
# ✅ 正确 - 只停止当前 worktree 的服务器
npm run dev:stop
```

### 重启服务器
```bash
# ✅ 正确 - 只重启当前 worktree 的服务器
npm run dev:restart
```

### 检查服务器状态
```bash
# ✅ 检查 PID 文件
cat .dev.pid

# ✅ Windows - 检查特定端口
netstat -ano | findstr ":3004"

# ✅ Linux/Mac - 检查特定端口
lsof -i:3004
```

---

## 📋 工作流程示例

### 场景 1: 用户要求"重启服务器"
```bash
# ✅ 正确做法
npm run dev:restart

# ❌ 错误做法
taskkill /F /IM node.exe && npm run dev  # 会杀死所有 worktree
```

### 场景 2: 用户要求"测试新功能"
```bash
# ✅ 正确做法
# 1. 确保当前 worktree 的服务器在运行
cat .dev.pid || npm run dev:safe

# 2. 打开浏览器测试
# 3. 如需重启
npm run dev:restart

# ❌ 错误做法
pkill node && npm run dev  # 会影响其他 worktree
```

### 场景 3: 端口被占用
```bash
# ✅ 正确做法 - 检查是否是自己的进程
cat .dev.pid
# 如果是，停止它
npm run dev:stop
# 重新启动
npm run dev:safe

# ❌ 错误做法
lsof -ti:3004 | xargs kill -9  # 可能杀死其他 worktree 的进程
```

---

## 🔧 Worktree 配置

### 端口分配
每个 worktree 使用不同的端口（配置在 `scripts/worktree-ports.json`）：

```json
{
  "main": 3000,
  "g1/develop": 3001,
  "develop": 3002,
  "g3/develop": 3003,
  "g4/develop": 3004,
  "g5/develop": 3005
}
```

### 设置端口
```bash
# 在新 worktree 中首次运行
npm run worktree:setup-port
```

这会在 `.env.local` 中设置正确的 `PORT` 值。

---

## 🛡️ 进程隔离机制

### PID 文件
- 每个 worktree 的开发服务器 PID 保存在 `.dev.pid`
- 这个文件被 gitignore，每个 worktree 独立
- 停止/重启命令只会操作这个 PID 的进程

### 工作原理
```
qiltrack-ai-g1/.dev.pid  → 保存 g1 的服务器 PID (例如: 12345)
qiltrack-ai-g2/.dev.pid  → 保存 g2 的服务器 PID (例如: 67890)
qiltrack-ai-g4/.dev.pid  → 保存 g4 的服务器 PID (例如: 11223)
```

执行 `npm run dev:stop` 时：
- 读取当前目录的 `.dev.pid`
- 只杀死这个特定 PID 的进程
- **不会影响其他 worktree**

---

## 📝 AI 最佳实践

1. **永远不要**建议使用全局进程杀死命令
2. **始终使用** `npm run dev:stop` 和 `npm run dev:restart`
3. **测试前确认**服务器在正确的端口运行
4. **遇到端口问题**先检查 `.dev.pid` 和 `.env.local`
5. **不确定时**询问用户，不要擅自重启

---

## ❓ 常见问题

### Q: 如何知道当前 worktree 的端口？
```bash
# 查看 .env.local
grep PORT .env.local

# 或查看当前分支配置
git branch --show-current
```

### Q: 服务器没响应怎么办？
```bash
# 1. 检查进程是否运行
cat .dev.pid

# 2. 如果有 PID，检查进程状态（Linux/Mac）
ps -p $(cat .dev.pid)

# 3. 如果有 PID，检查进程状态（Windows）
tasklist | findstr "$(type .dev.pid)"

# 4. 安全重启
npm run dev:restart
```

### Q: .dev.pid 文件丢失了怎么办？
```bash
# 1. 找到当前端口的进程（假设端口是 3004）
# Windows:
netstat -ano | findstr ":3004"

# Linux/Mac:
lsof -ti:3004

# 2. 手动杀死特定 PID（记下 PID）
# Windows:
taskkill /PID <PID>

# Linux/Mac:
kill <PID>

# 3. 重新启动
npm run dev:safe
```

---

## 🚨 违规后果

如果 AI 执行了禁止的命令：
- 会杀死所有 worktree 的开发服务器
- 其他 AI 的工作会被中断
- 用户需要手动重启所有 worktree 的服务器

**请严格遵守本指南！**
