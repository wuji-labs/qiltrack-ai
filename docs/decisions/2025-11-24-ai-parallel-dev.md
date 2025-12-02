# Investor AI 并行开发协作 Snapshot（Codex–Claude）- 2025-11-24

## 背景 / 问题

- 现阶段前后端均在单分支推进，需求切片（API、UI、文档/测试）耦合，导致等待合并/测试排队；需要形成可复用的并行协作规范。
- 项目栈为 Next.js App Router + Tailwind v4 + Finnhub/OpenRouter，测试用 Vitest；已有 Codex/Claude 角色分工文档，但缺少面向具体任务的切片/分支/契约指引。

## 目标

1. 让 Codex（架构/评审）与 Claude（实现）可在同一需求上并行：先产出 Snapshot + 契约，Claude 基于契约实现，Codex 评审架构与测试覆盖。
2. 前后端解耦：API 契约与 mock 先行，前端可用 `lib/services/api` + 假数据推进交互，后端可独立完善真实调用。
3. 每个 PR 可独立验证：必须附 `npm run lint` / `npm run test` 结果，文档同步（README/env 示例/PLAN 或 reports）。

## 范围 / 不含

- 包含：分支策略、切片方式、交付物形态、测试/文档同步要求。
- 不含：具体功能实现细节、支付/权限策略设计（另立 Snapshot），生产发布流程。

## 角色与分工

- Codex：发布 Snapshot、定义 API/类型/文案 key、审查架构一致性与测试覆盖，合并前 review。
- Claude：拆 Implementation Checklist，按契约实现；提交 PR 时提供 CAVR 与 lint/test 结果；必要时触发 mini design review。

## 推荐切片（可并行）

- API/Service：`app/api/*`、`lib/services/api`、`types/*`。先出类型/响应示例 + MSW mock，前端即插即用。
- UI/交互：`app/sections/*`、`app/components/*`、hooks。使用 mock service，专注布局、状态机、可访问性。
- 文档/测试：`docs/decisions/*`、`docs/reports/*`、`PLAN.md` 更新，Vitest 覆盖 service/hook/route handler。

## 分支与协作流程

1. Codex 在需求启动时发布 Snapshot（本文件），确认范围/约束/测试要求。
2. Claude 产出 Implementation Checklist（子任务/依赖/mock/测试），标记可并行项。
3. 分支策略：Claude 必须使用 feature 分支并提 PR，禁推 main；Codex 审阅后合并。
4. 契约优先：新增/改动接口先定义类型与伪响应，落 `types/` + `lib/services/api` stub + MSW mock；前端基于 mock 开发。
5. 交付要求：PR 描述附 CAVR、`npm run lint` / `npm run test` 输出摘要、手动验证步骤；若新增 env，更新 `.env.local.example` 与 README。

## 技术约束

- Next.js App Router（Node runtime），React 19，TypeScript；Tailwind v4 `@theme inline`。
- 测试：Vitest + Testing Library；现有用例覆盖 `lib/services/api`、`useProgress`。
- 模型/行情：OpenRouter + Finnhub，敏感词重写逻辑保留；不可将 service role key 暴露客户端。

## 文案 key（并行时需保持一致）

- 价值主张：“三分钟理解美股上市公司”“仅首份报告免费，订阅解锁更多”。
- 风险提示：“非投资建议，输出已做敏感词重写”。

## 测试与验收

- 必跑：`npm run lint`、`npm run test`。若触及 API/鉴权，需补 Vitest 契约测试或 MSW mock 集成测试。
- 手动：按照 README 手动脚本验证 NVDA 报告生成、复制、DOCX 导出、错误态提示。
- 交付：PR / docs 路径需在终端 Report 行引用；不得在终端贴完整 CAVR。

## 近期并行示例（建议）

- 后端：补 `/api/report` 契约 + MSW mock，增加 quota/history stub，前端可先接入。
- 前端：加强 Report Generator 进度/错误体验，接入 mock quota；补 why/templates 交互与可访问性。
- 文档/测试：补 `.env.local.example` 校验、service/hook 单测、并行协作 FAQ（可放 docs/guides）。

## 风险与对策

- 契约漂移：先定类型与 mock，变更需更新 `types/` 与 stub，并在 PR 说明。
- 测试缺口：未跑 lint/test 拒绝合并；新增逻辑需最小单测覆盖。
- 分支污染：强制 feature 分支 + PR；不允许直接推 main。
