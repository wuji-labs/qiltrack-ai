# Hosted Supabase 部署 - 就绪状态总结

**日期：** 2025-11-24
**分支：** feat/supabase-deployment
**项目 ref：** inmtounwqcjwsxkfnsfd
**状态：** ✅ 代码与文档完成，待凭证执行

---

## 执行状态概览

### ✅ 已完成（代码与文档）

#### 1. 8 个 Commits 就绪

```
b1f68cc - docs/scripts: add self-execution guide and verification script
d8ce2bf - docs: add Hosted deployment handoff checklist
db4d759 - docs: finalize CAVR with deployment execution details
eb97634 - docs: add comprehensive Hosted deployment execution guide
01fb92a - docs: add API response contracts to README
1e282da - docs: update CAVR with 3 blocker fixes and improved migration strategy
c4ea8bb - fix: address 3 blocking issues - anon key, credits contract, data protection
8fd2f9f - feat: align Hosted Supabase schema and complete deployment guide
```

#### 2. 代码质量检查

- **ESLint**: ✅ 0 errors, 15 warnings (pre-existing, not blocking)
- **Tests**: ✅ 34/34 passing (6 test files)
- **Build**: ✅ Ready (no breaking TypeScript errors in deployment code)

#### 3. 迁移文件

- ✅ `supabase/migrations/20251123000001_init_schema.sql` (existing)
- ✅ `supabase/migrations/20251124000002_align_hosted_schema.sql` (new, safe ALTER TABLE strategy)

#### 4. 类型定义

- ✅ `types/database.ts` synchronized with schema
- ✅ New fields: `report_documents.report_run_id`, `.document_type`, `.storage_path`
- ✅ Updated views: `v_user_quota.remaining_credits`, `v_user_quota.user_id`
- ✅ RPC return type: `fn_consume_report_credit` returns `remaining_credits`

#### 5. API Endpoints

- ✅ `/api/report` - report generation (ready for Hosted DB)
- ✅ `/api/report/credits` - simplified contract (remaining_credits only)
- ✅ `/api/report/history` - report list with pagination

#### 6. 环境配置

- ✅ `.env.local` template with Hosted URL placeholder
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` placeholder
- ✅ `SUPABASE_SERVICE_ROLE_KEY` placeholder
- ✅ `SUPABASE_STORAGE_REPORT_BUCKET=report-assets` configured

#### 7. 文档完整性

- ✅ `README.md` - 6-step Hosted deployment guide
- ✅ `CAVR` - complete analysis of all schema changes and risks
- ✅ `deployment-execution-log.md` - step-by-step with CLI commands
- ✅ `handoff-checklist.md` - detailed verification checklist
- ✅ `self-execution-guide.md` - independent execution instructions
- ✅ `scripts/verify-hosted-deployment.sh` - automated verification script

### ⏸️ 待执行（需 Hosted 凭证）

#### 1. 获取凭证（由 Codex 提供）

从 Supabase Dashboard → Settings → API 获取：

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public key, safe to share)
- `SUPABASE_SERVICE_ROLE_KEY` (secret key, keep confidential)

#### 2. 配置环境变量

```bash
# .env.local 中填入：
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from-dashboard>
```

#### 3. Supabase CLI 连接

```bash
npx supabase link --project-ref inmtounwqcjwsxkfnsfd
```

- **预期**: CLI 显示项目信息和连接成功
- **验证**: `supabase/config.json` 自动更新

#### 4. 推送迁移

```bash
npx supabase db push
```

- **预期**: 两个迁移文件被应用
  ```
  ✓ 20251123000001_init_schema.sql
  ✓ 20251124000002_align_hosted_schema.sql
  ```
- **验证**: Supabase Studio 中确认新表/列存在

#### 5. 生成类型

```bash
npx supabase gen types typescript --linked --schema public > types/database.ts
```

- **预期**: 类型与现有 `types/database.ts` 相同（无新增字段）
- **验证**: 若无变更，跳过提交；否则 `git add types/database.ts && git commit -m "chore: sync types from Hosted instance"`

#### 6. 创建存储桶（Dashboard UI）

路径: Dashboard → Storage → Create new bucket

- **Name**: `report-assets`
- **Visibility**: Private
- **RLS**: Service Role can read/write/delete

#### 7. 本地验证

```bash
# Lint 检查
npm run lint
# 预期: 0 errors, 15 warnings (existing)

# 单元测试
npm test
# 预期: 34/34 passing

# 或运行自动化验证脚本
bash scripts/verify-hosted-deployment.sh
# 预期: ✓ 所有检查通过！部署就绪。
```

#### 8. 手动 API 测试

```bash
# 启动开发服务
npm run dev &
sleep 5

# 测试三个端点
curl "http://localhost:3000/api/report?symbol=AAPL&testToken=test-token-12345"
curl "http://localhost:3000/api/report/credits?testToken=test-token-12345"
curl "http://localhost:3000/api/report/history?testToken=test-token-12345"

# 预期响应见下方
```

---

## 关键改动概览

### 阻塞项 1：Anon Key 命名

**问题**: 不一致的环境变量命名
**修复**: 统一为 `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Next.js 公钥约定)
**影响**: .env.local, README.md, 文档

### 阻塞项 2：Credits API 契约

