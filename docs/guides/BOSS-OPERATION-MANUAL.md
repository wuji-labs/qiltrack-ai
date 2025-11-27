# 老板操作手册 - 多 AI 并行开发完整流程

> **你的角色**：唯一真人BOSS，负责提需求、转发消息、确认结果
> **AI 角色**：HQ + 多个工作组（G1-G5），每个组有 Codex（架构师）和 Claude（程序员）

---

## 🎯 核心概念

### 你的工作环境
```
D:\Projects\investor-ai          ← 总部（main 分支）
├─ investor-ai-g1               ← G1 工作区（g1/* 分支）
├─ investor-ai-g2               ← G2 工作区（g2/* 分支）
├─ investor-ai-g3               ← G3 工作区（g3/* 分支）
├─ investor-ai-g4               ← G4 工作区（g4/* 分支）
└─ investor-ai-g5               ← G5 工作区（g5/* 分支）
```

### AI 团队结构
```
老板（你）
    ↓ 提需求
HQ（VS Code Codex 插件）
    ↓ 分配任务
    ├─ G1-Codex → G1-Claude
    ├─ G2-Codex → G2-Claude
    ├─ G3-Codex → G3-Claude
    ├─ G4-Codex → G4-Claude
    └─ G5-Codex → G5-Claude
```

### VS Code 终端设置
- **总部终端**：用于跟 HQ 对话（Codex 插件在这里）
- **G1 终端 × 2**：一个给 G1-Codex，一个给 G1-Claude
- **G2 终端 × 2**：一个给 G2-Codex，一个给 G2-Claude
- 以此类推...

---

## 📋 准备阶段（只需要做一次）

### 1. 检查总部环境

```powershell
cd D:\Projects\investor-ai
git status  # 确保在 main 分支
npm install  # 确保依赖已安装
```

### 2. 创建 5 个长期工作区

```powershell
# 创建 G1-G5 工作区（每个都会自动安装独立的 node_modules）
.\scripts\prep-group.ps1 -Name g1 -Branch g1/init
.\scripts\prep-group.ps1 -Name g2 -Branch g2/init
.\scripts\prep-group.ps1 -Name g3 -Branch g3/init
.\scripts\prep-group.ps1 -Name g4 -Branch g4/init
.\scripts\prep-group.ps1 -Name g5 -Branch g5/init

# 验证
git worktree list
```

**这些工作区会长期保留，不需要每次任务都重建。**

---

## 🚀 开始新任务的完整流程

### 阶段 1：你 → HQ（提需求）

#### 1.1 在总部终端跟 HQ 说话

**位置**：`D:\Projects\investor-ai`（VS Code Codex 插件）

```
@HQ 我有个新需求：
登录页面要显示当前用的是本地还是线上的 Supabase
本地显示绿色提示，线上显示橙色警告
```

#### 1.2 HQ 会做什么？

HQ 会自动：
1. 分析需求
2. 拆解成任务
3. 更新 `docs/plans/workstreams.md`
4. 创建 Snapshot 文件（如 `docs/decisions/2025-11-27-supabase-local-auth.md`）

#### 1.3 HQ 会问你确认

```
@老板
Report: docs/plans/workstreams.md
Status: 已拆分为 G1（UI）和 G2（配置脚本）两个任务
Next: 确认后我开始分配
```

**你回复**：
```
@HQ 确认，开始吧
```

---

### 阶段 2：重置工作区

#### 2.1 重置要用的工作区

工作区已经存在，只需重置到最新 main：

```powershell
# 重置 G1 和 G2 工作区
.\scripts\reset-worktree.ps1 -Name g1
.\scripts\reset-worktree.ps1 -Name g2
```

#### 2.2 创建任务分支

```powershell
# G1 创建任务分支
cd D:\Projects\investor-ai-g1
git checkout -b g1/local-auth-signal

# G2 创建任务分支
cd D:\Projects\investor-ai-g2
git checkout -b g2/supabase-env-sync
```

#### 2.3 验证工作区状态

