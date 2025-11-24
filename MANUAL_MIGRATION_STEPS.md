# Hosted 部署 - 需手动执行的步骤

凭证已配置到 `.env.local`，本地 lint/test 全部通过。

**问题**: Supabase CLI 需要交互式 `supabase login`，本环境无法执行。

**方案**: 使用 Supabase Dashboard SQL Editor 直接执行迁移。

---

## 方案 A：Dashboard SQL Editor（推荐）

1. 打开 https://inmtounwqcjwsxkfnsfd.supabase.co/project/inmtounwqcjwsxkfnsfd/sql
   - 或: Dashboard → SQL Editor

2. 新建查询，复制以下 SQL 并执行（分段执行以便观察进度）：

### SQL 1: 添加 mode 列到 report_runs
```sql
ALTER TABLE public.report_runs
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'production';
```

### SQL 2: 迁移 report_documents（3 步）
```sql
-- Step 1: 添加新列
ALTER TABLE public.report_documents
ADD COLUMN IF NOT EXISTS report_run_id UUID REFERENCES public.report_runs(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'markdown',
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Step 2: 迁移数据（若表为空则无影响）
UPDATE public.report_documents
SET
  report_run_id = COALESCE(report_run_id, run_id),
  storage_path = COALESCE(storage_path,
    CASE
      WHEN markdown_summary IS NOT NULL THEN CONCAT(user_id, '/', run_id, '/document.md')
      ELSE CONCAT(user_id, '/', run_id, '/document')
    END
  ),
  document_type = CASE
    WHEN markdown_summary IS NOT NULL THEN 'markdown'
    WHEN docx_summary IS NOT NULL THEN 'docx'
    ELSE 'markdown'
  END
WHERE report_run_id IS NULL OR storage_path IS NULL;

-- Step 3: 设为 NOT NULL
ALTER TABLE public.report_documents
ALTER COLUMN report_run_id SET NOT NULL,
ALTER COLUMN document_type SET NOT NULL,
ALTER COLUMN storage_path SET NOT NULL;

-- Step 4: 删除旧列
ALTER TABLE public.report_documents
DROP COLUMN IF EXISTS run_id,
DROP COLUMN IF EXISTS user_id,
DROP COLUMN IF EXISTS markdown_summary,
DROP COLUMN IF EXISTS docx_summary;
```

### SQL 3: 添加审计字段到 report_credit_events
```sql
ALTER TABLE public.report_credit_events
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delta INT;
```

### SQL 4: 修改 RPC 函数返回字段
```sql
CREATE OR REPLACE FUNCTION public.fn_consume_report_credit(
  p_user_id UUID,
  p_cost INT DEFAULT 1
)
RETURNS TABLE (success BOOLEAN, remaining_credits INT) AS $$
BEGIN
  -- 检查配额
  IF (SELECT remaining_credits FROM v_user_quota WHERE user_id = p_user_id) < p_cost THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  -- 扣费
  INSERT INTO report_credit_events (user_id, delta, metadata)
  VALUES (p_user_id, -p_cost, jsonb_build_object('type', 'report_generation', 'timestamp', NOW()));

  -- 返回剩余额度
  RETURN QUERY
  SELECT TRUE, COALESCE((SELECT remaining_credits FROM v_user_quota WHERE user_id = p_user_id), 0)::INT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### SQL 5: 验证 Schema
```sql
-- 确认新列存在
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'report_documents'
ORDER BY ordinal_position;

-- 确认视图可用
SELECT * FROM v_user_quota LIMIT 1;

-- 确认 RPC 函数存在
SELECT proname FROM pg_proc WHERE proname = 'fn_consume_report_credit';
```

---

## 方案 B：pgAdmin 或 psql（如需更多控制）

如已获取 Hosted 数据库连接信息：
```bash
psql "postgresql://postgres:z/uHvR#5Bc-+gXB@db.inmtounwqcjwsxkfnsfd.supabase.co:5432/postgres" \
  -f supabase/migrations/20251124000002_align_hosted_schema.sql
```

---

## 后续步骤（Claude 执行）

### 1. 生成类型（执行迁移后）
```bash
# 使用 Supabase CLI 生成
npx supabase gen types typescript --project-id inmtounwqcjwsxkfnsfd > types/database.ts

# 或使用 REST API
curl -X POST "https://inmtounwqcjwsxkfnsfd.supabase.co/rest/v1/rpc/introspect" \
  -H "Authorization: Bearer sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP" \
  > types/database.ts
```

### 2. 创建存储桶（Dashboard UI）
- 路径: Dashboard → Storage → Create new bucket
- 名称: `report-assets`
- 可见性: Private
- 点击 Create

### 3. 配置 RLS 策略（Dashboard UI）
- 进入 `report-assets` 桶
- 点击 Policies
- 添加策略：Role = service_role, 所有权限

### 4. 本地验证（迁移完成后）
```bash
npm run lint        # expect: 0 errors
npm test            # expect: 34/34 passing
npm run dev         # 启动开发服务

# 测试 API
curl "http://localhost:3000/api/report/credits?testToken=test-token-12345"
```

---

## 验收标准

迁移完成后应满足：
- ✅ `report_runs.mode` 列存在
- ✅ `report_documents` 包含 report_run_id, document_type, storage_path（无旧列）
- ✅ `v_user_quota` 视图可查询
- ✅ `/api/report/credits` 返回 `{ remaining_credits: number }`
- ✅ 本地 lint/test 全通过