**问题**: 过度返回 `total_credits`, `used_credits`
**修复**: 简化为仅 `remaining_credits`
**影响**: `lib/services/api.ts`, `app/api/report/credits/route.ts`, 文档

### 阻塞项 3：数据保护迁移

**问题**: 不安全的 DROP TABLE 可能丢失数据
**修复**: 采用 ALTER TABLE + 递进式数据映射
**影响**: `supabase/migrations/20251124000002_align_hosted_schema.sql`

---

## 预期的 API 响应格式

### 1. `/api/report?symbol=AAPL&testToken=test-token-12345`

**成功响应** (若 LLM 已配置):

```json
{
  "success": true,
  "reportId": "uuid-xxx",
  "markdown": "# AAPL Analysis\n...",
  "docx": "base64-encoded-docx",
  "markdownUrl": "https://signed-url-to-md",
  "docxUrl": "https://signed-url-to-docx"
}
```

**错误响应** (若 LLM 未配置):

```json
{
  "error": "LLM configuration required"
}
```

### 2. `/api/report/credits?testToken=test-token-12345`

**预期响应**:

```json
{
  "userId": "test-user-123",
  "credits": {
    "remaining_credits": 5
  }
}
```

✓ **验证**: 仅包含 `remaining_credits` 字段（无 `total_credits`, `used_credits`）

### 3. `/api/report/history?testToken=test-token-12345`

**预期响应**:

```json
{
  "reports": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "pages": 0
  }
}
```

✓ **验证**: 列表为空（新用户），分页信息完整

---

## 部署风险评估

| 风险           | 概率 | 缓解                         |
| -------------- | ---- | ---------------------------- |
| CLI login 失败 | 低   | 使用 API Token 或 SQL Editor |
| 迁移冲突       | 低   | ALTER TABLE 幂等性 + 预检查  |
| RLS 配置遗漏   | 中   | 清单 + Dashboard 验证        |
| 凭证泄漏       | 低   | .env.local 已在 .gitignore   |
| 类型生成差异   | 低   | 比较前后检查，无差异则跳过   |

---

## 验证清单（部署前）

### 本地检查

- [ ] `npm run lint` → 0 errors
- [ ] `npm test` → 34/34 passing
- [ ] `git status` → 工作树干净
- [ ] `.env.local` → Anon key / Service Role key 已填入（非占位符）

### Supabase CLI 操作

- [ ] `npx supabase link --project-ref inmtounwqcjwsxkfnsfd` → 成功
- [ ] `npx supabase db push` → 两个迁移应用成功
- [ ] `npx supabase gen types` → 类型已同步（若有变更，已提交）

### Dashboard 验证

- [ ] Studio SQL Editor 确认新表/列：
  - `report_runs.mode`
  - `report_documents.report_run_id`, `.document_type`, `.storage_path`
  - `v_user_quota.remaining_credits`
- [ ] Storage → `report-assets` 桶已创建（Private）
- [ ] RLS 策略已配置（service_role 可操作）

### API 验证

- [ ] `npm run dev` → 服务启动成功
- [ ] `/api/report` → 返回 success/error
- [ ] `/api/report/credits` → 仅返回 `remaining_credits`
- [ ] `/api/report/history` → 返回列表 + 分页

---

## 后续步骤

### 1. 获取凭证

Codex 从 Supabase Dashboard 获取 Anon/Service Role Key

### 2. 执行部署

Claude 按以下顺序执行：

```bash
# 1. 配置凭证
# (编辑 .env.local)

# 2. CLI 连接与迁移
npx supabase link --project-ref inmtounwqcjwsxkfnsfd
npx supabase db push
npx supabase gen types typescript --linked --schema public > types/database.ts

# 3. Dashboard 创建桶（UI 操作或 API）

# 4. 验证
npm run lint && npm test
bash scripts/verify-hosted-deployment.sh

# 5. 手动测试（见上方预期响应）
npm run dev
```

### 3. 更新文档

- 更新 CAVR 最终验证结果
- 添加实际 API 响应示例
- 记录任何遇到的问题与解决方案

### 4. 提交 PR

```bash
git push origin feat/supabase-deployment
# 创建 PR: feat/supabase-deployment → main
# 标题: Hosted Supabase Deployment - Schema Alignment & Fixes
# 描述: 8 commits including 3 blocker fixes, migration strategy, and complete documentation
```

---

## 文档参考

| 文件                                  | 用途                      |
| ------------------------------------- | ------------------------- |
| `README.md`                           | 生产级部署指南 (6 步流程) |
| `CAVR.md`                             | 完整技术分析与风险评估    |
| `deployment-execution-log.md`         | 详细步骤 + 脚本           |
| `handoff-checklist.md`                | Codex 的执行清单          |
| `self-execution-guide.md`             | Claude 的独立执行指南     |
| `scripts/verify-hosted-deployment.sh` | 自动化验证脚本            |

---

## 总结

**代码准备**: ✅ 完成
**文档准备**: ✅ 完成
**测试覆盖**: ✅ 34/34 passing
**迁移策略**: ✅ 安全（ALTER TABLE）
**RLS 配置**: ✅ 预配置（待存储桶创建）
**API 契约**: ✅ 简化且明确

**部署阻塞**: ⏸️ 等待 Hosted 凭证

一旦获得凭证，Claude 可在 15-30 分钟内完成全部部署与验证。
