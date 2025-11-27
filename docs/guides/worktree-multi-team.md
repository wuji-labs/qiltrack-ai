# 多工作组 Git Worktree 指南

**目标**：在“总部 + 5 个工作组”模式下，利用 Git worktree 共享 `.git` 与依赖，避免重复安装 `node_modules`，保证各分支隔离、文档同步、磁盘占用最小。

## 1. 术语
- **总部**：`D:\Projects\investor-ai`，常驻 `main`，维护 Snapshot/Plan/Report。
- **工作组目录**：`D:\Projects\investor-ai-gX`（X=1..5），对应 `group-*/feature-*` 分支。
- **脚本**：`scripts/worktree-manager.ps1`、`scripts/prep-group.ps1`（待扩展）负责新增/清理。

## 2. 前置要求
- 在总部执行 `npm install`（必须完成后再创建 worktree）。
- 确保 `git` ≥2.40，支持 `sparse-checkout`。
- 需要 PowerShell 5+（或兼容环境）以运行脚本。

## 3. 创建工作区
```powershell
# 列现有 worktree
powershell -ExecutionPolicy Bypass -File scripts/worktree-manager.ps1 list

# 新建 group-a 分支工作区（自动 --no-checkout + sparse-checkout + node_modules 链接）
powershell -ExecutionPolicy Bypass -File scripts/worktree-manager.ps1 `
  -Command add `
  -Name g1 `
  -Branch group-a/feature-reporting `
  -Folders app,docs,hooks,lib,supabase,types,__tests__,scripts
```
会生成 `D:\Projects\investor-ai-g1`，其中：
- 仅检出指定目录；其余文件按需可 `git -C <path> sparse-checkout add <dir>`。
- `node_modules` 自动创建到总部的符号链接（需管理员权限）。如链接失败，手动运行 `cmd /c mklink /J "<worktree>\node_modules" "<root>\node_modules"`。

## 4. 依赖与脚本
- 所有 `npm run ...` 命令从总部触发并传 `--prefix`：
  ```bash
  npm run lint --prefix ../investor-ai-g1
  npm run test --prefix ../investor-ai-g1
  npm run dev --prefix ../investor-ai-g1
  ```
- 禁止在工作组目录内执行 `npm install`，避免重复安装。
- 若需额外依赖（例如特定实验），在总部更新 `package.json` → `npm install` → 提交锁文件即可。

## 5. 环境变量
- 公共变量写入 `.env.shared`（新增文件，**不提交**）；工作组特有变量写 `.env.group-a`。
- 使用脚本合并：
  ```powershell
  Get-Content .env.shared, .env.group-a | Set-Content ../investor-ai-g1/.env.local
  ```
- 禁止将密钥散落在多个目录，所有源文件参考 `ENVIRONMENT.md`。

## 6. VS Code & 多 root
- 建议建立 `investor-ai.code-workspace`，包含总部 + 5 个 worktree；共享 `.vscode/settings.json`（ESLint、format、env hint）。
- 每个 worktree 只加载必要扩展，关闭自动 npm script detection，减少重复安装。

## 7. 提交流程
1. `git -C ../investor-ai-gX status` 确认干净。
2. `git -C ../investor-ai-gX fetch --all`。
3. `git -C ../investor-ai-gX rebase origin/main`（或指定 upstream）。
4. `npm run lint/test --prefix ../investor-ai-gX`。
5. 按 Snapshot/CAVR 流程提交 PR；终端状态更新用 `@Codex Report/Status/Next`。

## 8. 清理
```powershell
powershell -ExecutionPolicy Bypass -File scripts/worktree-manager.ps1 -Command remove -Name g1
```
命令会自动 `unlock + remove`，并删除目录；必要时手动清理残留（如 `.env.local`）。

## 9. 常见问题
| 症状 | 说明 | 处理 |
|------|------|------|
| `git worktree add` 报存在 | 目录未清空或锁定 | 先 `worktree remove` 或手动删除目录 |
| `mklink` 失败 | 没有管理员权限 | 以管理员终端运行或手动复制 node_modules（不推荐） |
| `npm run dev --prefix` 报 env 缺失 | `.env.local` 未合并 | 按第 5 步重新生成 |
| sparse-checkout 缺文件 | 未列入 `Folders` | `git -C <wt> sparse-checkout add <dir>` 补齐 |

## 10. 责任划分
- 总部负责：更新 `docs/plans/workstreams.md`、派发分工、维护共享依赖、批准 PR。
- 工作组 Codex：撰写组内 Snapshot、答疑、确保 `docs/decisions/` 与实施保持一致。
- 工作组 Claude：编写实现、更新 `docs/reports/`、按规定输出 `npm run lint/test` 结果。

> 所有流程变更请同步 `CODEX_CLAUDE_COLLAB.md` 并在 PR 描述附上新指南链接。
