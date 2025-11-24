# Supabase 托管部署 - CAVR 报告

**日期：** 2025-11-24
**分支：** feat/supabase-deployment
**状态：** 完成
**测试：** 34/34 通过，ESLint 0 错误

---

## Context（上下文）

基于 Stage 2 完整实现（`feat/supabase-integration`），需要为托管 Supabase 部署做最后的对齐与文档化工作。主要问题：

1. **Schema 不一致**：旧迁移中 `report_documents` 表字段（`run_id`, `markdown_summary`, `docx_summary`）与代码期望（`report_run_id`, `document_type`, `storage_path`）不匹配。
2. **RPC 返回字段**：`fn_consume_report_credit` 返回 `remaining INT`，但代码期望 `remaining_credits`。
3. **View 字段**：`v_user_quota` 缺少 `user_id` 字段，`remaining_quota` 应为 `remaining_credits`。
4. **缺失字段**：`report_credit_events` 表缺 `metadata` 和 `delta` 字段用于审计。
5. **文档缺口**：README 及 `.env.local.example` 未完整说明 Hosted 部署步骤。

---

## Actions（实施动作）

### 1. 创建新迁移文件（Schema 对齐）
**文件：** `supabase/migrations/20251124000002_align_hosted_schema.sql`

#### 修复内容：
- ✅ 添加 `mode` 列到 `report_runs`（用于区分 test/production）
- ✅ 重建 `report_documents` 表：
  - 字段：`id`, `report_run_id`, `document_type`, `storage_path`, `created_at`
  - RLS：用户只能读取自己的报告；Service Role 可插入/删除
- ✅ 升级 `report_credit_events` 表：
  - 添加 `metadata JSONB NULL`（审计数据）
  - 添加 `delta INT`（与 `credits_amount` 对应）
- ✅ 重建 `v_user_quota` 视图：
  - 字段：`user_id`, `email`, `plan`, `quota_limit`, `reports_used`, `remaining_credits`
  - 确保 `remaining_credits` 而非 `remaining_quota`
- ✅ 修改 `fn_consume_report_credit` 函数签名：
  - 返回字段改为 `remaining_credits` 而非 `remaining`
  - 插入审计时填充 `metadata` 与 `delta` 字段
- ✅ 新增索引：
  - `idx_report_documents_report_run_id`
  - `idx_report_documents_created_at`
  - `idx_report_credit_events_user_id`
  - `idx_report_credit_events_created_at`
  - `idx_report_credit_events_event_type`

### 2. 更新 TypeScript 类型定义
**文件：** `types/database.ts`

- ✅ `report_runs.Row` 添加 `mode: string` 字段
- ✅ `report_documents.Row` 更新为新字段（`report_run_id`, `document_type`, `storage_path`）
- ✅ `report_credit_events.Row` 添加 `metadata: Json | null` 和 `delta: number | null`
- ✅ `fn_consume_report_credit` 返回类型改为 `remaining_credits`
- ✅ `v_user_quota.Row` 改为 `user_id` 和 `remaining_credits`

### 3. 修复 API 端点
**文件：** `app/api/report/credits/route.ts`

- ✅ 修改查询以匹配新视图字段（`user_id`, `remaining_credits`）
- ✅ 更新响应结构（移除 `total_credits`、`used_credits`）

### 4. 更新部署文档
**文件：** `README.md`

新增 "Supabase 部署（Hosted 实例）" 章节，包括：
- 前置条件（Node 18+, Supabase CLI 2.58+）
- 6 步部署流程：
  1. Supabase CLI 登录与项目连接
  2. 推送迁移 + 生成类型
  3. 创建私有存储桶（Dashboard UI 操作）
  4. 配置 env 变量
  5. 本地验证（lint + test + dev server）
  6. 手动 API 验证（curl 示例）
- 常见问题解答

**文件：** `.env.local.example`

- ✅ 完整重组，按逻辑分组（数据源、LLM、Supabase、测试、Auth、Stripe、邮件）
- ✅ 明确标注必需 vs 可选变量
- ✅ 增加获取位置说明（Supabase Dashboard 路径）
- ✅ 添加 `TEST_REPORT_TOKEN` 和 LLM 优先级说明

---

## Verification（验证）

### Lint 结果
```
✓ ESLint 检查：0 错误，15 个警告（预期的未使用变量）
  无新增代码错误，所有警告为既有代码
```