```powershell
git worktree list

# 应该看到：
# D:/Projects/investor-ai     xxx [main]
# D:/Projects/investor-ai-g1  xxx [g1/local-auth-signal]
# D:/Projects/investor-ai-g2  xxx [g2/supabase-env-sync]
```

---

### 阶段 3：打开终端 + 启动 AI

#### 3.1 在 VS Code 打开多个终端

**方法**：
1. 按 `Ctrl+Shift+` ` （打开终端面板）
2. 点击右上角 `+` 图标多次，创建 5 个终端
3. 重命名每个终端：右键终端标签 → Rename → 输入名字

**终端设置**：
```
终端1: HQ            → cd D:\Projects\investor-ai
终端2: G1-Codex      → cd D:\Projects\investor-ai-g1
终端3: G1-Claude     → cd D:\Projects\investor-ai-g1
终端4: G2-Codex      → cd D:\Projects\investor-ai-g2
终端5: G2-Claude     → cd D:\Projects\investor-ai-g2
```

#### 3.2 启动各个 AI

**重要**：在每个终端里打开不同的 AI 对话

| 终端 | AI 工具 | 模型建议 |
|------|---------|----------|
| HQ | VS Code Codex 插件 | Claude Sonnet（已内置） |
| G1-Codex | Claude.ai 网页版 | GPT-4 或 Claude Opus |
| G1-Claude | Cursor AI | Claude Sonnet |
| G2-Codex | Claude.ai 网页版 | GPT-4 或 Claude Opus |
| G2-Claude | Cursor AI | Claude Sonnet |

**技巧**：
- 每个 AI 在**不同的浏览器标签页**或**不同的应用窗口**
- 建议用**不同的模型**，避免混淆

---

### 阶段 4：HQ 分配任务

#### 4.1 HQ 通知各组

HQ 会发这样的消息（你需要复制粘贴）：

```
@G1-Codex
Report: docs/plans/workstreams.md
Status: 新任务 WS-G1-LOCAL-AUTH，实现登录页 Supabase 状态提示
Next: 阅读 docs/decisions/2025-11-27-supabase-local-auth.md 并创建组内 Snapshot
```

**你的操作**：
1. **复制**上面这段话
2. **切换到 G1-Codex 终端**（网页版 Claude）
3. **粘贴**并发送

#### 4.2 同时通知 G2

```
@G2-Codex
Report: docs/plans/workstreams.md
Status: 新任务 WS-G2-CLI-ENV，实现 Supabase 环境切换脚本
Next: 阅读 docs/decisions/2025-11-27-supabase-local-auth.md 并创建组内 Snapshot
```

**你的操作**：
1. 复制
2. 切换到 **G2-Codex 终端**
3. 粘贴并发送

---

### 阶段 5：组内协作（你当传话筒）

#### 5.1 G1-Codex 回复

G1-Codex 会阅读文档，然后回复：

```
@G1-Claude
Report: docs/decisions/2025-11-27-supabase-local-auth.md
Status: 已理解需求，创建组内计划
Next: 实现 lib/config/supabaseEnv.ts 和 login 页面 Banner，详见 Snapshot
```

**你的操作**：
1. **复制** G1-Codex 的回复
2. **切换到 G1-Claude 终端**
3. **粘贴**并发送

#### 5.2 G1-Claude 开始工作

G1-Claude 会回复：

```
@G1-Codex
Report: 正在实现 supabaseEnv.ts
Status: 创建文件、添加测试
Next: 完成后通知你审查
```

**你的操作**：
1. **复制** G1-Claude 的回复
2. **切换回 G1-Codex 终端**
3. **粘贴**并发送

#### 5.3 重复转发

**规律**：
- G1-Codex 说话 → 复制 → 粘贴给 G1-Claude
- G1-Claude 说话 → 复制 → 粘贴给 G1-Codex
- G2 同理

**你的角色**：就是个**传话筒**，复制粘贴就行

---

### 阶段 6：查看进度

#### 6.1 看文件变化

在 VS Code 左侧 **Source Control** 面板：
- 可以看到哪些文件被修改了
- 点击文件可以看 diff（改了什么）

#### 6.2 看 workstreams.md

```powershell
# 在总部终端
code docs/plans/workstreams.md
```

**内容示例**：
```markdown
| ID | Group | Status | Notes |
|----|-------|--------|-------|
| WS-G1-LOCAL-AUTH | G1 | In Progress 60% | UI 完成，测试中 |
| WS-G2-CLI-ENV | G2 | In Progress 30% | 脚本已完成 |
```

---

### 阶段 7：完成任务

#### 7.1 G1-Claude 完成工作

```
@G1-Codex
Report: docs/reports/2025-11-27-g1-local-auth-cavr.md
Status: 实现完成，所有测试通过
Next: 请审查并决定是否提 PR
```

**你的操作**：
1. 复制
2. 粘贴给 G1-Codex

#### 7.2 G1-Codex 审查

G1-Codex 会检查代码，然后回复：

```
@G1-Claude
Report: 审查通过
Status: 代码质量良好，测试覆盖充分
Next: 提交 PR，使用模板 .github/pull_request_template.md
```

**你的操作**：
1. 复制
2. 粘贴给 G1-Claude

#### 7.3 G1-Claude 提交 PR

G1-Claude 会运行：

```bash
cd D:\Projects\investor-ai-g1
git add .
git commit -m "feat(auth): add Supabase status indicator"
git push origin g1/local-auth-signal
gh pr create --fill
```

#### 7.4 G1-Codex 向 HQ 汇报

```
@HQ
Report: https://github.com/explore0012/ai-report/pull/37
Status: G1 任务完成，PR 已提交
Next: 请审查并决定是否合并
```

**你的操作**：
1. 复制
2. 切换到 **HQ 终端**（总部）
3. 粘贴

---

### 阶段 8：HQ 审查 + 合并

#### 8.1 HQ 审查 PR

HQ 会检查：
- 代码改动
- 测试结果
- 文档完整性

#### 8.2 HQ 问你确认

```
@老板
Report: https://github.com/explore0012/ai-report/pull/37
Status: G1 的 PR 质量良好，测试通过
Next: 确认合并吗？
```

**你回复**：
```
@HQ 确认合并
```

#### 8.3 HQ 合并 PR

```bash
gh pr merge 37 --squash
```

#### 8.4 更新 workstreams.md

HQ 会更新状态：
```markdown
| ID | Status | Notes |
|----|--------|-------|
| WS-G1-LOCAL-AUTH | ✅ Done | 已合并到 main |
```

---

### 阶段 9：重置工作区（任务完成后）

#### 9.1 HQ 通知准备下一个任务

```
@老板
Report: docs/plans/workstreams.md
Status: G1 任务已完成并合并
Next: 可以重置 G1 工作区准备下一个任务了
```

**你确认**：
```
@HQ 重置 G1
```

#### 9.2 重置 worktree（不删除）

```powershell
# 重置工作区到最新 main
.\scripts\reset-worktree.ps1 -Name g1

