# Hosted 部署执行记录 - Claude 自主完成阶段

**日期：** 2025-11-24
**分支：** feat/supabase-deployment
**项目 ref：** inmtounwqcjwsxkfnsfd
**执行状态：** 待凭证获取后执行

---

## 执行计划

由于无法在此环境中交互式执行 `supabase login`，我将采用以下方案：

### 方案 A：直接使用凭证配置（推荐）

1. 从 Dashboard 获取凭证后直接写入 `.env.local`
2. 使用 Supabase Admin API 或 SQL 直接验证
3. 本地测试确认连接正常

### 方案 B：生成预检查脚本

1. 生成可复用的验证脚本
2. 列出需要手动验证的步骤
3. 记录所有预期结果

---

## 凭证获取清单

### 从 Supabase Dashboard 获取

**步骤：**

1. 打开 https://app.supabase.com/project/inmtounwqcjwsxkfnsfd
2. 导航 Settings → API
3. 复制以下值：

| 字段             | 位置                                       | 用途                          | 示例                                       |
| ---------------- | ------------------------------------------ | ----------------------------- | ------------------------------------------ |
| Project URL      | Settings → API                             | NEXT_PUBLIC_SUPABASE_URL      | `https://inmtounwqcjwsxkfnsfd.supabase.co` |
| Anon key         | Settings → API → Anon key (public)         | NEXT_PUBLIC_SUPABASE_ANON_KEY | `eyJ...`                                   |
| Service Role key | Settings → API → Service role key (secret) | SUPABASE_SERVICE_ROLE_KEY     | `eyJ...`                                   |

---

## 本地配置验证

### 已完成

- ✅ `.env.local` 模板已准备（Hosted URL 占位符）
- ✅ 迁移文件已就绪
- ✅ 代码与测试通过

### 待执行

#### 1. 配置凭证到 `.env.local`

```bash
# .env.local 中修改以下行：
NEXT_PUBLIC_SUPABASE_ANON_KEY=<从 Dashboard 复制>
SUPABASE_SERVICE_ROLE_KEY=<从 Dashboard 复制>
```

#### 2. 验证连接（可选脚本）

```javascript
// verify-supabase-connection.js
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const client = createClient(url, serviceRoleKey);

// 验证连接
const { data, error } = await client.auth.admin.listUsers();
if (error) {
  console.error("Connection failed:", error.message);
  process.exit(1);
}

console.log("✓ Supabase connection verified");
console.log("✓ Users count:", data.users.length);
```

---

## Supabase CLI 操作

### 约束

- 需要 `supabase login`（交互式，本环境无法直接执行）
- 替代方案：使用 API 令牌或预配置文件

### 预检查

```bash
# 1. 检查 CLI 版本
npx supabase --version
# 预期：supabase-cli 1.x.x（2.58+）

# 2. 检查迁移文件
ls -la supabase/migrations/
# 预期：
# 20251123000001_init_schema.sql
# 20251124000002_align_hosted_schema.sql
```

### 需要执行的命令

**若能交互式登录：**

```bash
npx supabase link --project-ref inmtounwqcjwsxkfnsfd
npx supabase db push
npx supabase gen types typescript --linked --schema public > types/database.ts
```

**若需要替代方案：**

可以使用 Supabase 的 REST API 直接操作：

```bash
# 使用 Service Role Key 调用 PostgreSQL 迁移
curl -X POST https://inmtounwqcjwsxkfnsfd.supabase.co/rest/v1/rpc/pg_execute \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM information_schema.tables WHERE table_schema = '\''public'\''"
  }'
```

或使用 SQL Editor（Dashboard → SQL Editor）手动执行迁移脚本。

---

## 存储桶创建与 RLS

### 通过 Dashboard UI（推荐）

1. Storage → Create new bucket
2. Name: `report-assets`
3. Visibility: Private
4. Create bucket

### 验证 RLS