### Test 结果
```
✓ Vitest 运行：34/34 测试通过
  - __tests__/api.test.ts: 3 通过
  - lib/supabase/server.test.ts: 9 通过
  - lib/services/quota.test.ts: 9 通过
  - __tests__/api/report.history.test.ts: 7 通过
  - __tests__/api/report.supabase.test.ts: 4 通过
  - __tests__/useProgress.test.tsx: 2 通过
```

### Schema 验证
- ✅ 新迁移语法正确（SQL 语法检查通过）
- ✅ 类型定义与迁移字段对齐
- ✅ RLS 策略覆盖所有敏感表
- ✅ 索引覆盖主要查询路径

### 文档一致性
- ✅ README 部署步骤与 `.env.local.example` 字段名一致
- ✅ 所有 API 端点文档已更新（`/api/report`、`/api/report/credits`、`/api/report/history`）
- ✅ Hosted 模式为默认推荐，本地 Stack 为可选

---

## Risks（风险与缓解）

### 已识别风险

| 风险 | 等级 | 缓解措施 |
|------|------|--------|
| Schema 迁移与代码不同步 | 高 | 新迁移已通过类型检查，测试覆盖返回字段 |
| Service Role 泄漏 | 高 | README 明确警示仅服务端使用，CI/CD 应用密钥管理 |
| 存储桶公开 | 高 | 部署指南强制私有桶 + RLS 策略验证 |
| LLM 未配置导致 500 | 中 | README 明确要求至少配置 Helicone 或 OpenRouter |
| 本地迁移冲突 | 中 | 推荐使用 Hosted 实例，本地 Stack 仅为开发参考 |

### 缓解完毕
- ✅ 所有 Schema 变更已集中在新迁移文件
- ✅ 代码已使用 Service Role Key 仅在服务端
- ✅ RLS 策略覆盖所有用户表
- ✅ 文档强调 Hosted 为唯一推荐部署方式

---

## Files Changed

| 文件 | 变更 | 说明 |
|------|------|------|
| `supabase/migrations/20251124000002_align_hosted_schema.sql` | 新增 | Schema 对齐迁移 |
| `types/database.ts` | 更新 | TypeScript 类型同步 |
| `app/api/report/credits/route.ts` | 修复 | API 查询字段对齐 |
| `README.md` | 新增 | Supabase 部署完整指南 |
| `.env.local.example` | 重构 | 环境变量完整文档 |
| `docs/guides/README.md` | 无变 | 已包含部署参考 |
| `docs/guides/supabase-report-stage2-cavr.md` | 无变 | 已包含详细 CAVR |

---

## Deployment Checklist

### 生产部署前清单（Hosted 项目）
- [ ] Supabase Dashboard 创建项目
- [ ] 执行 `npx supabase link --project-ref <ref>`
- [ ] 执行 `npx supabase db push` 推送迁移
- [ ] 执行 `npx supabase gen types typescript --linked > types/database.ts`
- [ ] Dashboard → Storage 创建 `report-assets` 私有桶
- [ ] 配置 Hosted 项目的 RLS 策略（Service Role 可访问）
- [ ] 填入 `.env` 变量（Hosted URL、keys、bucket 名、LLM 密钥）
- [ ] 本地运行 `npm run lint && npm run test` 验证
- [ ] 手动测试三个 API 端点（见 README）
- [ ] 提交 PR 并获得审核通过

### 部署后验证（Vercel/Railway）
- [ ] CI/CD 密钥已配置（SUPABASE_SERVICE_ROLE_KEY 等）
- [ ] 生产日志中无 RLS 拒绝错误
- [ ] `/api/report` 端点可正常生成报告
- [ ] `/api/report/credits` 返回正确额度
- [ ] `/api/report/history` 列出历史报告

---

## Related Documents

- 架构决策：`docs/decisions/2025-11-24-supabase-deployment.md`
- Stage 2 CAVR：`docs/guides/supabase-report-stage2-cavr.md`
- 协作手册：`docs/guides/codex-claude-collaboration.md`
- 部署指南：`README.md` → "Supabase 部署" 章节

---

## Summary

本次部署集成工作完成了 Schema 对齐、类型同步、文档完善的全链路工作。所有改动聚焦于**仅托管 Supabase 部署**，不再维护本地 Stack 文档。

- **代码质量**：34 个测试通过，ESLint 0 错误
- **部署就绪**：新迁移已准备，与代码完全对齐
- **文档完整**：部署步骤、环境变量、常见问题全覆盖

下一步：
1. Codex 审核本 PR 及部署文档
2. 确认 Hosted 项目已创建，推送迁移
3. 创建存储桶、配置 RLS
4. 生产部署与验收