# 如果依赖没变，跳过 npm ci 更快
.\scripts\reset-worktree.ps1 -Name g1 -SkipNpmCi
```

#### 9.3 工作区准备好接受下一个任务

- G1-Codex 和 G1-Claude 的终端保持打开
- AI 对话历史保留，可以继续使用

---

## 🔄 常驻 vs 临时工作区

### 推荐方案：长期保留工作区

**5 个 worktree 长期保留，不删除**。每次新任务前重置即可。

**优点**：
- 终端一直开着，不用重复建
- AI 对话历史保留
- 独立 `node_modules`，避免 Turbopack 冲突
- 可以同时运行多个 `npm run dev`

**每次新任务前运行**：
```powershell
# 重置工作区到最新 main
.\scripts\reset-worktree.ps1 -Name g1
```

这个脚本会自动：
1. `git fetch origin` - 获取最新代码
2. `git reset --hard origin/main` - 重置到 main
3. `git clean -fd` - 清理（保留 node_modules、.env.local）
4. `npm ci`（如需要）- 更新依赖

---

## 📝 关键文件说明

### 总部文件（所有组都能看到）

| 文件 | 作用 | 谁维护 |
|------|------|--------|
| `docs/plans/workstreams.md` | 任务看板 | HQ |
| `docs/decisions/<date>-<topic>.md` | 需求 Snapshot | HQ |
| `docs/guides/` | 协作手册 | HQ |
| `CODEX_CLAUDE_COLLAB.md` | 协作规范 | HQ |

### 工作区文件（每个组独立）

| 文件 | 作用 | 谁维护 |
|------|------|--------|
| `GROUP.md` | 组信息和启动模板 | 自动生成 |
| `.env.local` | 环境变量 | 自动生成 |
| `docs/reports/<date>-gX-*-cavr.md` | 组内进度报告 | Claude |
| `docs/plans/gX-*.md` | 组内计划 | Codex |

### 重要：worktree 里的 AI 能看到什么？

**能看到**：
- ✅ 所有代码文件（app, lib, hooks, scripts, types）
- ✅ 所有文档（docs/, CODEX_CLAUDE_COLLAB.md 等）
- ✅ 配置文件（package.json, tsconfig.json 等）

**看不到**：
- ❌ 其他分支的改动（除非 git fetch）
- ❌ 总部 .gitignore 的文件（如 .env.local）

---

## 🎯 快速参考：每天开工流程

### 1. 早上开工

```powershell
# 1. 进总部，拉最新代码
cd D:\Projects\investor-ai
git checkout main
git pull

