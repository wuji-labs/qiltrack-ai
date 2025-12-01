# Worktree 端口管理方案

## 问题说明

在多 worktree 协作开发中，每个 worktree 需要使用不同的开发端口以避免冲突：

- `main` (主目录): **3000**
- `g1/worktree`: **3001**
- `g2/worktree`: **3002**
- `g3/worktree`: **3003**
- `g4/worktree`: **3004**
- `g5/worktree`: **3005**

但是 `package.json` 中的 `dev` 脚本会被提交到 git，导致不同 worktree 合并时产生端口冲突。

## 解决方案

### 方案选择

我们采用**方案 2**：使用自动化脚本管理 worktree 端口，`package.json` 的端口变更不提交到 git。

### 工作原理

1. **配置文件**: `scripts/worktree-ports.json` 定义了各 worktree 的端口映射
2. **设置脚本**: `scripts/setup-worktree-port.js` 根据当前分支自动设置端口
3. **Git 忽略**: 使用 `git update-index --skip-worktree` 标记 package.json，避免提交端口变更

## 使用方法

### 1. 新建 Worktree 后设置端口

```bash
# 进入 worktree 目录
cd /path/to/investor-ai-g2

# 运行端口设置脚本
npm run worktree:setup-port
```

输出示例：
```
📍 Current branch: g2/worktree
🔌 Setting dev port to: 3002
✅ Port configured successfully!
✅ Marked package.json to skip port changes in git
```

### 2. 验证端口设置

```bash
npm run dev
# 应该启动在正确的端口（g2 = 3002）
```

### 3. 提交 PR 前检查

```bash
# 确保 package.json 的端口变更不会被提交
git status
# 如果显示 package.json 有变更，运行：
git restore package.json
```

## 端口冲突解决

### 场景 1: 合并到 main 时遇到 package.json 冲突

```bash
# 始终接受 main 的版本（应该是 3000）
git checkout --theirs package.json
git add package.json
```

### 场景 2: package.json 被误提交

```bash
# 撤销最后一次提交（保留文件变更）
git reset HEAD~1

# 恢复 package.json 到 main 的版本
git restore package.json

# 重新提交（不包含 package.json）
git add .
git commit -m "..."
```

## 维护说明

### 添加新 Worktree

1. 在 `scripts/worktree-ports.json` 中添加新的端口映射：
```json
{
  "ports": {
    "g6/worktree": 3006
  }
}
```

2. 在新 worktree 中运行 `npm run worktree:setup-port`

### 检查所有 Worktree 端口状态

```bash
# 在主目录运行
for dir in investor-ai-g{1..5}; do
  echo "=== $dir ==="
  grep '"dev"' $dir/package.json
done
```

预期输出：
```
=== investor-ai-g1 ===
    "dev": "next dev -p 3001",
=== investor-ai-g2 ===
    "dev": "next dev -p 3002",
...
```

## 注意事项

⚠️ **重要**:
- `package.json` 在 main 分支应始终使用端口 **3000**
- 每个 worktree 的 `package.json` 端口变更**不应该提交到 git**
- 如果 PR 出现端口冲突，始终接受 main 的版本（3000）

## 替代方案（未采用）

### 方案 A: 环境变量

优点：更标准化
缺点：需要配置 Next.js 读取 PORT 环境变量

### 方案 C: npm scripts 别名

优点：最灵活
缺点：需要记住不同的命令（dev-g1, dev-g2...）

## 相关文档

- Worktree 多组协作指南: `docs/guides/worktree-multi-team.md`
- 准备脚本: `scripts/prep-group.ps1`
