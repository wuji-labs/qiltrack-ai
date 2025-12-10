# Workstreams（任务看板）

> **更新时间**：2025-12-10
> **维护者**：老板 + 各组 Codex
> **说明**：本文档是所有工作组的唯一任务看板，记录当前进行中、已完成和待启动的任务

---

## 🚧 进行中

| ID            | Group | Branch      | Scope                  | Progress | Owner     | Due        | Notes                                               |
| ------------- | ----- | ----------- | ---------------------- | -------- | --------- | ---------- | --------------------------------------------------- |
| WS-2025-12-10 | G1    | g1/develop  | 邀请奖励系统 Bug 修复  | 5%       | G1-Claude | 2025-12-11 | P0 紧急，Cookie 传递 + Stripe webhook 奖励缺失问题 |

---

## ✅ 已完成

| ID                 | Group | Completed  | PR                                                      | Summary                      | Notes                  |
| ------------------ | ----- | ---------- | ------------------------------------------------------- | ---------------------------- | ---------------------- |
| （示例）WS-EXAMPLE | G0    | 2025-11-26 | [#36](https://github.com/explore0012/ai-report/pull/36) | 修复 PowerShell Git 参数冲突 | 稳定 worktree 创建流程 |

---

## 📋 待启动

| ID                  | Priority | Dependencies | Scope         | Estimated | Notes      |
| ------------------- | -------- | ------------ | ------------- | --------- | ---------- |
| （示例）WS-FUTURE-1 | P1       | 无           | 实现 XXX 功能 | 2 天      | 等待设计稿 |

**优先级说明**：

- P0 = 紧急且重要（阻塞其他任务）
- P1 = 重要（本周必须完成）
- P2 = 正常（本月计划内）
- P3 = 低优先级（有空再做）

---

## 🔄 任务流程

### 新任务启动

1. 老板直接向目标组 Codex 发布需求
2. 该组 Codex 创建 Architecture Snapshot：`docs/decisions/<date>-<topic>.md`
3. 该组 Codex 在本看板添加任务条目（状态：进行中）
4. 该组 Codex 向组内 Claude 发布 Snapshot

### 任务进行中

1. 组内 Codex 创建组内计划：`docs/plans/gX-<topic>.md`（可选）
2. 组内 Claude 实施并输出 CAVR：`docs/reports/<date>-gX-<topic>-cavr.md`
3. 组内 Claude 向组内 Codex 汇报进度
4. 老板自己协调多组之间的依赖

### 任务完成

1. 组内 Codex 审查通过后提交 PR
2. 组内 Codex 向老板汇报完成状态
3. 老板审查并合并 PR 后，将任务移到"已完成"区块
4. 该组 Codex 更新相关文档

---

## 📊 统计信息

**本周概况**（2025-12-08 ~ 2025-12-14）：

- 进行中：1 个任务
- 已完成：1 个任务
- 平均完成时间：1.5 天 / 任务

**各组工作量**：

- G1：1 个任务（进行中，P0 紧急）
- G2-G5：空闲

---

## 🔗 相关文档

- **协作手册**：`CODEX_CLAUDE_COLLAB.md`
- **组织架构**：`docs/guides/organization-structure.md`
- **老板手册**：`docs/guides/BOSS-OPERATION-MANUAL.md`
- **Worktree 指南**：`docs/guides/worktree-multi-team.md`

---

## 📝 使用说明

### 对于老板

- 查看本看板了解所有任务状态
- 有新需求时，直接向目标组 Codex 发布任务（使用三行模板）
- 审查各组提交的 PR
- 自己协调多组之间的依赖关系

### 对于各组 Codex

- 收到老板任务后，创建 Architecture Snapshot
- 在本看板"进行中"添加任务条目
- 每天更新任务 Progress（根据组内 Claude 汇报）
- 发现问题或需要协调时，在 Notes 列添加说明
- 任务完成提 PR 后，向老板汇报完成状态

### 对于各组 Claude

- 按组内 Codex 的 Snapshot 实施
- 定期向组内 Codex 汇报进度
- 输出 CAVR 报告到 `docs/reports/`

---

> **所有组在启动前需**：① 阅读 `CODEX_CLAUDE_COLLAB.md` / `docs/guides/organization-structure.md`；② 复制本看板条目至组内 PLAN；③ 输出组内 Snapshot + Checklist；④ 仅在 feature 分支上提交 PR。
