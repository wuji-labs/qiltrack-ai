# 多工作组 Git Worktree 指南

**目标**：在"总部 + 5 个工作组"模式（结构详情见 `docs/guides/organization-structure.md`）下，利用 Git worktree 实现多分支并行开发。每个 worktree 拥有**独立的 `node_modules`**，避免 Turbopack 缓存冲突，支持多个 worktree 同时运行 `npm run dev`。

## 1. 术语

- **总部**：`D:\Projects\investor-ai`，常驻 `main`，维护 Snapshot/Plan/Report。
- **工作组目录**：`D:\Projects\investor-ai-gX`（X=1..5），对应 `group-*/feature-*` 分支。
- **脚本**：
  - `scripts/worktree-manager.ps1`：新增/清理 worktree
  - `scripts/prep-group.ps1`：完整初始化（worktree + env + npm ci）
  - `scripts/reset-worktree.ps1`：重置 worktree 到 origin/main（每次新任务前使用）

## 2. 前置要求

- 在总部执行 `npm install`（确保 `package-lock.json` 存在）。
- 确保 `git` ≥2.40，支持 `sparse-checkout`。
- 需要 PowerShell 5+（或兼容环境）以运行脚本。

## 3. 创建工作区

```powershell
# 列现有 worktree
powershell -ExecutionPolicy Bypass -File scripts/worktree-manager.ps1 list

# 推荐：使用 prep 脚本（创建 + env 合并 + npm ci + 生成 GROUP.md）
powershell -ExecutionPolicy Bypass -File scripts/prep-group.ps1 `
  -Name g1 `
  -Branch g1/feature-reporting `
  -GroupEnvFile .env.group-a

# 仅建 worktree（不处理 env 和依赖）
powershell -ExecutionPolicy Bypass -File scripts/worktree-manager.ps1 `
  -Command add `
  -Name g1 `
  -Branch g1/feature-reporting `
  -Folders app,docs,hooks,lib,supabase,types,__tests__,scripts
```

会生成 `D:\Projects\investor-ai-g1`，其中：

- 仅检出指定目录；其余文件按需可 `git -C <path> sparse-checkout add <dir>`。
- **独立 `node_modules`**：`prep-group.ps1` 会自动运行 `npm ci` 安装依赖。
- `scripts/prep-group.ps1` 还会写入 `.env.local` 与 `GROUP.md`（记录组别、分支、启动模板）。

## 4. 长期 Worktree 模式（推荐）

**不删除 worktree，长期保留 5 个工作区**。每次开始新任务前，使用重置脚本：

```powershell
# 重置 G1 工作区到最新 main
powershell -ExecutionPolicy Bypass -File scripts/reset-worktree.ps1 -Name g1

# 如果不需要更新 node_modules（依赖没变）
powershell -ExecutionPolicy Bypass -File scripts/reset-worktree.ps1 -Name g1 -SkipNpmCi

# 预览模式（不实际执行）
powershell -ExecutionPolicy Bypass -File scripts/reset-worktree.ps1 -Name g1 -DryRun
```

重置脚本会执行：

1. `git fetch origin` - 获取最新代码
2. `git reset --hard origin/main` - 重置到 main
3. `git clean -fd` - 清理未跟踪文件（保留 node_modules、.next、.env.local）
4. `npm ci`（如需要）- 更新依赖

## 5. 依赖管理

### 独立 node_modules 模式

- 每个 worktree 有自己的 `node_modules` 目录
- 使用 `npm ci` 根据 `package-lock.json` 精确安装
- **优点**：
  - 多个 worktree 可以同时运行 `npm run dev`
  - 避免 Turbopack/Next.js 缓存冲突
  - 各 worktree 完全隔离，互不影响

### 运行开发服务器

```bash
# 直接在 worktree 目录运行（推荐）
cd D:\Projects\investor-ai-g1
npm run dev -- --port 3001

