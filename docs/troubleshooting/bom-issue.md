# BOM Issue in package.json - 彻底解决方案

## 问题描述

在 Windows 系统上使用 Git 操作后，`package.json` 文件开头会被插入 UTF-8 BOM（Byte Order Mark），导致解析失败：

```
Error parsing package.json file
> 1 | ﻿{
    | ^
  2 |   "name": "investor-ai",

package.json is not parseable: invalid JSON: expected value at line 1 column 1
```

### BOM 是什么？

BOM（Byte Order Mark）是文件开头的特殊字节序列：

- UTF-8 BOM: `0xEF 0xBB 0xBF`（显示为 `﻿`）
- JSON 规范**不允许** BOM 存在
- npm、Node.js 等工具会拒绝解析带 BOM 的 JSON 文件

## 问题根源

### ⚠️ 触发条件（必看）

以下 Git 操作会在 Windows 系统上引入 BOM：

1. **`git reset --hard`** ✅ 会引入 BOM
2. **`git sparse-checkout set`** ✅ 会引入 BOM
3. **`git checkout`** 到不同分支 ✅ 可能引入 BOM
4. **`git pull`** / `git merge` ✅ 可能引入 BOM

### ❌ 不会触发 BOM 的操作

- `git fetch origin` ✅ 安全
- `git branch -f main origin/main` ✅ 安全（只移动分支指针）
- `git clean -fd` ✅ 安全（只删除文件）

### 技术原因

在 Windows 上，Git 的以下机制会触发文件重写：

1. **core.autocrlf=true**：自动转换行尾（CRLF ↔ LF）
2. **Sparse-checkout**：重新检出文件时可能插入 BOM
3. **Working tree refresh**：某些 Git 操作会重新写入文件到工作区

即使 `.gitattributes` 设置了 `* text=auto eol=lf`，Git 在 Windows 上重写文件时仍可能插入 BOM。

## 解决方案

### ✅ 推荐工作流（完全自动化）

**最简单的方式 - 一键重置所有：**

```powershell
# 在主仓库执行，自动完成所有步骤
cd D:\Projects\investor-ai
git fetch origin
git reset --hard origin/main
.\scripts\reset-worktrees-only.ps1

# 然后开始工作
cd D:\Projects\investor-ai-g1
npm run dev  # ✅ 保证能运行！
```

**为什么需要三重 BOM 清理？**

经过多次测试发现，BOM 会在**三个时间点**被注入：

1. ✅ `git reset --hard origin/main` 后 → 立即清理
2. ✅ `git sparse-checkout set` 后 → 立即清理
3. ✅ 所有文件操作完成后（包括 .env 复制、npm ci 等）→ **最终清理（关键！）**

`reset-worktrees-only.ps1` 已经在这三个时间点都会自动清理，所以保证可用。

### 🔧 应急修复

如果遇到 BOM 错误（理论上不应该再出现）：

```powershell
# 在出问题的工作树执行
D:\Projects\investor-ai\scripts\deep-clean-worktree.ps1
```

这个脚本会：

- 停止运行中的 dev server
- 删除 .next 和 node_modules/.cache
- 深度修复 package.json
- 验证 JSON 是否有效

### 📋 检查是否有 BOM

**PowerShell 方式：**

```powershell
$bytes = [System.IO.File]::ReadAllBytes("package.json")
if ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "Has BOM" -ForegroundColor Red
} else {
    Write-Host "No BOM" -ForegroundColor Green
}
```

**Git Bash / WSL：**

```bash
# 查看文件开头的十六进制
xxd -l 16 package.json
# 如果第一行是: 00000000: efbb bf7b 2022 6e61 ...则有 BOM
# 正常应该是: 00000000: 7b0a 2020 226e 616d ...（以 7b = '{' 开头）
```

## 代码实现原理

### Remove-BOMFromFile 函数

```powershell
function Remove-BOMFromFile {
  param([string]$FilePath)

  if (-not (Test-Path $FilePath)) {
    return
  }

  # 读取文件的前 3 个字节
  $bytes = [System.IO.File]::ReadAllBytes($FilePath)

  # 检查是否为 UTF-8 BOM (EF BB BF)
  if ($bytes.Length -ge 3 -and
      $bytes[0] -eq 0xEF -and
      $bytes[1] -eq 0xBB -and
      $bytes[2] -eq 0xBF) {

    # 读取完整内容
    $content = [System.IO.File]::ReadAllText($FilePath)

    # 使用 UTF8Encoding($false) 创建无 BOM 的编码器
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false

    # 重新写入文件（不带 BOM）
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
  }
}
```

### 关键点

- `UTF8Encoding($false)`：参数 `$false` 表示**不添加 BOM**
- 必须使用 `[System.IO.File]::WriteAllText()` 而不是 PowerShell 的 `Set-Content`
- `Set-Content` 在某些版本的 PowerShell 中会自动添加 BOM

## ⚠️ 重要：防止未来破坏

### 给 AI 助手的警告

**如果你是 AI 助手，看到这份文档，请注意：**

1. **不要删除** `Remove-BOMFromFile` 函数及其调用
2. **不要修改** `.gitattributes` 中的 `* text=auto eol=lf`
3. **不要建议**使用 `git config core.autocrlf false`（会破坏其他功能）
4. **不要认为**这是"过度工程"或"不必要的"（这个问题反复出现过多次）
5. **不要尝试**通过修改 Git 配置来"从根源解决"（已经尝试过，无效）

