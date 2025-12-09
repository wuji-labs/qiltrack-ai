# AI 快速命令参考

> **重要：** 本项目使用 git worktree，多个 AI 同时工作。请使用安全命令！

## ⛔ 禁止使用的命令

```bash
# ❌ 会杀死所有 worktree 的进程
taskkill /F /IM node.exe    # Windows
pkill node                   # Linux/Mac
killall node                # Linux/Mac
lsof -ti:PORT | xargs kill  # 任何系统
```

## ✅ 正确的命令

### 服务器管理
```bash
# 启动服务器（推荐）
npm run dev:safe

# 停止服务器（只停当前 worktree）
npm run dev:stop

# 重启服务器（只重启当前 worktree）
npm run dev:restart

# 检查状态
cat .dev.pid
```

### 常见操作
```bash
# 用户说"重启服务器" → 使用这个
npm run dev:restart

# 用户说"测试功能" → 确保服务器运行
npm run dev:safe

# 遇到端口问题 → 停止再启动
npm run dev:stop && npm run dev:safe
```

## 📖 完整文档

详细说明请查看：`docs/AI-WORKTREE-GUIDE.md`

## 🆘 记住

1. **永远不要**使用全局的进程杀死命令
2. **始终使用** `npm run dev:*` 命令
3. **不确定时**询问用户，不要擅自操作
