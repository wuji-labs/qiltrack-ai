# 项目重命名脚本：investor-ai → qiltrack-ai
# 使用方法：关闭 VS Code 后，在 PowerShell 中运行此脚本

$ErrorActionPreference = "Stop"
$OldName = "investor-ai"
$NewName = "qiltrack-ai"
$ProjectsDir = "D:\Projects"

Write-Host "🔄 开始重命名项目..." -ForegroundColor Cyan

# 1. 进入 Projects 目录
Set-Location $ProjectsDir

# 2. 清理 git worktree 记录
Write-Host "📋 清理 git worktree 记录..." -ForegroundColor Yellow
Set-Location "$ProjectsDir\$OldName"
git worktree prune 2>$null

# 解锁并移除所有 worktree 记录
$worktrees = @("g1", "g2", "g3", "g4", "g5")
foreach ($wt in $worktrees) {
    $oldPath = "$ProjectsDir\$OldName-$wt"
    git worktree unlock $oldPath 2>$null
    # 只移除 git 记录，不删除实际文件夹
    git worktree remove $oldPath --force 2>$null
}
git worktree prune

Set-Location $ProjectsDir

# 3. 重命名主文件夹
Write-Host "📁 重命名主文件夹: $OldName → $NewName" -ForegroundColor Yellow
if (Test-Path $NewName) {
    Write-Host "❌ 错误: $NewName 已存在!" -ForegroundColor Red
    exit 1
}
Rename-Item -Path $OldName -NewName $NewName

# 4. 重命名 worktree 文件夹
foreach ($wt in $worktrees) {
    $oldPath = "$OldName-$wt"
    $newPath = "$NewName-$wt"
    if (Test-Path $oldPath) {
        Write-Host "📁 重命名: $oldPath → $newPath" -ForegroundColor Yellow
        Rename-Item -Path $oldPath -NewName $newPath
    }
}

# 5. 重新添加 worktree（如果文件夹存在）
Write-Host "🔗 重新链接 worktree..." -ForegroundColor Yellow
Set-Location "$ProjectsDir\$NewName"

foreach ($wt in $worktrees) {
    $wtPath = "$ProjectsDir\$NewName-$wt"
    if (Test-Path $wtPath) {
        # 检查分支是否存在
        $branch = "$wt/develop"
        $branchExists = git branch --list $branch
        if ($branchExists) {
            Write-Host "  链接 $wt → $branch" -ForegroundColor Gray
            git worktree add $wtPath $branch 2>$null
        }
    }
}

# 6. 验证
Write-Host ""
Write-Host "✅ 重命名完成！" -ForegroundColor Green
Write-Host ""
Write-Host "当前 worktree 列表:" -ForegroundColor Cyan
git worktree list

Write-Host ""
Write-Host "📌 下一步:" -ForegroundColor Cyan
Write-Host "   cd $ProjectsDir\$NewName"
Write-Host "   code ."
