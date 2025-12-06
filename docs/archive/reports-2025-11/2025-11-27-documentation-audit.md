# 项目文档审查报告

## 📋 审查日期：2025-11-27

---

## ✅ 发现的优点

### 1. 文档结构清晰

- ✅ 核心协作手册 `CODEX_CLAUDE_COLLAB.md` (110行) - 完整详细
- ✅ 组织架构 `organization-structure.md` (78行) - 角色明确
- ✅ Worktree 指南 `worktree-multi-team.md` (86行) - 操作具体
- ✅ 任务看板 `workstreams.md` (8行) - 简洁明了
- ✅ Snapshot 示例 `2025-11-27-supabase-local-auth.md` (67行) - 结构完整

### 2. 协作规范明确

- ✅ 三行汇报格式（Report/Status/Next）
- ✅ 文档引用规则（不粘贴长文本）
- ✅ PR 流程和模板
- ✅ Git worktree 管理

### 3. 角色定义清楚

- ✅ 老板、HQ、Codex、Claude 的职责
- ✅ 信息流向（谁跟谁说话）
- ✅ 工作组命名规范（G1-G5）

---

## ⚠️ 发现的问题

### 🔴 严重问题

#### 1. **文档重复和混淆**

**问题**：根目录有太多类似的文档

```
CODEX_CLAUDE_COLLAB.md          ← 主协作手册
docs/guides/codex-claude-collaboration.md  ← 旧版？
docs/guides/codex-claude-quickstart.md     ← 快速版？
```

**影响**：

- AI 不知道该看哪个
- 信息不一致时会困惑
- 老板也不确定哪个是最新的

**解决方案**：

```markdown
# 在 CODEX_CLAUDE_COLLAB.md 开头加：

> **注意**：本文档是唯一权威版本。如与其他文档冲突，以本文档为准。
> 相关文档：
>
> - `docs/guides/codex-claude-quickstart.md` - 1 页速查版
> - `docs/guides/organization-structure.md` - 组织架构详解
```

#### 2. **Worktree 指南中的乱码**

**位置**：`docs/guides/worktree-multi-team.md` 第 82-86 行

```markdown
## 10. ????

- HQ ????? `docs/plans/workstreams.md`...
```

**影响**：

- 这段完全不可读
- AI 无法理解这部分内容
- 可能是关键的工作流说明

**解决方案**：重写第 10 节，用正确的中文

#### 3. **GROUP.md 模板问题**

**位置**：`scripts/prep-group.ps1` 生成的 GROUP.md

**当前内容**：

````markdown
## 启动模板

```\n@G1-Codex 请阅读...

```
````

**问题**：

- Markdown 代码块用了 `\n` 转义，显示不正确
- 复制粘贴时会包含多余的反引号

**解决方案**：修复 `scripts/prep-group.ps1` 的字符串处理

### 🟡 中等问题

#### 4. **文档更新不同步**

**现象**：

- `CODEX_CLAUDE_COLLAB.md` 提到 `docs/guides/codex-claude-quickstart.md`
- 但 quickstart 可能是旧版本，没有 HQ 的说明

**影响**：

- 新加入的 HQ 角色，旧文档没更新
- AI 看到矛盾信息会困惑

**解决方案**：

1. 确定哪些文档需要更新
2. 统一提到 HQ 的角色和流程
3. 或者标记旧文档为 deprecated

#### 5. **Snapshot 模板不完整**

**当前状态**：

- `2025-11-27-supabase-local-auth.md` 是个好例子
- 但没有 **空白模板** 给 AI 参考

**影响**：

- Codex 每次写 Snapshot 都要从头想结构
- 格式不统一，老板看着累

**解决方案**：
创建 `docs/decisions/TEMPLATE-snapshot.md`

#### 6. **CAVR 模板缺失**

**当前状态**：

- 文档说要写 CAVR（Context/Actions/Verification/Risks）
- 但没有具体格式示例

**影响**：

- Claude 不知道每个部分该写什么
- 报告质量参差不齐

**解决方案**：
创建 `docs/reports/TEMPLATE-cavr.md`

### 🟢 轻微问题

#### 7. **根目录文档太多**

**现象**：

```
AGENTS.md
CDP_SUCCESS_GUIDE.md
DEPLOYMENT_PROGRESS.md
FINAL_HANDOFF_CHECKLIST.md
HOSTED_SCHEMA_FIXUP.md
MANUAL_MIGRATION_STEPS.md
PLAN.md
PR_*.md (5个)
STAGE2_EXECUTIVE_SUMMARY.md
STRATEGY.md
QUICK_REFERENCE.md
```

