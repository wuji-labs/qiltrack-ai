# 多组并行开发与合并策略 Snapshot（Codex–Claude，2025-11-24）
## 背景 / 问题
- 两组并行（每组含架构师 Codex + 实现 Claude），希望同一分支内协同，又需降低互踩与合并成本。
- Git worktree 对同一分支无法多实例；多目录协作会产生同步负担，需要“一组一分支一工作树”的准则与合并守则。

## 目标
1) 保持主干可发布：主干受保护，所有改动经 PR + CI。
2) 组内高效协同：同一分支同一工作树，多人多终端即可并行。
3) 组间可预期合并：明确 rebase/合并顺序、契约同步、质量闸门。

## 范围 / 不含
- 包含：分支/工作树命名、日常同步、PR 质量门槛、合并顺序、风险控制。
- 不含：具体功能实现细节、生产发布/回滚流程（另见发布策略文档）。

## 分支与工作树策略
- 命名：`g<n>/<topic>`（例：`g1/report-ai`、`g2/report-ai`）。
- 工作树：每组一个 worktree 绑定该分支（同一分支不得多 worktree）。示例：
  ```
  git worktree add ../investor-ai-g1 -b g1/report-ai origin/main
  git worktree add ../investor-ai-g2 -b g2/report-ai origin/main
  ```
- 使用：组内多人共享同一目录，可开多终端/多 VS Code 窗口；禁在同一分支上再新增第二个 worktree。

## 协作与同步流
1) 启动：Codex 发布 Snapshot；Claude 产出 Implementation Checklist。
2) 日常同步：每日在组内分支执行 `git fetch origin` + `git rebase origin/main`；冲突及时解决并更新 mock/类型。
3) 契约先行：公共类型与接口先落 `types/` + `lib/services/api` + mock，前后端据此并行。
4) 提交：小步提交，保持 clean working tree。

## 合并策略
- 主干保护：开启 required checks（lint/test/build）+ PR 审核。
- 合并顺序：谁先 ready 谁先合到 main；另一组立刻 `git fetch` + `git rebase origin/main`，再继续开发。
- 集成演练：如两组耦合紧，可先在临时分支 `integration/<topic>` 汇合验证，再 squash 合入 main，避免双向冲突。
- 合并方式：推荐 squash merge，减少历史噪音；如需保留分段记录，用 rebase-merge 但确保线性历史。

## 质量门槛与测试
- 必跑：`npm run lint`、`npm run test`。触及 API 契约需补 Vitest + MSW mock。
- 文档同步：契约/配置变更同时更新 `.env.local.example`、`README` 相关段落、`docs/reports`（验证记录）或 `docs/decisions`（设计变更）。
- PR 模板：填写 CAVR、验证命令输出摘要、手动验证步骤（含截图或描述）。

## 风险与对策
- 契约漂移：变更类型或接口必须同步 mock + 文档；PR 中标注 breaking surface。
- 半成品泄漏：使用 feature flag/开关，避免未完成功能默认开启。
- 冲突堆积：严格每日 rebase；冲突多时优先拆小 PR。
- 分支污染：禁止直接推 main；所有更改经 PR + review。

## 快速执行清单
- [ ] 为每组创建分支 + worktree：`git worktree add ../investor-ai-g{n} -b g{n}/<topic> origin/main`
- [ ] 每日 rebase main，保持分支新鲜
- [ ] 提前落公共契约与 mock，再动 UI/逻辑
- [ ] 提 PR 前：`git status` 干净 → `npm run lint` → `npm run test` → 更新文档 → 填 PR 模板
- [ ] 合并顺序：先 ready 先合，另一组即刻 rebase 跟进