# 2. 重置要用的工作区（如 G1）
.\scripts\reset-worktree.ps1 -Name g1

# 3. 打开 VS Code
code .

# 4. 打开多个终端（HQ + 各组）

# 5. 启动各个 AI 对话窗口

# 6. 跟 HQ 说话
@HQ 早上好，今天继续昨天的任务
```

### 2. 检查状态

```powershell
# 看任务看板
code docs/plans/workstreams.md

# 看 worktree 列表
git worktree list

# 看某个组的进度
cd D:\Projects\investor-ai-g1
git status
git log --oneline -5
```

### 3. 晚上收工

```powershell
# 让各组汇报进度
@G1-Codex 今天进度如何？
@G2-Codex 今天进度如何？

# 让 HQ 总结
@HQ 汇总今天的进度

# 保存工作（如果需要）
cd D:\Projects\investor-ai-g1
git add .
git commit -m "WIP: save progress"
git push

# 关闭 AI 对话（可选）
```

---

## 🆘 常见问题

### Q1: 忘记在哪个终端了？

**解决**：看终端标签名，或者运行 `pwd` 查看当前目录

### Q2: AI 对话窗口关了，怎么恢复？

**解决**：重新打开 AI，说 "请继续之前的任务，我是 G1-Claude"

### Q3: 复制粘贴太麻烦？

**解决**：
1. 使用 Windows PowerToys 的 Keyboard Manager 设置快捷键
2. 或者让 HQ 自动化转发（需要开发脚本）

### Q4: worktree 文件丢失？

**解决**：
```powershell
# 使用重置脚本
.\scripts\reset-worktree.ps1 -Name gX

# 或手动重置
cd D:\Projects\investor-ai-gX
git reset --hard HEAD
git sparse-checkout set app docs hooks lib supabase types __tests__ scripts
```

### Q5: 分支冲突？

**解决**：
```powershell
cd D:\Projects\investor-ai-gX
git fetch origin
git rebase origin/main
# 如果有冲突，让 Claude 解决
```

### Q6: 如何暂停一个任务？

**方法：保留 worktree，提交到远程**
```powershell
cd D:\Projects\investor-ai-g1
git add .
git commit -m "WIP: paused"
git push

# 下次继续时直接 pull
git pull
```

### Q7: Turbopack/npm run dev 报错？

**解决**：独立安装 node_modules
```powershell
cd D:\Projects\investor-ai-g1

# 删除旧的 node_modules（可能是 Junction 链接）
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# 重新安装
npm ci
```

### Q8: 多个 worktree 同时运行 dev server？

**解决**：每个用不同端口
```powershell
# G1
cd D:\Projects\investor-ai-g1
npm run dev -- --port 3001

