# Troubleshooting Guide

常见问题排查指南

## 目录

### 🔧 开发环境问题

- **[BOM Issue in package.json](./bom-issue.md)** ⚠️ 重要
  - 问题：`Error parsing package.json file` at line 1 column 1
  - 症状：执行 `git reset --hard` 或 `git sparse-checkout` 后 npm 命令失败
  - 解决：自动修复已集成在 `reset-worktree.ps1` 中
  - 状态：已彻底解决（2025-12-02）

## 快速索引

### 按症状查找

| 症状                   | 文档                           | 优先级 |
| ---------------------- | ------------------------------ | ------ |
| package.json 无法解析  | [bom-issue.md](./bom-issue.md) | 🔥 高  |
| npm install 失败       | [bom-issue.md](./bom-issue.md) | 🔥 高  |
| git 操作后项目无法启动 | [bom-issue.md](./bom-issue.md) | 🔥 高  |

### 按工具查找

| 工具       | 相关文档                       |
| ---------- | ------------------------------ |
| Git        | [bom-issue.md](./bom-issue.md) |
| npm        | [bom-issue.md](./bom-issue.md) |
| PowerShell | [bom-issue.md](./bom-issue.md) |

## 给 AI 助手的重要提示

如果你是 AI 助手在协助开发，请务必阅读：

1. ⚠️ **[BOM Issue](./bom-issue.md)** - 不要删除或"优化"BOM 清理代码
   - 这个问题已经反复修复多次
   - 当前的解决方案是唯一有效的
   - 不要试图通过修改 Git 配置来"根本解决"

## 添加新的故障排查文档

如果你需要添加新的故障排查指南：

1. 在 `docs/troubleshooting/` 目录下创建新的 `.md` 文件
2. 使用清晰的文件名（如 `database-connection-issue.md`）
3. 更新本 README 的目录和索引
4. 使用以下模板：

```markdown
# [问题标题]

## 问题描述

[简短描述问题症状]

## 问题根源

[解释为什么会出现这个问题]

## 解决方案

### ✅ 推荐方案

[最佳解决方法]

### 🔧 手动修复

[应急处理方法]

## ⚠️ 重要：防止未来破坏

[给 AI 助手和开发者的警告]

## 为什么其他方案无效

### ❌ 方案 X

[解释为什么某个看似合理的方案不可行]

## 相关文件

- [列出相关的代码文件]

## 历史记录

| 日期   | Commit | 说明   |
| ------ | ------ | ------ |
| [日期] | [hash] | [说明] |
```

## 维护指南

- 当问题得到解决时，在文档中标注"已解决"和日期
- 保留历史问题的文档作为参考
- 每个问题都应该包含"为什么其他方案无效"的说明，避免重复尝试
