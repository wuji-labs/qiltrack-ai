# Worktree 安全机制部署指南

## 概述

本指南帮助你将新的 worktree 安全机制部署到所有现有的 worktree 中。

## 背景

之前的问题：多个 AI 同时工作时，某个 AI 执行重启服务器命令会杀死所有 worktree 的进程。

解决方案：
1. ✅ 创建基于 PID 文件的进程隔离机制
2. ✅ 提供安全的启动/停止/重启命令
3. ✅ 编写 AI 使用指南

## 已添加的文件

### 新脚本
- `scripts/dev-safe.js` - 安全启动服务器（保存 PID）
- `scripts/dev-stop.js` - 安全停止服务器（仅当前 worktree）
- `scripts/dev-restart.js` - 安全重启服务器

### 新文档
- `docs/AI-WORKTREE-GUIDE.md` - AI 详细使用指南
- `AI-COMMANDS.md` - AI 快速命令参考
- `docs/DEPLOY-WORKTREE-SAFETY.md` - 本文件

### 修改的文件
- `package.json` - 添加了 `dev:safe`, `dev:stop`, `dev:restart` 命令

## 部署步骤

### 方案 1: 通过 Git 同步（推荐）

如果你将这些更改提交到共享分支（如 `develop` 或 `main`），其他 worktree 可以通过 git pull 获取：

```bash
# 在当前 worktree (g4/develop) 提交更改
git add .
git commit -m "feat: 添加 worktree 安全进程管理机制"
git push

# 切换到其他 worktree 并同步
cd ../qiltrack-ai-g1
git pull origin develop  # 或从你的分支 merge

cd ../qiltrack-ai-g2
git pull origin develop

cd ../qiltrack-ai-g3
git pull origin develop

# 依此类推...
```

### 方案 2: 手动复制文件

如果暂时不想提交，可以手动复制文件到其他 worktree：

```bash
# 定义源目录（当前 worktree）
$SOURCE = "D:\Projects\qiltrack-ai-g4"

# 复制脚本到 g1
Copy-Item "$SOURCE\scripts\dev-safe.js" "D:\Projects\qiltrack-ai-g1\scripts\"
Copy-Item "$SOURCE\scripts\dev-stop.js" "D:\Projects\qiltrack-ai-g1\scripts\"
Copy-Item "$SOURCE\scripts\dev-restart.js" "D:\Projects\qiltrack-ai-g1\scripts\"

# 复制文档
Copy-Item "$SOURCE\docs\AI-WORKTREE-GUIDE.md" "D:\Projects\qiltrack-ai-g1\docs\"
Copy-Item "$SOURCE\AI-COMMANDS.md" "D:\Projects\qiltrack-ai-g1\"

# 更新 package.json (需要手动编辑或使用脚本)
# ... 重复其他 worktree
```

或使用 bash：

```bash
# Linux/Mac/Git Bash
SOURCE="D:/Projects/qiltrack-ai-g4"
WORKTREES=("qiltrack-ai-g1" "qiltrack-ai-g2" "qiltrack-ai-g3" "qiltrack-ai-g5")

for wt in "${WORKTREES[@]}"; do
  echo "Copying to $wt..."
  cp "$SOURCE/scripts/dev-safe.js" "D:/Projects/$wt/scripts/"
  cp "$SOURCE/scripts/dev-stop.js" "D:/Projects/$wt/scripts/"
  cp "$SOURCE/scripts/dev-restart.js" "D:/Projects/$wt/scripts/"
  cp "$SOURCE/docs/AI-WORKTREE-GUIDE.md" "D:/Projects/$wt/docs/"
  cp "$SOURCE/AI-COMMANDS.md" "D:/Projects/$wt/"
  echo "✅ $wt updated"
done
```

### 方案 3: 使用自动化脚本

创建一个一键部署脚本：

