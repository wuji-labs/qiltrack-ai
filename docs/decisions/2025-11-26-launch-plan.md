# Architecture Snapshot — Launch Readiness (2025-11-26)

## 背景

- 当前状态：Stage 2 Supabase 报告链路完成且测试/文档齐备；Hosted 部署分支 `feat/supabase-deployment` 代码已就绪，唯一缺口是 Codex 创建存储桶与合并 PR。UI 已有 Hero/生成器/定价/FAQ，NextAuth + 配额校验已接入 Supabase，Stripe 订阅逻辑尚留占位。
- 目标：在 48–72 小时内完成 Hosted 上线、合并主线，并输出可对外演示的闭环体验（登录→首份报告→额度提示→导出/分享）。

## 设计目标

1. **生产可用**：Hosted Supabase + RLS + 私有存储桶落地，主分支可随时部署。
2. **额度闭环**：登录态读取真实配额，首份免费，后续统一提示升级/联系。
3. **安全合规**：无明文密钥，RLS/Storage Private，免责声明与数据来源清晰。
4. **体验一致**：深色玻璃风格保持一致，定价 CTA 有合理 fallback（未接 Stripe 时不失效）。
5. **可观测 & 回滚**：重要路径有日志/监控占位，PR 可回滚，CI 保证 lint/test。

## 技术约束

- 框架：Next.js App Router + TypeScript + React 19；Tailwind v4 `@theme inline` token 化，不得裸写色值。
- 数据：Finnhub 行情 + OpenRouter/Helicone LLM（可配置 `OPENROUTER_MODEL`），Supabase Hosted（项目 ref `inmtounwqcjwsxkfnsfd`），RLS 已配置。
- 鉴权：NextAuth（Email/SSO）；`/api/report` 依赖 session 与 `quota/reportsUsed`。
- 存储：需要私有桶 `report-assets` + RLS；仅 Service Role 上传，客户端签名 URL 读取。
- 代码质量：ESLint 9 + Vitest；新增改动必须跑 `npm run lint && npm test`；重要路径补充手动验证脚本。
- 支付：Stripe 尚未接通；`handleSubscribe*` 为占位，需在接通前提供非破坏性 fallback。

## 文案 key（上线需锁定）

- 核心价值：`3 分钟获得机构级美股报告，首份免费`。
- 可信度：`实时数据来自 Finnhub / 公共财报，AI 仅做结构化整理`。
- 免责声明：`不提供投资建议，请自行判断风险`；`LLM 输出经敏感词重写`。
- 额度提示：未登录提示 `注册后领取首份免费额度`；用完提示 `额度已用尽，升级解锁`。
- CTA：Hero 主按钮 `生成我的报告`，次要 CTA `查看样例 / 报告模版`；定价按钮在未接通支付时改为 `联系开通` 或弹出登录。

## 测试要求

- 自动化：`npm run lint`、`npm test`、`bash scripts/verify-hosted-deployment.sh`（Hosted 凭证到位后）。
- 手动流：
  1. 登录/注册 → 生成首份报告 → 配额扣减 → 刷新仍保留剩余额度。
  2. 未登录直接生成 → 收到登录提示；额度耗尽 → 429 提示文案正确。
  3. `/api/report/history`、`/api/report/credits` 在登录/未登录的响应符合契约。
  4. DOCX 导出 & 复制报告正常，Storage 上传落在私有桶。
  5. 多语言切换后 CTA/提示文案不缺失。
- 安全验证：Supabase Storage 桶为 Private，两条 RLS 策略存在；`.env.local` 未入库。

## 推进计划（48–72h）

- **T0（当天）**：Codex 创建 `report-assets` 私有桶 + RLS，合并 `feat/supabase-deployment → main`；更新 `.env.local` 凭证并确认 `git status` 干净。
- **T+1**：Claude 在新分支接入额度真实读取与 UI 提示（移除前端硬编码 quota=1，消费后刷新 session），补全未登录/额度不足的 UX；为 `handleSubscribe*` 添加安全 fallback（登录或联系窗）。
- **T+2**：若时间允许，接 Stripe Checkout（仅月/年套餐，计入 `plan/quota`），否则提供“预约开通”表单记录；完成手动验收并录入 `docs/reports/<date>-launch-verification.md`。
- **发布检查**：通过 lint/test/script 后，准备 PR（含 CAVR 与验证结果），邀请评审，合并并打 tag `v0.1.0-launch`。

## 风险与缓解

- 支付未接通前的付费 CTA 误导：使用登录/联系表单 fallback，避免空点击。
- LLM 成本与速率：默认模型走 Helicone/OpenRouter，必要时加 `OPENROUTER_MODEL`/`HELICONE_MODEL` 兜底；限制 `testToken` 渠道。
- 配额同步延迟：每次成功生成后强制刷新 session，后端以事务扣减 quota。
- 多语言漏文案：统一检查 `lib/i18n` 字典，新增 key 需双语同步。

---

**状态**：计划已完成并归档，详见收尾报告 `docs/reports/2025-11-26-launch-closeout.md`。
