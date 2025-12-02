# 组织架构与沟通指引

本指南描述老板 → HQ（VS Code Codex 插件）→ 各工作组 Codex/Claude 的角色、命名与信息流，确保多团队并行时保持单一事实源。

## 1. 角色与命名

| 角色                | 代号                      | 职责                                                           |
| ------------------- | ------------------------- | -------------------------------------------------------------- |
| 老板                | `老板`                    | 提出需求、审批结果，仅与 HQ 沟通                               |
| HQ（VS Code Codex） | `HQ`                      | 发布任务、维护 Snapshot/Plan/Report、协调资源、审查 PR         |
| 工作组 Codex        | `G1-Codex` … `G5-Codex`   | 接收 HQ 任务，撰写组内 Snapshot/实施清单，回答组内 Claude 问题 |
| 工作组 Claude       | `G1-Claude` … `G5-Claude` | 负责编码和验证，只向本组 Codex 汇报                            |

### 分支与目录

- 分支命名：`g1/feature-reporting`、`g2/fix-auth` 等，和 worktree `D:\Projects\investor-ai-g1` 对应。
- 组内文档约定：`docs/decisions/<date>-g1-*.md`、`docs/plans/g1-*.md`、`docs/reports/<date>-g1-*-cavr.md`。

## 2. Boot Sequence（启动指令）

- **老板 → HQ**
  ```
  @HQ 请阅读 CODEX_CLAUDE_COLLAB.md，打开 docs/plans/workstreams.md 等待分派任务
  ```
- **HQ → 各组默认指令模板**（示例 G1，其余替换编号）

```
@G1-Codex 请阅读 CODEX_CLAUDE_COLLAB.md 与 docs/guides/organization-structure.md，
查阅 docs/plans/workstreams.md，等待 HQ 的任务
@G1-Claude 请阅读 CODEX_CLAUDE_COLLAB.md，等待 G1-Codex 的 Snapshot 与实施指令
```

> Claude 不直接接受 HQ 指令，必须通过所属组 Codex。

每个工作组的 worktree 根目录会自动生成 `GROUP.md`（由 `scripts/prep-group.ps1` 写入），其中记录组别、分支、以及上述两条启动模板，方便成员随时确认“自己是哪一组”与如何汇报。

## 3. 信息流

1. **HQ 发布任务**
   - 写全局 Snapshot（`docs/decisions/<date>-<topic>.md`）。
   - 更新 `docs/plans/workstreams.md`（分支、负责人、目标、截止时间）。
   - 在终端通知指定组 Codex：
     ```
     @G1-Codex
     Report: docs/plans/workstreams.md
     Status: 新任务 <topic>，请创建组内 Snapshot
     Next: 运行 scripts/prep-group.ps1 建立工作区并反馈计划
     ```

2. **工作组执行**
   - `Gx-Codex` 创建组内 Snapshot/计划表，指派 `Gx-Claude` 实施。
   - `Gx-Claude` 只向本组 Codex 汇报（CAVR、lint/test）。

3. **状态更新**
   - `Gx-Codex` 在关键节点向 HQ 汇报：
     ```
     @HQ
     Report: docs/reports/2025-12-01-g1-supabase-cavr.md
     Status: 实施 70%，等待 API 密钥
     Next: 请协调 Finnhub Key
     ```
   - HQ 根据反馈更新 `docs/plans/workstreams.md` 的 Status / Notes。

4. **完成/交付**
   - PR 合并后，`Gx-Codex` 标记 Workstream 为 Done，并 @HQ 告知收尾。
   - HQ 负责在 `docs/reports/`、`docs/plans/` 记录结论并释放对应 worktree。

## 4. 同步节奏

| 频次          | 内容                                       | 参与者                        |
| ------------- | ------------------------------------------ | ----------------------------- |
| 每日          | 更新 `docs/plans/workstreams.md` 状态      | HQ（信息来源：各组 Codex）    |
| PR / 阻塞     | `@Codex` 三行模板 + 文档链接               | 组内 Claude → 组内 Codex → HQ |
| 需求变更 >20% | mini design review，记录 `docs/decisions/` | HQ + 相关组                   |

## 5. 协作文档

- `docs/plans/workstreams.md`：唯一任务看板（HQ 维护，所有组必读）。
- `docs/guides/worktree-multi-team.md`：工作树/依赖流程。
- `CODEX_CLAUDE_COLLAB.md`：沟通模板与 Snapshot/CAVR 规范。

保持这些文档同步，即可确保全员清楚“谁负责、信息如何流动、下一步做什么”。\*\*\*