```bash
# scripts/sync-safety-to-worktrees.sh
#!/bin/bash

WORKTREES=(
  "D:/Projects/qiltrack-ai"
  "D:/Projects/qiltrack-ai-g1"
  "D:/Projects/qiltrack-ai-g2"
  "D:/Projects/qiltrack-ai-g3"
  "D:/Projects/qiltrack-ai-g5"
)

CURRENT_DIR=$(pwd)

for wt in "${WORKTREES[@]}"; do
  if [ -d "$wt" ]; then
    echo "📦 Syncing to $wt..."

    # 复制脚本
    cp scripts/dev-safe.js "$wt/scripts/"
    cp scripts/dev-stop.js "$wt/scripts/"
    cp scripts/dev-restart.js "$wt/scripts/"

    # 复制文档
    mkdir -p "$wt/docs"
    cp docs/AI-WORKTREE-GUIDE.md "$wt/docs/"
    cp AI-COMMANDS.md "$wt/"

    echo "   ✅ Files copied"

    # 更新 package.json (如果需要)
    # ... 可以添加 sed/jq 命令
  else
    echo "⚠️  Worktree not found: $wt"
  fi
done

echo ""
echo "🎉 Sync complete! Remember to:"
echo "1. Update package.json in each worktree with new scripts"
echo "2. Tell your AIs to read AI-COMMANDS.md"
```

## 验证部署

在每个 worktree 中运行：

```bash
# 检查文件存在
ls -la scripts/dev-safe.js
ls -la scripts/dev-stop.js
ls -la scripts/dev-restart.js
ls -la docs/AI-WORKTREE-GUIDE.md
ls -la AI-COMMANDS.md

# 测试命令
npm run dev:safe
# (Ctrl+C 停止)

npm run dev:stop

npm run dev:restart
```

## 通知 AI

在每个 worktree 中，告诉 AI：

```
请阅读 AI-COMMANDS.md 和 docs/AI-WORKTREE-GUIDE.md

以后：
- 启动服务器用 `npm run dev:safe`
- 停止服务器用 `npm run dev:stop`
- 重启服务器用 `npm run dev:restart`
- 绝对不要使用 `pkill node` 或 `taskkill /F /IM node.exe`
```

## 监控和维护

### 检查 PID 文件
```bash
# 在所有 worktree 中检查
for wt in D:/Projects/qiltrack-ai*; do
  echo "=== $wt ==="
  cat "$wt/.dev.pid" 2>/dev/null || echo "  (no server running)"
done
```

### 清理所有服务器
如果需要停止所有 worktree 的服务器：

```bash
# 安全方法 - 在每个 worktree 中执行
for wt in D:/Projects/qiltrack-ai*; do
  echo "Stopping $wt..."
  cd "$wt"
  npm run dev:stop 2>/dev/null || echo "  (not running)"
done
```

## 故障排除

### 问题：AI 仍然使用危险命令

解决：
1. 确保 `AI-COMMANDS.md` 在根目录
2. 在对话开始时提醒 AI 阅读该文件
3. 考虑在 `.claude` 配置中添加提示

### 问题：PID 文件不同步

解决：
```bash
# 检查进程是否真的在运行
cat .dev.pid
ps -p $(cat .dev.pid)  # Linux/Mac
tasklist | findstr "$(type .dev.pid)"  # Windows

# 如果进程不存在，删除 PID 文件
rm .dev.pid
```

### 问题：端口冲突

解决：
```bash
# 检查端口配置
grep PORT .env.local

# 重新设置端口
npm run worktree:setup-port

# 重启服务器
npm run dev:restart
```

## 后续改进

可选的增强功能：

1. **添加进程监控**
   - 创建一个监控脚本，定期检查所有 worktree 的服务器状态

2. **添加健康检查**
   - 在启动时检查端口可用性
   - 在停止时验证进程已终止

3. **集成到 Git hooks**
   - post-checkout: 提醒设置端口
   - pre-commit: 检查不要提交 .dev.pid

4. **Dashboard**
   - 创建一个简单的 Web UI 显示所有 worktree 的状态

## 总结

新的安全机制确保：
- ✅ 每个 worktree 只管理自己的进程
- ✅ AI 有清晰的命令指南
- ✅ 通过 PID 文件进行进程追踪
- ✅ 防止意外杀死其他 worktree 的服务器

**记住：**安全机制只有在所有 AI 都遵守规则时才有效。请确保在每个对话开始时提醒 AI 阅读 `AI-COMMANDS.md`。