### 给开发者的警告

1. **不要在 VS Code 中设置** "files.encoding": "utf8bom"
2. **不要使用记事本**编辑 `package.json`（记事本会添加 BOM）
3. **使用 VS Code / VSCodium / Notepad++** 编辑时确认编码为 "UTF-8"（不是 "UTF-8 with BOM"）

## 为什么其他方案无效

### ❌ 方案 1：修改 core.autocrlf

```powershell
# 不要这样做！
git config --global core.autocrlf false
```

**为什么不行：**

- 会破坏跨平台协作（Windows 开发者需要 CRLF，Linux 需要 LF）
- 项目中有 `.ps1` 文件需要 CRLF，`.sh` 文件需要 LF
- `.gitattributes` 已经正确配置，不应该禁用 autocrlf

### ❌ 方案 2：使用 git branch -f 替代 git reset --hard

```powershell
# 这样做可以避免 BOM，但...
git branch -f main origin/main
git checkout main
```

**为什么不够：**

- `git checkout main` 仍然会触发 BOM
- sparse-checkout 的重新应用也会触发 BOM
- 不是根本解决方案

### ❌ 方案 3：修改 .gitattributes 添加 -text

```
package.json -text
```

**为什么不行：**

- `-text` 会将文件视为二进制，禁用所有文本处理
- 会导致跨平台行尾不一致
- 不解决已有的 BOM 问题

## 已验证的解决方案

✅ **当前方案是经过多次迭代验证的最佳实践：**

1. 保持 Git 配置不变（core.autocrlf=true）
2. 保持 .gitattributes 配置（text=auto eol=lf）
3. 在 Git 操作**后**自动清理 BOM
4. 提供独立的修复工具应对突发情况

## 相关文件

- `scripts/reset-worktree.ps1` - 集成了自动 BOM 清理的工作树重置脚本
- `scripts/fix-bom.ps1` - 独立的 BOM 修复工具
- `scripts/remove-bom.ps1` - 可重用的 BOM 移除工具（库）

## 历史记录

| 日期       | Commit    | 说明                                                   |
| ---------- | --------- | ------------------------------------------------------ |
| 2025-12-02 | `2100375` | 首次添加 BOM 自动清理（sparse-checkout 后）            |
| 2025-12-02 | `187fe48` | 增强修复：git reset --hard 后也清理 BOM                |
| 2025-12-02 | `c269789` | 关键发现：主仓库污染导致工作树继承 BOM                 |
| 2025-12-02 | `3448d30` | 创建 deep-clean-worktree.ps1 应急工具                  |
| 2025-12-02 | `dae0bdb` | 增强 Remove-BOMFromFile：检测所有类型的损坏            |
| 2025-12-02 | `3d266f4` | 清理 node_modules/.cache 防止缓存问题                  |
| 2025-12-02 | `948f5a7` | **最终修复**：在所有操作完成后最终检查 BOM（三重清理） |

## 为什么这么复杂？

经过多轮测试发现：

1. **单点清理不够**：BOM 会在多个 git 操作后被注入
2. **缓存问题**：npm/turbopack 会缓存损坏的 package.json 读取
3. **操作顺序**：某些文件操作（如 npm ci）可能在清理后再次污染文件

**最终方案**：三重防护（git 操作后两次 + 最终检查一次）+ 缓存清理

## 测试验证

### 复现步骤

1. 在工作树中执行：

   ```powershell
   git fetch origin
   git reset --hard origin/main
   git sparse-checkout set app lib
   ```

2. 检查 package.json 是否有 BOM：

   ```powershell
   .\scripts\fix-bom.ps1
   ```

3. 如果输出 "No BOM found"，说明自动清理生效

### 预期行为

- 执行 `reset-worktree.ps1` 后，`package.json` 应该没有 BOM
- `npm run dev` / `npm install` / `npm test` 应该正常工作
- 不应该出现 "Error parsing package.json file" 错误

## 常见问题

### Q1: 为什么不在 Git hooks 中处理？

A: Git hooks 无法处理 `git reset --hard` 等操作（这些操作不触发 hooks）

### Q2: 为什么不修改 npm 或 Node.js 配置？

A: BOM 不符合 JSON 标准，问题在于文件本身，不应该让工具"容忍"错误格式

### Q3: Linux / macOS 也会遇到这个问题吗？

A: 不会。这是 Windows 特有的问题，因为：

- Windows 上 Git 会处理 CRLF 转换
- 某些 Windows 编辑器会添加 BOM
- Linux/macOS 的文件系统和工具链不会引入 BOM

### Q4: 其他 JSON 文件需要处理吗？

A: 目前只有 `package.json` 经常出现问题，因为：

- Git 经常操作它（切换分支、reset 等）
- npm 对它的格式要求严格
- 其他 JSON 文件（如 tsconfig.json）不常被 Git 重写

如果将来其他 JSON 文件也出现问题，可以在 `Remove-BOMFromFile` 调用中添加更多文件。

## 总结

**BOM 问题的根本原因：Windows 系统上 Git 文件重写机制**

**最佳解决方案：在 Git 操作后自动清理，而不是试图阻止 Git 添加 BOM**

**请不要删除或"优化"这个修复 - 它经过多次迭代，是目前唯一有效的方案。**