# G2
cd D:\Projects\investor-ai-g2
npm run dev -- --port 3002
```

---

## 🚦 完整示例：从需求到上线

### 场景：添加"报告导出 PDF"功能

#### 1. 提需求（10:00）

```
你 → HQ: 我想加个功能，用户可以把报告导出成 PDF
```

#### 2. HQ 分析（10:05）

```
HQ → 你:
Report: docs/decisions/2025-11-28-pdf-export.md
Status: 已拆分为 G3（UI 按钮）和 G4（PDF 生成）
Next: 确认后开始
```

```
你 → HQ: 确认
```

#### 3. 重置工作区 + 创建分支（10:10）

```powershell
# 重置 G3 和 G4 到最新 main
.\scripts\reset-worktree.ps1 -Name g3
.\scripts\reset-worktree.ps1 -Name g4

# 创建任务分支
cd D:\Projects\investor-ai-g3 && git checkout -b g3/pdf-export-ui
cd D:\Projects\investor-ai-g4 && git checkout -b g4/pdf-generation
```

#### 4. HQ 分配任务（10:15）

```
HQ → 你（复制给 G3-Codex）:
@G3-Codex
Report: docs/decisions/2025-11-28-pdf-export.md
Status: 实现报告页的"导出 PDF"按钮
Next: 创建组内 Snapshot

HQ → 你（复制给 G4-Codex）:
@G4-Codex
Report: docs/decisions/2025-11-28-pdf-export.md
Status: 实现 PDF 生成 API
Next: 创建组内 Snapshot
```

#### 5. 组内协作（10:20 - 16:00）

**你的工作**：在 G3-Codex 和 G3-Claude 之间复制粘贴，在 G4-Codex 和 G4-Claude 之间复制粘贴

**6 小时后**：

```
G3-Claude → G3-Codex:
Report: docs/reports/2025-11-28-g3-pdf-ui-cavr.md
Status: UI 完成，测试通过
Next: 提 PR

G4-Claude → G4-Codex:
Report: docs/reports/2025-11-28-g4-pdf-api-cavr.md
Status: API 完成，测试通过
Next: 提 PR
```

#### 6. 提交 PR（16:10）

```
G3-Claude: gh pr create --fill
G4-Claude: gh pr create --fill

G3-Codex → HQ（你复制）:
Report: https://github.com/explore0012/ai-report/pull/38
Status: G3 完成
Next: 请审查

G4-Codex → HQ（你复制）:
Report: https://github.com/explore0012/ai-report/pull/39
Status: G4 完成
Next: 请审查
```

#### 7. HQ 审查（16:30）

```
HQ → 你:
Report: PR #38 和 #39
Status: 两个 PR 都通过审查
Next: 确认合并吗？

你 → HQ: 确认

HQ: 已合并，功能已上线
```

#### 8. 重置准备下一个任务（17:00）

```powershell
# 重置 G3 和 G4 工作区
.\scripts\reset-worktree.ps1 -Name g3
.\scripts\reset-worktree.ps1 -Name g4
```

**总耗时**：7 小时（需求 → 上线）
**工作区状态**：G3、G4 已重置，准备接受下一个任务

---

## 🎉 总结

### 你的工作

1. **提需求** - 跟 HQ 说你想要什么
2. **确认计划** - HQ 给你看计划，你说 OK 或改
3. **转发消息** - 在各个 AI 之间复制粘贴
4. **确认合并** - 功能做好了，你说合并
5. **重置工作区** - 任务完成后运行 `.\scripts\reset-worktree.ps1 -Name gX`

### AI 的工作

- **HQ**：理解需求、拆解任务、分配工作、审查 PR
- **Codex**：设计架构、指导 Claude、审查代码
- **Claude**：写代码、写测试、提交 PR

### 关键技巧

1. **终端命名清楚** - 一眼看出这是哪个 AI
2. **复制粘贴准确** - 不要漏掉 @XXX
3. **定期查看进度** - 看 workstreams.md
4. **任务完成就重置** - 运行 `reset-worktree.ps1`，保持干净
5. **独立端口** - 每个 worktree 用不同端口 `--port 300X`

---

**下一步**：保存这个文档，打印出来放旁边，每次开工看一眼！

*最后更新：2025-11-27*
