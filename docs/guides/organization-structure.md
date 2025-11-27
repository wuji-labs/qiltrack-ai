# 组织架构与沟通指引

本指南描述 HQ（老板）、各工作组 Codex/Claude 的角色、命名方式以及信息流向，确保多人并行时保持单一事实源。

## 1. 角色与命名

| 角色 | 代号 | 主要职责 |
|------|------|----------|
| HQ（老板 + 插件 Codex） | `HQ` | 发布任务、维护 Snapshot/Plan/Report、协调资源、审批 PR |
| HQ Claude | `@Claude`（HQ 内部） | 执行老板指令：分配任务给各组 Codex、跟踪状态、回传 HQ |
| 工作组 Codex | `G1-Codex` … `G5-Codex` | 接收 HQ 任务，细化设计、拆解步骤、回答本组 Claude 问题 |
| 工作组 Claude | `G1-Claude` … `G5-Claude` | 编码 + 验证，按 Snapshot/CAVR 报告进展 |

### 分支与目录命名
- 分支：`g1/feature-reporting`、`g2/fix-auth`，与 worktree `D:\Projects\investor-ai-g1` 一一对应。
- 文档：组内 Snapshot 存于 `docs/decisions/<date>-g1-<topic>.md`，实施清单 `docs/plans/g1-<topic>.md`，报告 `docs/reports/<date>-g1-<topic>-cavr.md`。

## 2. 信息流

1. **HQ 发布任务**
   - 写 Architecture Snapshot（`docs/decisions/<date>-<topic>.md`）。
   - 在 `docs/plans/workstreams.md` 添加条目（分支/负责人/目标/截止时间）。
   - 在终端对 HQ Claude 发送指令：
     ```
     @Claude
     Report: docs/plans/workstreams.md
     Status: 新增任务 <topic> 等待分派
     Next: 通知 G1-Codex 执行并回报计划
     ```

2. **工作组接收**
   - HQ Claude 私信或在共享频道通知 `Gx-Codex`，附 Snapshot/Branch。
   - `Gx-Codex` 创建组内 Snapshot + 实施清单，将任务加入本组工作区，必要时运行 `scripts/prep-group.ps1`。
   - `Gx-Claude` 根据清单实施，定期向本组 Codex 报告。

3. **状态更新**
   - 组内完成阶段性里程碑时，由 `Gx-Codex` 向 HQ Claude 汇报：
     ```
     @Codex
     Report: docs/reports/2025-12-01-g1-supabase-cavr.md
     Status: 实施 70%，等待 API 密钥
     Next: HQ 协调 Finnhub Key 并回复
     ```
   - HQ Claude 更新 `docs/plans/workstreams.md` 的 Status/Notes。

4. **完成/交付**
   - PR 合并后，`Gx-Codex` 标记 Workstream 为 Done，并 @HQ 提醒归档。
   - HQ 负责在 `docs/reports/`、`docs/plans/` 中记录收尾信息，释放 worktree。

## 3. 同步节奏

| 频次 | 内容 | 参与者 |
|------|------|--------|
| 每日 | Workstreams 状态更新 | HQ Claude（来源：各组 Codex 报告） |
| 关键节点（提交/阻塞） | `@Codex` 三行格式 + 文档链接 | 组内 Claude → 组内 Codex → HQ |
| 需求变更 >20% | 触发 mini design review，记录 `docs/decisions/` | HQ + 相关组 |

## 4. 协作文档
- `docs/plans/workstreams.md`：唯一任务看板（HQ 维护，所有组必读）。
- `docs/guides/worktree-multi-team.md`：工作树、依赖、环境流程。
- `CODEX_CLAUDE_COLLAB.md`：核心沟通规范（`@Codex`/`@Claude` 三行格式）。

保持这些文档同步，即可确保 HQ 与各工作组在任何时间都明确“谁负责什么、下一步该做什么”。***