# 或使用 --prefix（从总部运行）
npm run dev --prefix ../investor-ai-g1 -- --port 3001
```

### 多 worktree 并行开发

```bash
# 终端 1: G1 在 3001 端口
cd D:\Projects\investor-ai-g1 && npm run dev -- --port 3001

# 终端 2: G2 在 3002 端口
cd D:\Projects\investor-ai-g2 && npm run dev -- --port 3002

# 终端 3: G3 在 3003 端口
cd D:\Projects\investor-ai-g3 && npm run dev -- --port 3003
```

## 6. 环境变量

- 公共变量写入 `.env.shared`（新增文件，**不提交**）；工作组特有变量写 `.env.group-a`。
- `prep-group.ps1` 会自动合并生成 `.env.local`。
- `reset-worktree.ps1` 会保留 `.env.local`，不会删除。

## 7. VS Code & 多 root

- 建议建立 `investor-ai.code-workspace`，包含总部 + 5 个 worktree；共享 `.vscode/settings.json`（ESLint、format、env hint）。
- 每个 worktree 有独立的 `node_modules`，可以正常使用所有 VS Code 扩展。

## 8. 提交流程

1. `git -C ../investor-ai-gX status` 确认干净。
2. `git -C ../investor-ai-gX fetch --all`。
3. `git -C ../investor-ai-gX rebase origin/main`（或指定 upstream）。
4. 在 worktree 目录运行 `npm run lint` 和 `npm test`。
5. 按 Snapshot/CAVR 流程提交 PR；终端状态更新用 `@Codex Report/Status/Next`。

## 9. 每日工作流程

### 开始新任务

```powershell
# 1. 重置工作区
.\scripts\reset-worktree.ps1 -Name g1

# 2. 创建任务分支
cd D:\Projects\investor-ai-g1
git checkout -b feature/my-task

# 3. 开始开发
npm run dev -- --port 3001
```

### 继续昨天的任务

```powershell
# 无需重置，直接继续
cd D:\Projects\investor-ai-g1
git status
npm run dev -- --port 3001
```

### 任务完成后

```powershell
# 1. 提交代码
cd D:\Projects\investor-ai-g1
git add .
git commit -m "feat: my feature"
git push origin feature/my-task

# 2. 创建 PR
gh pr create --fill

# 3. 重置工作区准备下一个任务（可选）
.\scripts\reset-worktree.ps1 -Name g1
```

## 10. 常见问题

| 症状                         | 说明                     | 处理                                         |
| ---------------------------- | ------------------------ | -------------------------------------------- |
| `git worktree add` 报存在    | 目录未清空或锁定         | 先 `worktree remove` 或手动删除目录          |
| `npm run dev` Turbopack 报错 | 旧的 Junction 链接残留   | 删除 `node_modules` 后重新 `npm ci`          |
| 多个 dev server 端口冲突     | 默认都用 3000            | 每个用不同端口 `--port 300X`                 |
| sparse-checkout 缺文件       | 未列入 `Folders`         | `git -C <wt> sparse-checkout add <dir>` 补齐 |
| 重置后 node_modules 过期     | package-lock.json 有更新 | 脚本会自动检测并运行 `npm ci`                |

## 11. 工作组协作流程

- **HQ 职责**：维护 `docs/plans/workstreams.md` 任务看板，分配任务给各工作组，审查最终 PR。详见 `docs/guides/organization-structure.md`。
- **各组 Codex 职责**：接收 HQ 任务后，撰写组内 Snapshot（`docs/decisions/<date>-gX-*.md`）和实施计划（`docs/plans/gX-*.md`），指导本组 Claude 实施。重大设计决策需向 HQ 汇报并获得批准。
- **各组 Claude 职责**：按照 Codex 的指导编写代码和测试，输出 CAVR 报告（`docs/reports/<date>-gX-*-cavr.md`），确保 `npm run lint/test` 通过，最终向本组 Codex 汇报，由 Codex 决定是否提交 PR 或上报 HQ。

> 详细协作规范与沟通模板请参考 `CODEX_CLAUDE_COLLAB.md` 和 PR 流程文档。
