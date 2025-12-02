# Hosted 部署执行 - 交接清单

**日期：** 2025-11-24
**分支：** feat/supabase-deployment
**项目 ref：** inmtounwqcjwsxkfnsfd
**状态：** 待 Codex 完成凭证配置与迁移推送

---

## 已完成的工作

### 代码与文档

- ✅ 6 个 commits 完成（Schema 对齐、3 阻塞项修复、文档补齐）
- ✅ 34/34 测试通过，ESLint 0 错误
- ✅ 迁移文件就绪（`supabase/migrations/20251124000002_align_hosted_schema.sql`）
- ✅ `.env.local` 模板已补充 Hosted 配置段
- ✅ 部署执行清单文档完整（`docs/reports/2025-11-24-deployment-execution-log.md`）

---

## 待 Codex 完成的步骤

### 步骤 1：获取与配置凭证

**操作方：** Codex（安全原因）

```bash
# 1. 打开 Supabase Dashboard
# URL: https://app.supabase.com/project/inmtounwqcjwsxkfnsfd

# 2. 导航 Settings → API
# 复制以下值到 Claude（不回显，仅作为环境配置）：
#   - Project URL（通常为 https://inmtounwqcjwsxkfnsfd.supabase.co）
#   - Anon key（public）
#   - Service Role key（secret - 勿分享！仅用于本地 .env.local）

# 3. Claude 将这些值填入 .env.local
```

**预期的 .env.local 配置：**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://inmtounwqcjwsxkfnsfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Anon key from Dashboard>
SUPABASE_SERVICE_ROLE_KEY=<Service Role key from Dashboard>
SUPABASE_STORAGE_REPORT_BUCKET=report-assets
```

---

### 步骤 2：Supabase CLI 连接与迁移

**操作方：** Claude（需要凭证已在 .env.local）

```bash
# 1. 登录 Supabase CLI（仅需一次）
npx supabase login
# 将被提示打开浏览器进行身份验证

# 2. 关联 Hosted 项目
npx supabase link --project-ref inmtounwqcjwsxkfnsfd

# 3. 推送迁移到 Hosted
npx supabase db push
# 验证输出中应包含：
# ✓ 20251123000001_init_schema.sql
# ✓ 20251124000002_align_hosted_schema.sql

# 4. 重新生成 TypeScript 类型（若有变更）
npx supabase gen types typescript --linked --schema public > types/database.ts
# 比较输出与当前 types/database.ts（应无差异）

# 若有变更，提交：
git add types/database.ts
git commit -m "chore: sync types from Hosted instance"
```

---

### 步骤 3：创建存储桶与 RLS

**操作方：** Codex（通过 Dashboard UI）

```bash
# 1. 打开 Supabase Dashboard → Storage
# 创建新桶：
#   - 名称: report-assets
#   - 可见性: Private（私有）
#   - 其他：默认即可

# 2. 配置 RLS 策略
# 路径：Storage → report-assets → Policies

# 添加策略 1：Service Role 可上传/删除
#   Type: All
#   Target: report-assets
#   Allowed role: service_role
#   Check: true（无条件）

# 添加策略 2：用户可读自己的报告（可选，通过 signed URL）
#   Type: SELECT
#   Target: report-assets
#   Allowed role: authenticated
#   Check: (bucket_id = 'report-assets')

# 3. 验证数据库 RLS 未放宽
# 检查 SQL Editor 中：
SELECT tablename, rowlevel FROM pg_class
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
WHERE schemaname = 'public' AND rowlevel = true;

# 应显示所有关键表启用 RLS：
# - profiles
# - report_runs
# - report_documents
# - report_credit_events
# - report_credits
```

---

### 步骤 4：本地环境验证

**操作方：** Claude（凭证配置后）

```bash
# 1. 验证环境变量已填入
grep "NEXT_PUBLIC_SUPABASE_URL" .env.local
# 应输出: NEXT_PUBLIC_SUPABASE_URL=https://inmtounwqcjwsxkfnsfd.supabase.co

# 2. 运行 lint 检查
npm run lint
# 预期：0 errors, 15 warnings (existing)

# 3. 运行测试
npm test
# 预期：34/34 tests passing
```

---

### 步骤 5：手动 API 验证

**操作方：** Claude（启动开发服务后）

```bash
# 1. 启动开发服务
npm run dev
# 等待：Listening on http://localhost:3000

# 2. 测试 /api/report（生成报告）
curl "http://localhost:3000/api/report?symbol=AAPL&testToken=test-token-12345"

# 预期响应（若 LLM 配置正确）：
# {
#   "success": true,
#   "reportId": "uuid",
#   "markdown": "...",
#   "docx": "...",
#   "markdownUrl": "signed-url",
#   "docxUrl": "signed-url"
# }

# 或（若 LLM 未配置）：
# { "error": "LLM configuration required" }

# 3. 测试 /api/report/credits（查询额度）
# 注：需 Session cookie，可使用测试 token bypass
curl "http://localhost:3000/api/report/credits?testToken=test-token-12345"

# 预期响应：
# {
#   "userId": "user-uuid-or-test",
#   "credits": {
#     "remaining_credits": 5
#   }
# }
# ✓ 验证：仅返回 remaining_credits（无 total/used）

# 4. 测试 /api/report/history（查询历史）
curl "http://localhost:3000/api/report/history?testToken=test-token-12345"

# 预期响应：
# {
#   "reports": [],
#   "pagination": {
#     "page": 1,
#     "pageSize": 20,
#     "total": 0,
#     "pages": 0
#   }
# }
```

---

## 验证清单

### Schema 迁移

- [ ] `npx supabase db push` 成功
- [ ] 迁移日志显示两个迁移文件被应用
- [ ] Hosted Studio 中确认新列存在：
  - [ ] `report_runs.mode`
  - [ ] `report_credit_events.metadata`、`delta`
  - [ ] `v_user_quota` 视图含 `user_id`、`remaining_credits`

### 类型生成

- [ ] `npx supabase gen types` 完成
- [ ] 生成的 `types/database.ts` 与现有版本相同或只有预期变更
- [ ] 若有变更，已提交 commit

### 存储桶

- [ ] Dashboard 中确认 `report-assets` 桶存在
- [ ] 桶设为 Private（私有）
- [ ] RLS 策略已配置（Service Role 可操作）

### 本地验证

- [ ] `npm run lint` → 0 errors
- [ ] `npm run test` → 34/34 passing
- [ ] `/api/report` 端点可调用（成功或 LLM 提示）
- [ ] `/api/report/credits` 返回单字段 `remaining_credits`
- [ ] `/api/report/history` 返回列表与分页

---

## 后续动作

### 若全部验证通过

1. 更新最终 CAVR（已验证的步骤与结果）
2. 提交 PR（6 commits + 验证记录）
3. 审核与合并到 main

### 若遇到问题

1. 记录错误信息与日志
2. 检查迁移日志（`supabase db push` 输出）
3. 验证凭证正确性（Dashboard 与 .env.local 一致）
4. 修复后重试迁移（ALTER TABLE 具有幂等性）

---

## 参考文档

- CAVR 报告：`docs/reports/2025-11-24-supabase-deployment-cavr.md`
- 部署执行清单：`docs/reports/2025-11-24-deployment-execution-log.md`
- README 部署指南：`README.md` → "Supabase 部署" 章节
- 迁移脚本：`supabase/migrations/20251124000002_align_hosted_schema.sql`