**影响**：

- AI 不知道从哪里开始读
- 有些可能是历史遗留（部署相关、Stage2 相关）

**解决方案**：

1. 归档到 `docs/archive/` 或 `docs/history/`
2. 在 README.md 明确列出 "必读文档 Top 5"

#### 8. **workstreams.md 太简单**

**当前内容**（8 行）：

```markdown
| ID | Group | Branch | Scope | Status | Due | Notes |
| WS-G1-LOCAL-AUTH | G1 | ... | Pending kickoff | ... |
| WS-G2-CLI-ENV | G2 | ... | Pending kickoff | ... |
```

**问题**：

- 没有已完成任务的历史
- 没有任务依赖关系
- 没有优先级

**解决方案**：

```markdown
## 进行中

| ID | Status | Progress | Owner | Due |
|... |... |... |... |... |

## 已完成

| ID | Completed | PR | Notes |
|... |... |... |... |

## 待办

| ID | Priority | Dependencies | Notes |
|... |... |... |... |
```

---

## 🎯 AI 理解能力评估

### HQ（Codex 插件）

**能理解的**：

- ✅ 自己是总指挥
- ✅ 需要拆解任务、更新 workstreams.md
- ✅ 审查 PR

**可能困惑的**：

- ⚠️ 如何创建 worktree（脚本在哪？参数是什么？）
- ⚠️ 乱码部分（第 10 节）

**建议**：
在 `CODEX_CLAUDE_COLLAB.md` 加一个 HQ 专属章节：

```markdown
## 12. HQ 特别说明

- 你是 VS Code Codex 插件，运行在总部
- 创建 worktree：`powershell -File scripts/prep-group.ps1 -Name gX -Branch gX/xxx`
- 分配任务时，给老板可复制的 fenced block
```

### Gx-Codex（架构师）

**能理解的**：

- ✅ 自己负责组内设计
- ✅ 需要读 Snapshot、写组内计划
- ✅ 指导 Claude、审查代码

**可能困惑的**：

- ⚠️ Snapshot 格式（没有模板）
- ⚠️ 如何看到其他组的进度（workstreams.md 太简单）

**建议**：
提供清晰的 Snapshot 模板和示例

### Gx-Claude（程序员）

**能理解的**：

- ✅ 自己负责写代码和测试
- ✅ 向本组 Codex 汇报
- ✅ 使用 worktree

**可能困惑的**：

- ⚠️ CAVR 格式不明确
- ⚠️ 如何运行测试（worktree 里 npm 命令怎么用？）

**建议**：
在 `worktree-multi-team.md` 加一个 "Claude 速查" 章节：

````markdown
## Claude 常用命令

```bash
# 当前工作区
pwd  # D:\Projects\qiltrack-ai-gX

# 运行测试（从总部触发）
npm run test --prefix D:\Projects\qiltrack-ai-gX

# 查看状态
git status
git log --oneline -5

# 提交代码
git add .
git commit -m "feat: xxx"
git push origin gX/branch-name
```
````

\```

```

---

## 🔧 立即修复建议（优先级排序）

### 🔥 P0 - 立即修复

1. **修复 worktree-multi-team.md 的乱码**
   - 位置：第 82-86 行
   - 操作：重写第 10 节

2. **修复 GROUP.md 模板**
   - 位置：`scripts/prep-group.ps1` Line 188
   - 操作：修正 Markdown 代码块格式

3. **明确主文档**
   - 位置：`CODEX_CLAUDE_COLLAB.md` 开头
   - 操作：加注释说明这是唯一权威版本

### ⚡ P1 - 尽快添加

4. **创建 Snapshot 模板**
   - 文件：`docs/decisions/TEMPLATE-snapshot.md`
   - 内容：参考 `2025-11-27-supabase-local-auth.md`

5. **创建 CAVR 模板**
   - 文件：`docs/reports/TEMPLATE-cavr.md`
   - 内容：Context/Actions/Verification/Risks 的具体格式

6. **增强 workstreams.md**
   - 文件：`docs/plans/workstreams.md`
   - 内容：加已完成、依赖、优先级

### 📌 P2 - 逐步改进

7. **归档历史文档**
   - 操作：移动 Stage2、部署相关文档到 `docs/archive/`
   - 保留：CODEX_CLAUDE_COLLAB.md, README.md, ENVIRONMENT.md

