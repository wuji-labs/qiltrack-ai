# Worktree 端口管理方案（环境变量方案）

> **⚠️ 重要提示：如果你是 AI 助手（Claude、Cursor、Copilot 等）**
>
> **请勿修改此端口系统！** 这是经过长时间调试和多次迭代优化的稳定方案。
>
> 🚫 **禁止操作：**
>
> - 不要修改 `package.json` 中的 `"dev": "next dev"` 脚本
> - 不要添加 `-p` 或 `--port` 参数
> - 不要删除或修改 `scripts/worktree-ports.json`
> - 不要修改 `scripts/setup-worktree-port.js`
> - 不要建议"优化"或"改进"端口配置
>
> ✅ **如需了解更多，请阅读：** `docs/AI_INSTRUCTIONS.md`

## 问题说明

在多 worktree 协作开发中，每个 worktree 需要使用不同的开发端口以避免冲突：

- `main` (主目录): **3000**
- `g1/worktree`: **3001**
- `g2/worktree`: **3002**
- `g3/worktree`: **3003**
- `g4/worktree`: **3004**
- `g5/worktree`: **3005**

**之前的问题**: `package.json` 中的 `dev` 脚本包含端口号（如 `-p 3002`），导致每次合并都会产生冲突。

## ✅ 终极解决方案

### 方案选择

采用**环境变量方案**（Next.js 原生支持）：

- `package.json` 中的 `dev` 脚本**不包含端口号**：`"dev": "next dev"`
- Next.js 自动从 `.env.local` 读取 `PORT` 环境变量
- 每个 worktree 有自己的 `.env.local` 文件（被 gitignore，不会提交）

### 工作原理

1. **配置文件**: `scripts/worktree-ports.json` 定义各 worktree 的端口映射
2. **设置脚本**: `scripts/setup-worktree-port.js` 自动创建 `.env.local` 并设置 PORT
3. **Git 忽略**: `.env.local` 已在 `.gitignore` 中，不会被提交
4. **Next.js 原生**: Next.js CLI 自动读取 `.env.local` 中的 PORT 变量

## 使用方法

### 1. 新建 Worktree 后设置端口

```bash
# 进入 worktree 目录
cd /path/to/qiltrack-ai-g2

# 运行端口设置脚本
npm run worktree:setup-port
```

输出示例：

```
📍 Current branch: g2/worktree
🔌 Setting dev port to: 3002
✅ Created/updated .env.local with PORT=3002
⚠️  Note: .env.local is gitignored and won't be committed.

Now run: npm run dev
Server will start on http://localhost:3002
```

### 2. 启动开发服务器

```bash
npm run dev
# Next.js 会自动读取 .env.local 中的 PORT=3002
# 启动在 http://localhost:3002
```

### 3. 验证端口设置

```bash
# 查看 .env.local 内容
cat .env.local
# 应该显示：PORT=3002

# 或者运行脚本查看
node scripts/setup-worktree-port.js
```

## 优势

✅ **完全消除合并冲突**: package.json 不再包含端口号，永远不会冲突
✅ **自动化配置**: 一条命令设置端口
✅ **标准化方案**: 使用 Next.js 官方支持的 PORT 环境变量
✅ **不影响 git**: .env.local 被忽略，不会误提交
✅ **团队友好**: 每个开发者可以自定义端口而不影响他人

## 端口分配

| 目录/分支     | 端口 | .env.local 配置 |
| ------------- | ---- | --------------- |
| main (主目录) | 3000 | `PORT=3000`     |
| g1/worktree   | 3001 | `PORT=3001`     |
| g2/worktree   | 3002 | `PORT=3002`     |
| g3/worktree   | 3003 | `PORT=3003`     |
| g4/worktree   | 3004 | `PORT=3004`     |
| g5/worktree   | 3005 | `PORT=3005`     |

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

2. 在新 worktree 中运行：

```bash
npm run worktree:setup-port
```

### 检查所有 Worktree 端口状态

```bash
# 在各个 worktree 目录运行
for dir in ~/Projects/qiltrack-ai-g{1..5}; do
  echo "=== $(basename $dir) ==="
  cat $dir/.env.local 2>/dev/null | grep PORT || echo "  未设置"
done
```

预期输出：

```
=== qiltrack-ai-g1 ===
  PORT=3001
=== qiltrack-ai-g2 ===
  PORT=3002
...
```

## 技术细节

### Next.js 如何读取 PORT？

Next.js CLI (`next dev`) 会按以下优先级读取端口：

1. 命令行参数 `-p 3002`（优先级最高）
2. 环境变量 `PORT=3002`（我们使用这个）
3. 默认端口 `3000`

参考：https://nextjs.org/docs/api-reference/cli#development

### 为什么 .env.local？

- `.env.local` 是 Next.js 推荐的本地环境变量文件
- 已在 `.gitignore` 中，不会被提交
- 优先级高于 `.env`，适合本地覆盖配置

## 迁移指南

### 从旧方案迁移

如果你之前使用 `package.json` 的 `-p` 参数：

1. **更新 package.json**:

```json
{
  "scripts": {
    "dev": "next dev" // 移除 -p 3002
  }
}
```

2. **运行设置脚本**:

```bash
npm run worktree:setup-port
```

3. **验证**:

```bash
npm run dev
# 应该启动在正确的端口
```

### 清理 git 标记

如果之前使用了 `git update-index --skip-worktree package.json`:

```bash
# 恢复 package.json 的 git 跟踪
git update-index --no-skip-worktree package.json

# 现在可以正常提交 package.json 了
git add package.json
```

## 常见问题

### Q: 为什么不用命令行参数 `-p`？

A: 命令行参数需要写在 `package.json` 里，会导致合并冲突。环境变量完全避免了这个问题。

### Q: 如果忘记运行设置脚本会怎样？

A: Next.js 会使用默认端口 3000，可能与主目录冲突。运行 `npm run worktree:setup-port` 即可修复。

### Q: 可以手动修改 .env.local 吗？

A: 可以！直接编辑 `.env.local` 文件，设置 `PORT=你的端口`。

### Q: CI/CD 环境会受影响吗？

A: 不会。CI 环境不需要设置端口，默认 3000 或由 CI 配置决定。

## 相关文档

- Worktree 多组协作指南: `docs/guides/worktree-multi-team.md`
- 准备脚本: `scripts/prep-group.ps1`
- Next.js 环境变量: https://nextjs.org/docs/basic-features/environment-variables
