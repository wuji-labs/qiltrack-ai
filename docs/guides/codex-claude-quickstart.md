# Codex–Claude 快速作战指南

> 详尽条款见 `CODEX_CLAUDE_COLLAB.md`，发生冲突以该条款为准。

## 核心循环
1. **Codex**：阅读最新需求 → 产出 Architecture Snapshot（背景 / 目标 / 约束 / 验收）→ 存到 `docs/decisions/<date>-<topic>.md` → 末尾附 `@Claude` fenced block（Report/Status/Next）并要求走 feature 分支 + PR。
2. **Claude**：阅读 Snapshot → 列 `Implementation Checklist`（依赖 / 子任务 / 验证）→ 进 feature 分支开发 → 以 CAVR 记录每段实现细节，全部写进 PR/文档。
3. **验证**：每次提交前跑 `npm run lint`、`npm test`，把输出摘要写进文档；未跑需说明原因。
4. **终端沟通**：Claude 状态更新必须贴：
   ```
   @Codex
   Report: <docs or PR path>
   Status: <进度一句话>
   Next: <需要 Codex 执行的动作>
   ```
   需要审批或有阻塞时再追加 `Approval:` / `Blockers:`；禁止复制 CAVR/日志。
5. **Codex 回复**：也用 fenced block `@Claude ...` 告知审阅结论，并派发下一步指令（继续开发、补测试、进入 Stage 2 等）。

## 必备交付
- **Snapshot**（Codex）：接口/组件、技术约束、测试矩阵、范围拆解。
- **Implementation Checklist**（Claude）：任务拆分、依赖、测试计划。
- **CAVR 文档**（Claude）：沉淀到 `docs/reports/<date>-<topic>.md` 或 PR 描述，含 lint/test 结果；GitHub PR 强制使用 `.github/pull_request_template.md` 填写 CAVR + 三行简讯。
- **终端简讯**：任何进度同步必须引用文档路径 + 下一步指令。
- **知识同步**：涉及 env / README / PLAN / 设计决策时同步更新相应文件。

## 快速检查表
- [ ] GitHub CLI 已登录（默认 explore0012/SSH，异常先跑 `gh auth status`；PR 直接 `git checkout -b <feature>` → `git push origin <feature>` → `gh pr create --fill`）。
- [ ] 是否已阅读最新 Snapshot 并确认依赖？
- [ ] 是否在 feature 分支？禁止直推 `main`。
- [ ] 是否已有对标文档记录 CAVR + lint/test？
- [ ] 终端是否只贴 3 行简讯且写明下一步责任？
- [ ] Codex 是否已给出下一步 Snapshot/Review 指令？

## 常见错误
- 终端贴长段落、截图或日志 → 直接判定未按流程交付。
- 未附 lint/test 结果 → 视为验证缺失。
- Claude 没写 Next 或要求不明确 → Codex 无法继续派工。
- Codex 回复里没有具体指令 → Claude 不知道下一步，循环中断。

保持该速查在旁可显著减少往返，其余细节随时参考 `CODEX_CLAUDE_COLLAB.md`。
