# Investor AI – YC 高杠杆工作流（只做 1+1>2 的事）

结合 YC 氛围编程指南与项目实际，我们挑出 5 条最能立竿见影的打法。每条都配套落地步骤，便于 Codex/Claude 即刻执行。

---

## 1. Plan ↔ Snapshot 双轨

**为什么高杠杆**：先写计划再执行，可同步 Codex/Claude 心智，减少来回解释。

- 任务启动 → 在 `docs/plans/<date>-<topic>.md` 用模板写出目标/步骤/Ideas Parking Lot。
- Claude 开工前必须勾选“已阅读 Snapshot+Plan”，实现完一段就在 Plan 中 `[x]` 标记并 git commit。
- Codex 审查时只需看 Plan + CAVR，就能追踪进度，会议/对话更聚焦。

> TODO：补一个 Plan 模板，或在现有 PLAN.md 上加“Progress / Ideas later”区。

---

## 2. 失败即 reset、成功即 clean commit

**为什么高杠杆**：AI 走偏时堆叠 patch 会让问题恶化，reset 能立刻止损。

- 约定：只要 Claude 表示“尝试失败”或本地 lint/test 未通过，就执行 `git reset --hard HEAD` + `npm install` 还原，再按新思路 clean 实现。
- 每个可运行片段单独 commit，并在 commit message 写明 “feat/fix/chore + 篇幅”；失败的 commit 不要保留。
- Codex 审查发现连环 patch 时要求对方 reset 重做，保持历史干净。

---

## 3. 自动化验证脚本（Inspector / E2E）

**为什么高杠杆**：快速确认工具/流程健康，避免人工巡检。

- 为关键依赖写脚本：
  - `scripts/check-context7.ps1` → `npx @modelcontextprotocol/inspector …`
  - 可选：`scripts/e2e-report.ps1` 模拟"搜索 → 生成报告 → 导出"
- 任何涉及上述依赖的任务，提交前都必须运行脚本并把输出粘到 CAVR。

---

## 4. 指令文件约束 AI

**为什么高杠杆**：把规则写进 tools，让 AI 默认遵守，减少你重复提醒。

- 在 `cursor.rules`、`claude.md` 写入：
  1. “先读 Snapshot & Plan，再行动”
  2. “实现完每段输出 CAVR，并运行 lint/test/脚本”
  3. “失败一次就 reset 重来”
- 若工具支持 Rules/Prompt 注入（Cursor/Windsurf），把上述文本粘进去；Claude CLI 则编辑 `claude.md`。
- 每次改规范，只需更新指令文件并在 PR 描述提醒即可。

---

## 5. 模型分工 + 快速切换

**为什么高杠杆**：不同模型擅长不同任务，分工能显著提升成功率。

- 约定：
  - Cursor（或 GPT-4.1）→ 前端/快速实现
  - Claude Code → 架构/文档/长链推理
  - Windsurf 或其他模型 → 复杂 Refactor/深思考
- AI 卡住时，立即记录尝试、切换模型再试，并在 CAVR 中写明“切换原因 + 新模型结果”。
- 如果两个模型都失败，Codex 介入重新审视方案，避免时间浪费。

---

## 使用方式

1. 将本文件引用到 `CODEX_CLAUDE_COLLAB.md` 的“共同原则”部分。
2. 在日常沟通中直接提及编号（如“执行高杠杆 #2”），形成团队共识。
3. 每次 Retrospective 检视哪条落得最好/最差，并更新本文件。

这样我们只抓最能放大产出的做法，不做“堆叠说明书”，真正让 1+1 > 2。\*\*\*
