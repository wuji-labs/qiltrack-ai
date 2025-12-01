# 为所有 worktree 设置固定端口
# 运行此脚本一次性配置所有 worktree

Write-Host "=== Configuring ports for all worktrees ===" -ForegroundColor Cyan
Write-Host ""

$worktrees = @(
    @{ Name = "g1"; Port = 3001 }
    @{ Name = "g2"; Port = 3002 }
    @{ Name = "g3"; Port = 3003 }
    @{ Name = "g4"; Port = 3004 }
    @{ Name = "g5"; Port = 3005 }
)

$scriptPath = Join-Path $PSScriptRoot "set-worktree-port.ps1"

foreach ($wt in $worktrees) {
    Write-Host "Configuring $($wt.Name) -> port $($wt.Port)..." -ForegroundColor Yellow

    try {
        & $scriptPath -Name $wt.Name -Port $wt.Port
        Write-Host "✓ $($wt.Name) configured" -ForegroundColor Green
    } catch {
        Write-Warning "Failed to configure $($wt.Name): $_"
    }

    Write-Host ""
}

Write-Host "=== All worktrees configured! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:"
Write-Host "  g1 → http://localhost:3001"
Write-Host "  g2 → http://localhost:3002"
Write-Host "  g3 → http://localhost:3003"
Write-Host "  g4 → http://localhost:3004"
Write-Host "  g5 → http://localhost:3005"
Write-Host ""
Write-Host "Next: Restart all dev servers to apply changes"
