# YC 氛围编程优化方案（针对 investor-ai）

结合 YC 氛围编程指南与当前仓库现状，以下方案用于指导 Codex / Claude 的协作与执行。可作为 `CODEX_CLAUDE_COLLAB.md` 的补充，在每次任务启动前引用。

---

## 1. 规划流程（Planning）

1. **Plan.md 模板**（或 `docs/plans/<task>.md`）：
   - `Goal / Scope / Non-goals`
   - `Implementation steps`（逐条勾选）
   - `Ideas parking lot`（存放后续想法）
2. **与 AI 共写计划**：在编码前让 Cursor/Claude 先生成 Markdown 计划，再一起删减/标注 “Won’t do”。
3. **逐段实现**：按 Section 执行——完成一个 Section → 运行 lint/test → Git commit → 更新计划。
4. **CAVR 日志**：所有状态更新写进 `docs/reports/<date>-<topic>.md` 或 PR 描述，保持上下文清晰。

> 行动项：建立 `docs/plans/TEMPLATE.md`，用于快速复制；要求每个新任务都从干净分支 + 计划文件开始。

---

## 2. 版本控制策略（Version Control）

1. **feature 分支 + 干净起步**：`git checkout -b feat/<topic>`，保证工作树无脏文件再开始。
2. **失败即 reset**：若 AI 跑偏，执行 `git reset --hard HEAD`，避免坏代码层层堆叠。
3. **分块 commit**：每完成一个可运行子任务就 `git add/commit`，信息格式 `feat/fix/chore: ...`。
4. **Plan ↔ Git 同步**：计划文件中的勾选状态与 Git 提交保持一致，避免“计划已完成但代码未提交”的情况。

---

## 3. 测试优先（Testing Framework）

1. **必跑脚本**：`npm run lint` + `npm test`；若有 UI/流程改动，补充 `test-api.js` 或临时脚本模拟用户路径。
2. **高层级验证**：每次功能上线前模拟真实流程（如生成报告、操作 MCP），并把步骤写入 `docs/reports/...`。
3. **新增测试建议**：
   - 编写简单的 E2E/集成测试脚本（可放入 `scripts/`）模拟“搜索→生成报告→导出”。
   - 引导 AI 先写测试断言，再实现功能，形成明确边界。
4. **测试守卫**：未通过测试不得继续下一任务，CAVR 中必须清楚记录“测试完成 + 结果”。

---

## 4. Bug 修复流程（Effective Fixes）

1. **报错即贴**：将完整错误栈贴给 AI，先让其列出可能原因（不少于 3 个）。
2. **一次尝试一次 reset**：若第一次修复失败立即 reset，重新思考；杜绝“反复 patch 导致代码混乱”。
3. **诊断日志**：必要时在日志点（API 返回、hook 状态）插入 console/log，再交给 AI 分析。
4. **换模型**：若 Cursor/Claude 卡住，尝试 Windsurf/其他模型，或在 CLI 中切换不同 LLM。

---

## 5. AI 工具优化（Tooling）

1. **指令文件**：在 `cursor.rules` / `claude.md` 中写入：
   - 先读 Snapshot / 计划
   - 每个阶段输出 CAVR
   - 遵守 Windows-native/Context7 等项目规范
2. **本地文档**：将 Finnhub、OpenRouter、Context7 README 等放入 `docs/reference/`，AI 可直接查阅。
3. **多工具协同**：前端改动优先用 Cursor，复杂架构/文档交给 Claude；如需更长链推理，可用 Windsurf。
4. **方案对比**：遇到关键设计让 AI 给出 ≥2 个实现方案，再取其优。

---

## 6. 复杂功能策略（Complex Features）

1. **独立原型**：大型功能（如支付、报表模板系统）先在 `playground/` 或独立仓库快速 POC，再迁回主仓。
2. **参考实现**：在计划中附上类似功能的链接/示例，让 AI 照着已有成功案例实现。
3. **明确边界**：外部 API（如 `/api/report`）保持稳定，仅在内部组件/服务层做重构。
4. **模块化**：继续利用 `app/sections`、`hooks/`、`lib/services/` 分层，避免单文件过千行。

---

## 7. 技术栈实践（Tech Stack）

1. **拥抱成熟框架**：保持 Next.js + React + Tailwind + Prisma 的组合，遵循官方最佳实践。
2. **文件粒度**：控制在 <300 行；若超出，拆分为 hooks、子组件或服务。
3. **DevOps 自动化**：考虑用 AI 帮助生成脚本（如部署、DNS、MCP 调试），减轻重复劳动。
4. **设计 & 内容**：善用 AI 生成 favicon、截图脚本、文档/营销草稿，减少手工工作。

---

## 8. 持续改进（Continuous Improvement）

1. **定期重构**：当核心流程有测试护航时，安排重构窗口；让 AI 罗列可优化的模块。
2. **追踪模型更新**：每当 Cursor/Claude/Windsurf 发布新模型，选择小任务尝试其效果，记录最佳使用场景。
3. **知识沉淀**：所有经验写入 `docs/guides/`，在 CODEX_CLAUDE_COLLAB 中引用，保证新成员快速同步。

---

## 执行建议（Next Steps）

1. **在 CODEX_CLAUDE_COLLAB 中新增引用**：提醒每次任务前先阅读本指南。
2. **落地模板**：创建 `docs/plans/TEMPLATE.md`、`cursor.rules`、`claude.md`（若尚未存在），填入关键约束。
3. **定期回顾**：每次大任务完成后，用 10 分钟回顾哪些环节符合 YC 流程、哪些需调整，并在此文档更新记录。

> 该文档应与 Snapshot / CAVR 配合使用：Snapshot 定义每个任务的目标与约束，YC 指南保证执行方式高效、可回溯。