```sql
-- SQL Editor 中执行
SELECT * FROM storage.buckets WHERE name = 'report-assets';

-- 检查策略
SELECT * FROM storage.s3_multipart_uploads
WHERE bucket_id = 'report-assets';
```

---

## 本地测试准备

### 环境就绪检查

```bash
# 1. 检查 .env.local 配置
test -f .env.local && echo "✓ .env.local exists" || echo "✗ Missing .env.local"

# 2. 检查凭证
grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | grep -q "inmtounwqcjwsxkfnsfd" && echo "✓ URL configured" || echo "✗ URL not configured"
grep "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | grep -q "PASTE_" && echo "✗ Anon key not filled" || echo "✓ Anon key configured"
grep "SUPABASE_SERVICE_ROLE_KEY=" .env.local | grep -q "PASTE_" && echo "✗ Service Role key not filled" || echo "✓ Service Role key configured"

# 3. 运行 lint + test
npm run lint    # 预期：0 errors
npm test        # 预期：34/34 passing
```

### API 端点手测

**API 1：生成报告**

```bash
# 启动开发服务
npm run dev &
DEV_PID=$!
sleep 5

# 测试报告生成
curl -s "http://localhost:3000/api/report?symbol=AAPL&testToken=test-token-12345" | jq .

# 预期：
# {
#   "success": true,
#   "reportId": "uuid",
#   "markdown": "...",
#   "docx": "..."
# }
# 或
# { "error": "LLM configuration required" }

# 清理
kill $DEV_PID
```

**API 2：查询额度**

```bash
curl -s "http://localhost:3000/api/report/credits?testToken=test-token-12345" | jq .

# 预期：
# {
#   "userId": "test-user-123",
#   "credits": {
#     "remaining_credits": 5
#   }
# }
```

**API 3：历史报告**

```bash
curl -s "http://localhost:3000/api/report/history?testToken=test-token-12345" | jq .

# 预期：
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

## 验证结果记录

### Schema 迁移验证

```
来自 Supabase Dashboard → SQL Editor 执行：

-- 检查 report_runs 新列
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'report_runs' AND column_name = 'mode';
Expected: mode | text

-- 检查 report_documents 新列
SELECT column_name FROM information_schema.columns
WHERE table_name = 'report_documents'
ORDER BY ordinal_position;
Expected: id, report_run_id, document_type, storage_path, created_at

-- 检查视图字段
SELECT column_name FROM information_schema.columns
WHERE table_name = 'v_user_quota'
ORDER BY ordinal_position;
Expected: user_id, email, plan, quota_limit, reports_used, remaining_credits
```

### 本地测试结果

```
# npm run lint
[预期输出]

# npm test
[预期输出]
Test Files  6 passed (6)
Tests       34 passed (34)
```

### API 响应验证

```
# /api/report
Status: 200 or 500 (若 LLM 未配置)
Response: { success, reportId, ... } 或 { error, ... }

# /api/report/credits
Status: 200
Response: { userId, credits: { remaining_credits: number } }
验证：仅返回 remaining_credits，无 total/used

# /api/report/history
Status: 200
Response: { reports: [], pagination: { page, pageSize, total, pages } }
```

---

## 风险与缓解

| 风险           | 概率 | 缓解                        |
| -------------- | ---- | --------------------------- |
| CLI login 失败 | 高   | 使用 API 或 SQL Editor 替代 |
| 迁移冲突       | 低   | ALTER TABLE 幂等性保证      |
| RLS 配置遗漏   | 中   | Dashboard 检查清单          |
| 凭证泄漏       | 低   | .env.local 不提交 git       |

---

## 下一步

1. **获取凭证：** 从 Dashboard 复制 Anon/Service Role Key
2. **配置环境：** 填入 `.env.local`
3. **执行迁移：** `supabase link` → `db push` → `gen types`
4. **验证部署：** 运行 lint/test，手测 API
5. **更新 CAVR：** 记录验证结果
6. **提交 PR：** 包含所有 commits 和验证清单

---

**预计完成时间：** 15-30 分钟（取决于凭证获取速度）
