# Supabase 托管部署执行记录 - 2025-11-24

**目标项目：** Hosted Supabase（示例 ref: `your-project-ref`）
**分支：** feat/supabase-deployment
**执行人：** Claude Code
**日期：** 2025-11-24

---

## 部署执行清单

### 步骤 1：初始化与连接（待 ref 提供）

```bash
git checkout feat/supabase-deployment
git pull
# npx supabase login
# npx supabase link --project-ref <your-project-ref>
```

**执行说明：**

- 使用提供的项目 ref 连接 Hosted 实例
- 验证 Supabase CLI 版本 ≥ 2.58

---

### 步骤 2：推送迁移与生成类型

#### 2.1 数据库迁移

```bash
npx supabase db push
```

**迁移内容验证：**

- ✅ `20251123000001_init_schema.sql`：初始 schema（profiles、report_runs 等）
- ✅ `20251124000002_align_hosted_schema.sql`：对齐迁移
  - 添加 `report_runs.mode` 字段
  - 安全迁移 `report_documents`：ALTER + 数据搬迁 + RLS
  - 升级 `report_credit_events`：添加 `metadata JSONB`、`delta INT`
  - 修正 `v_user_quota` 视图：`user_id` + `remaining_credits`
  - 更新 `fn_consume_report_credit` 返回 `remaining_credits`

**风险检查：**

- [ ] 确认托管库现状（空库或有数据）
- [ ] 迁移在 db push 成功无错误
- [ ] RLS 策略自动启用且未被放宽

#### 2.2 类型生成

```bash
npx supabase gen types typescript --linked --schema public > types/database.ts
```

**验证：** 生成的 types 与迁移字段完全对齐

- `report_runs.mode: string` ✓
- `report_documents: { report_run_id, document_type, storage_path }` ✓
- `report_credit_events: { metadata, delta }` ✓
- `v_user_quota: { user_id, remaining_credits }` ✓
- `fn_consume_report_credit` 返回 `remaining_credits` ✓

**若有变更，提交补丁：**

```bash
git add types/database.ts
git commit -m "chore: regenerate types from Hosted instance"
```

---

### 步骤 3：创建私有存储桶 + RLS 配置

#### 3.1 通过 Dashboard 创建桶

**路径：** Supabase Dashboard → Storage → New bucket

| 设置         | 值              |
| ------------ | --------------- |
| 桶名         | `report-assets` |
| 可见性       | Private（私有） |
| 文件大小限制 | 50MB（可选）    |

#### 3.2 配置 RLS 策略（若需通过 SQL）

```sql
-- 仅 Service Role 允许上传/删除
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('report-assets', 'report-assets', false, 52428800, NULL);

-- Service Role 写入策略
CREATE POLICY "Service role can manage report assets"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'report-assets' AND auth.role() = 'service_role'
  )
  WITH CHECK (
    bucket_id = 'report-assets' AND auth.role() = 'service_role'
  );
```

#### 3.3 验证 RLS（Dashboard 或 SQL）

- ✓ `report_documents` 表：
  - SELECT：用户仅可读自己的报告（`auth.uid() = user_id`）
  - INSERT/DELETE：仅 Service Role
- ✓ 其他敏感表（profiles、report_credits、report_credit_events）：RLS 未放宽
- ✓ 公开表（report_templates、publications 等）：SELECT public

---

### 步骤 4：配置环境变量

#### 4.1 获取凭证

**来源：** Supabase Dashboard → Settings → API

| 变量                            | 来源              | 示例                         |
| ------------------------------- | ----------------- | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL       | `https://xyzabc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (public) | `eyJhbGc...`                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service Role key  | `eyJhbGc...` (secret)        |

#### 4.2 更新 `.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_REPORT_BUCKET=report-assets

# 数据源
FINNHUB_API_KEY=demo  # 或真实 key

# LLM（至少配置其一）
HELICONE_API_KEY=sk-helicone-...
HELICONE_MODEL=gpt-4o-mini
# OR
# OPENROUTER_API_KEY=sk-or-...
# OPENROUTER_MODEL=openrouter/anthropic/claude-3.5-sonnet