8. **统一更新旧文档**
   - 操作：在所有 guides/ 里提到 HQ
   - 或者：标记过时文档

9. **README.md 必读清单**
   - 操作：加 "新成员必读 Top 5"
   - 列表：
     1. CODEX_CLAUDE_COLLAB.md
     2. docs/guides/organization-structure.md
     3. docs/guides/BOSS-OPERATION-MANUAL.md
     4. docs/guides/worktree-multi-team.md
     5. docs/plans/workstreams.md

---

## 🧪 测试建议

### 模拟 AI 第一次启动

**场景 1：HQ 第一次启动**
```

模拟输入：我是 HQ，刚加入这个项目，我应该做什么？

测试文档：

- CODEX_CLAUDE_COLLAB.md 是否有 HQ 的职责说明？
- organization-structure.md 是否说明 HQ 的位置？
- 能否找到如何创建 worktree 的命令？

预期输出：

- 理解自己是总指挥
- 知道要维护 workstreams.md
- 知道如何分配任务给各组

```

**场景 2：G1-Codex 收到任务**
```

模拟输入：
@G1-Codex
Report: docs/decisions/2025-11-27-supabase-local-auth.md
Status: 新任务，请创建组内 Snapshot
Next: 阅读文档并制定计划

测试文档：

- 能否打开并理解 Snapshot？
- 知道要创建什么格式的组内计划？
- 知道如何指导 G1-Claude？

预期输出：

- 理解需求
- 写出清晰的组内计划
- 给 G1-Claude 可执行的指令

```

**场景 3：G1-Claude 开始编码**
```

模拟输入：
@G1-Claude
Report: docs/plans/g1-local-auth.md
Status: 请实现 lib/config/supabaseEnv.ts
Next: 编写代码和测试

测试文档：

- 知道自己在哪个目录（worktree）？
- 知道如何运行测试？
- 知道 CAVR 格式？

预期输出：

- 写出代码
- 运行测试
- 提交清晰的 CAVR 报告

```

---

## 📊 总体评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **结构清晰度** | 8/10 | 文档分类清楚，但根目录太乱 |
| **内容完整度** | 7/10 | 缺少模板和示例 |
| **AI 可读性** | 6/10 | 有乱码，格式问题 |
| **一致性** | 6/10 | 新旧文档混杂，信息不同步 |
| **可操作性** | 8/10 | 命令和流程清晰 |
| **维护性** | 7/10 | 需要归档历史文档 |

**综合评分：7.0/10**

**总结**：
- ✅ 基础很好，流程清晰，规范明确
- ⚠️ 需要修复几个关键问题（乱码、模板）
- 🔧 添加模板和示例后，AI 配合会更顺畅

---

## 🎯 修复后的预期效果

### Before（当前）
```

AI: "我不确定 Snapshot 该写什么格式..."
AI: "CAVR 的 Verification 部分要多详细？"
AI: "这段文字是乱码，我跳过了"
AI: "有 3 个协作手册，我该看哪个？"

```

### After（修复后）
```

AI: "参考 TEMPLATE-snapshot.md，我写了结构化的 Snapshot"
AI: "按照 TEMPLATE-cavr.md 的格式，我提供了详细的验证步骤"
AI: "CODEX_CLAUDE_COLLAB.md 是唯一权威文档，我以它为准"
AI: "在 worktree 里运行 npm test --prefix，测试通过"

```

---

## 🚀 下一步行动

**立即执行**（15 分钟）：
1. [ ] 修复 `worktree-multi-team.md` 乱码
2. [ ] 修复 `prep-group.ps1` 的 GROUP.md 模板
3. [ ] 在 `CODEX_CLAUDE_COLLAB.md` 开头加权威声明

**今天完成**（1 小时）：
4. [ ] 创建 `TEMPLATE-snapshot.md`
5. [ ] 创建 `TEMPLATE-cavr.md`
6. [ ] 增强 `workstreams.md`

**本周完成**（2-3 小时）：
7. [ ] 归档历史文档
8. [ ] README.md 添加必读清单
9. [ ] 更新所有 guides/ 提到 HQ

**需要老板决策**：
- [ ] 是否删除旧版协作文档（codex-claude-collaboration.md）？
- [ ] 是否保留 Stage2/部署相关文档？

---

*审查完成：2025-11-27*
*审查人：Claude Sonnet 4.5*
```
