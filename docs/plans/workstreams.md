# Workstreams（任务看板）

> **更新时间**：2025-12-10
> **维护者**：HQ
> **说明**：本文档是所有工作组的唯一任务看板，记录当前进行中、已完成和待启动的任务

---

## 🚧 进行中

| ID         | Group | Branch                              | Scope                        | Progress | Owner     | Due        | Notes                            |
| ---------- | ----- | ----------------------------------- | ---------------------------- | -------- | --------- | ---------- | -------------------------------- |
| WS-AUTH-01 | HQ    | -                                   | 登录系统 Bug 修复 (已完成分析) | 100%     | HQ        | 2025-12-10 | seed.sql 已修复，已分派给 G1     |
| WS-AUTH-02 | G1    | g1/auth-redirect-url-fix            | Redirect URL 配置修复        | 0%       | G1-Claude | 2025-12-11 | P0 紧急，阻塞生产回调            |
| WS-AUTH-03 | G1    | g1/auth-password-recovery-fallback  | 密码恢复 fallback            | 0%       | G1-Claude | 2025-12-11 | P1 重要                          |
| WS-AUTH-04 | G1    | g1/auth-error-handling-refactor     | 错误处理 + 密码校验统一      | 0%       | G1-Claude | 2025-12-12 | P2 体验优化                      |
| WS-AUTH-05 | G1    | g1/auth-long-term-improvements      | Cookie 监控 + OAuth 提示     | 0%       | G1-Claude | 2025-12-12 | P3 长期改进                      |

---

## ✅ 已完成

| ID                 | Group | Completed  | PR                                                      | Summary                      | Notes                  |
| ------------------ | ----- | ---------- | ------------------------------------------------------- | ---------------------------- | ---------------------- |
| （示例）WS-EXAMPLE | G0    | 2025-11-26 | [#36](https://github.com/explore0012/ai-report/pull/36) | 修复 PowerShell Git 参数冲突 | 稳定 worktree 创建流程 |

---

## 📋 待启动

| ID              | Priority | Dependencies | Scope                                               | Estimated | Notes                                          |
| --------------- | -------- | ------------ | --------------------------------------------------- | --------- | ---------------------------------------------- |
| WS-AUTH-02      | P0       | WS-AUTH-01   | 修复 Redirect URL 配置 (AUTH-01)                    | 0.5 天    | 阻塞生产环境登录回调                           |
| WS-AUTH-03      | P1       | WS-AUTH-01   | 密码恢复 fallback (AUTH-03)                         | 0.5 天    | JS 禁用时密码重置失败                          |
| WS-AUTH-04      | P2       | WS-AUTH-01   | 错误处理重构 (AUTH-04) + 密码校验统一 (AUTH-05)     | 2 天      | 提升用户体验                                   |
| WS-AUTH-05      | P3       | WS-AUTH-01   | Cookie 监控 (AUTH-02) + OAuth 提示 (AUTH-06) + RPC | 1 天      | 长期改进                                       |
| （示例）WS-FUTURE-1 | P1       | 无           | 实现 XXX 功能                                       | 2 天      | 等待设计稿                                     |

**优先级说明**：

- P0 = 紧急且重要（阻塞其他任务）
- P1 = 重要（本周必须完成）
- P2 = 正常（本月计划内）
- P3 = 低优先级（有空再做）

---

## 🔄 任务流程

### 新任务启动

1. HQ 收到老板需求
2. HQ 创建 Snapshot：`docs/decisions/<date>-<topic>.md`
3. HQ 在本看板添加任务条目（状态：进行中）
4. HQ 通知相关组 Codex（附 Snapshot 路径）

### 任务进行中

1. 各组 Codex 创建组内计划：`docs/plans/gX-<topic>.md`
2. 各组 Claude 实施并输出 CAVR：`docs/reports/<date>-gX-<topic>-cavr.md`
3. 各组 Codex 向 HQ 汇报进度（更新 Progress 列）
4. HQ 协调多组之间的依赖

### 任务完成

1. 各组 Codex 审查通过后提交 PR
2. HQ 最终审查 PR
3. HQ 合并 PR 后，将任务移到"已完成"区块
4. HQ 通知老板并更新相关文档

---

## 📊 统计信息

**本周概况**（2025-12-09 ~ 2025-12-15）：

- 进行中：1 个任务 (WS-AUTH-01 已完成分析)
- 待启动：4 个任务 (登录系统架构改进)
- 已完成：1 个任务
- 平均完成时间：1 天 / 任务

**各组工作量**：

- HQ：完成登录 Bug 分析，待分派改进任务
- G1-G5：空闲，等待任务分配

---

## 🔗 相关文档

- **协作手册**：`CODEX_CLAUDE_COLLAB.md`
- **组织架构**：`docs/guides/organization-structure.md`
- **老板手册**：`docs/guides/BOSS-OPERATION-MANUAL.md`
- **Worktree 指南**：`docs/guides/worktree-multi-team.md`

---

## 📝 使用说明

### 对于 HQ

- 每次分配新任务时，在"进行中"添加一行
- 每天更新各任务的 Progress（根据各组汇报）
- 任务完成后，移动到"已完成"，填写 PR 链接和总结
- 每周初审查"待启动"，根据优先级启动新任务

### 对于各组 Codex

- 每天向 HQ 汇报进度（Progress 百分比）
- 发现问题或需要协调时，在 Notes 列添加说明
- 任务完成提 PR 后，通知 HQ 更新状态

### 对于老板

- 查看本看板了解所有任务状态
- 有新需求时，告诉 HQ，由 HQ 添加到看板

---

> **所有组在启动前需**：① 阅读 `CODEX_CLAUDE_COLLAB.md` / `docs/guides/organization-structure.md`；② 复制本看板条目至组内 PLAN；③ 输出组内 Snapshot + Checklist；④ 仅在 feature 分支上提交 PR。