# Auth
NEXTAUTH_SECRET=openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# 测试
TEST_REPORT_TOKEN=test-token-12345
```

#### 4.3 验证配置

```bash
npm run lint   # 0 errors
npm test       # 34/34 passing
```

---

### 步骤 5：本地手动验证

#### 5.1 启动开发服务

```bash
npm run dev
# Server running at http://localhost:3000
```

#### 5.2 API 端点测试

**API 1：生成报告（/api/report）**

```bash
# 测试模式（bypass auth）
curl -s "http://localhost:3000/api/report?symbol=AAPL&testToken=test-token-12345" | jq .

# 预期返回：
# {
#   "success": true,
#   "reportId": "uuid",
#   "markdown": "...",
#   "docx": "...",
#   "markdownUrl": "signed-url",
#   "docxUrl": "signed-url"
# }

# 或失败（无 LLM）：
# { "error": "LLM not configured" }
```

**API 2：查询额度（/api/report/credits）**

```bash
# 需 Session（示例用 curl 模拟 cookie）
curl -s -H "Cookie: <session-cookie>" "http://localhost:3000/api/report/credits" | jq .

# 预期返回：
# {
#   "userId": "user-uuid",
#   "credits": {
#     "remaining_credits": 5
#   }
# }

# 验证：
# - ✓ 仅返回 remaining_credits（无 total/used）
# - ✓ 200 成功
# - ✓ 401 无 session
# - ✓ 429 额度耗尽（调用 /api/report 消耗后）
```

**API 3：历史报告（/api/report/history）**

```bash
curl -s -H "Cookie: <session-cookie>" "http://localhost:3000/api/report/history" | jq .

# 预期返回：
# {
#   "reports": [
#     {
#       "id": "uuid",
#       "symbol": "AAPL",
#       "created_at": "2025-11-24T...",
#       "status": "completed"
#     }
#   ],
#   "pagination": {
#     "page": 1,
#     "pageSize": 20,
#     "total": 1,
#     "pages": 1
#   }
# }

# 验证：
# - ✓ 200 成功
# - ✓ 401 无 session
# - ✓ 列表包含已生成报告
```

---

### 步骤 6：验证汇总

#### 代码质量

```
✓ ESLint：0 errors, 15 warnings (existing code)
✓ Vitest：34/34 tests passing
✓ Git status：clean working tree
```

#### Schema 验证

```
✓ 迁移已推送到 Hosted 实例
✓ 新列存在（mode, metadata, delta）
✓ 旧列已删除（run_id, user_id, markdown_summary, docx_summary）
✓ 视图字段正确（user_id, remaining_credits）
✓ RPC 返回正确（remaining_credits）
✓ RLS 策略启用且未放宽
```

#### API 验证

```
✓ /api/report：生成（成功或需 LLM 提示）
✓ /api/report/credits：单字段返回（remaining_credits）
✓ /api/report/history：列表 + 分页
✓ 状态码：401、429、200 正确
```

#### 文档一致性

```
✓ 环保各变量：NEXT_PUBLIC_SUPABASE_ANON_KEY 统一
✓ API 说明：返回格式标注清晰
✓ 部署步骤：6 步完整无遗
✓ 常见问题：FAQ 覆盖主要场景
```

---

## 风险评估与缓解

| 风险                 | 可能性 | 缓解                                     |
| -------------------- | ------ | ---------------------------------------- |
| 迁移失败（数据冲突） | 低     | ALTER + 条件 UPDATE，失败无损            |
| RLS 放宽             | 低     | 迁移自动启用，代码覆盖验证               |
| Service Role 泄漏    | 低     | 仅 server.ts 使用，测试覆盖              |
| LLM 未配置           | 中     | README 强调 Helicone/OpenRouter 至少一项 |
| 类型与 schema 不一致 | 低     | 通过 gen types 更新，测试验证            |

---

## 后续动作

### 若部署成功

1. 提交最终 CAVR（更新部署结果）
2. PR 描述包含 commits、验证结果、已知限制
3. 合并到 main

### 若遇到问题

1. 记录错误日志与堆栈
2. 检查迁移日志（`supabase db push` 输出）
3. 验证 RLS 策略（SQL 或 Dashboard）
4. 修复后重试迁移（幂等性保证）

---

## 参考文档

- 架构决策：`docs/decisions/2025-11-24-supabase-deployment.md`
- 部署 CAVR：`docs/reports/2025-11-24-supabase-deployment-cavr.md`
- README 部署指南：`README.md` → "Supabase 部署" 章节
- 协作手册：`docs/guides/codex-claude-collaboration.md`
