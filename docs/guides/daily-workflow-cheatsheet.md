# 快速参考：每日工作流

## ✅ 正确的工作流（每次都用这个）

```powershell
# 1. 更新主仓库
cd D:\Projects\investor-ai
git fetch origin
git reset --hard origin/main

# 2. 重置工作树（自动修复 BOM）
.\scripts\reset-worktrees-only.ps1

# 3. 开始工作
cd D:\Projects\investor-ai-g1
npm run dev
```

## ❌ 不要这样做

```powershell
# ❌ 不要手动执行这些命令
git fetch origin; git reset --hard origin/main; git clean -fd
.\scripts\reset-worktree.ps1 -Name g1  # 已废弃，用 reset-worktrees-only.ps1

# ❌ 不要单独执行
git sparse-checkout set ...
git branch -f main origin/main
```

## 🆘 遇到问题？

如果 `npm run dev` 报错：`Error parsing package.json`

```powershell
# 应急修复
cd D:\Projects\investor-ai-g1
D:\Projects\investor-ai\scripts\deep-clean-worktree.ps1
npm run dev
```

然后查看 [BOM 问题文档](../troubleshooting/bom-issue.md)

## 🔧 可用的脚本

| 脚本 | 用途 | 何时使用 |
|------|------|----------|
| `reset-worktrees-only.ps1` | 重置所有工作树 | **每天开始工作前** ✅ |
| `deep-clean-worktree.ps1` | 深度清理单个工作树 | 遇到 BOM 错误时 |
| `fix-bom-emergency.ps1` | 快速修复当前目录 | 紧急情况 |
| `reset-all.ps1` | 重置主仓库+工作树 | 不推荐（重复操作） |
| `reset-worktree.ps1` | 重置单个工作树 | 已被 reset-worktrees-only.ps1 取代 |

## 💡 为什么要用脚本？

Windows 上的 Git 操作会在 `package.json` 中注入 BOM（字节顺序标记），导致：
- ❌ `npm run dev` 失败
- ❌ `npm install` 失败
- ❌ JSON 解析错误

脚本自动在**三个关键时刻**清理 BOM：
1. git reset 后
2. git sparse-checkout 后
3. **所有操作完成后（最重要！）**

## 📋 端口分配

| 工作树 | 端口 | URL |
|--------|------|-----|
| investor-ai-g1 | 3001 | http://localhost:3001 |
| investor-ai-g2 | 3002 | http://localhost:3002 |
| investor-ai-g3 | 3003 | http://localhost:3003 |
| investor-ai-g4 | 3004 | http://localhost:3004 |
| investor-ai-g5 | 3005 | http://localhost:3005 |

## 🎯 记住三条

1. ✅ 用 `reset-worktrees-only.ps1` 重置环境
2. ❌ 不要手动执行 git 命令
3. 🆘 出问题用 `deep-clean-worktree.ps1`
