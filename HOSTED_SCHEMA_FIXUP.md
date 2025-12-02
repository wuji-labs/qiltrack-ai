# Hosted Schema 修正 - 完整指南（针对缺列/空表问题）

**当前问题**: report_documents 表结构不符、可能缺列或空表；report_credit_events 可能缺失。

**方案**: 根据表状态采用不同策略修正。

---

## 第 1 步：检查当前表结构与数据量

在 Dashboard → SQL Editor 执行以下检查 SQL：

### 检查 1: report_documents 结构

```sql
-- 查看现有列
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'report_documents'
ORDER BY ordinal_position;

-- 查看行数
SELECT COUNT(*) as row_count FROM report_documents;

-- 查看示例数据（若有）
SELECT * FROM report_documents LIMIT 5;
```

### 检查 2: report_credit_events 结构

```sql
-- 检查表是否存在
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'report_credit_events'
);

-- 若存在，查看列
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'report_credit_events'
ORDER BY ordinal_position;
```

### 检查 3: v_user_quota 视图

```sql
-- 查看视图定义
SELECT view_definition FROM information_schema.views
WHERE table_name = 'v_user_quota';
```

---

## 第 2 步：根据检查结果执行修正

### 情景 A：report_documents 为空表（推荐直接重建）

若 `COUNT(*) = 0`，执行此方案重建表结构以完全匹配代码：

```sql
-- 备份旧表（可选）
CREATE TABLE report_documents_backup AS SELECT * FROM report_documents;

-- 删除旧表
DROP TABLE IF EXISTS report_documents CASCADE;

-- 创建新表（完全匹配代码期望）
CREATE TABLE public.report_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_run_id UUID NOT NULL REFERENCES public.report_runs(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('markdown', 'docx')),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.report_documents ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的报告
CREATE POLICY "Users can view their own documents" ON public.report_documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.report_runs
      WHERE id = report_run_id
    )
  );

-- RLS 策略：Service Role 可以插入/更新/删除
CREATE POLICY "Service role full access" ON public.report_documents
  FOR ALL USING (auth.role() = 'service_role');

-- 创建索引
CREATE INDEX idx_report_documents_report_run_id ON public.report_documents(report_run_id);
CREATE INDEX idx_report_documents_created_at ON public.report_documents(created_at DESC);
```

### 情景 B：report_documents 有数据（安全迁移）

若 `COUNT(*) > 0`，使用 ALTER TABLE 方式保留数据：

```sql
-- 1. 添加新列（如尚未存在）
ALTER TABLE public.report_documents
ADD COLUMN IF NOT EXISTS report_run_id UUID,
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'markdown',
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 2. 迁移数据（假设旧列为 run_id, user_id, markdown_summary, docx_summary）
UPDATE public.report_documents
SET
  report_run_id = COALESCE(report_run_id, run_id),
  storage_path = COALESCE(storage_path,
    CONCAT(COALESCE(user_id, 'unknown'), '/', COALESCE(run_id, 'unknown'), '/document')
  ),
  document_type = CASE
    WHEN markdown_summary IS NOT NULL THEN 'markdown'
    WHEN docx_summary IS NOT NULL THEN 'docx'
    ELSE 'markdown'
  END
WHERE report_run_id IS NULL;

-- 3. 添加 NOT NULL 约束
ALTER TABLE public.report_documents
ALTER COLUMN report_run_id SET NOT NULL,
ALTER COLUMN document_type SET NOT NULL,
ALTER COLUMN storage_path SET NOT NULL;

-- 4. 删除旧列
ALTER TABLE public.report_documents
DROP COLUMN IF EXISTS run_id,
DROP COLUMN IF EXISTS user_id,
DROP COLUMN IF EXISTS markdown_summary,
DROP COLUMN IF EXISTS docx_summary;

-- 5. 添加 RLS（若尚未启用）
ALTER TABLE public.report_documents ENABLE ROW LEVEL SECURITY;
```

---

## 第 3 步：修复 report_credit_events 与相关函数

### 3A: 如果 report_credit_events 不存在，先创建

```sql
CREATE TABLE public.report_credit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.report_credit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit events" ON public.report_credit_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON public.report_credit_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_report_credit_events_user_id ON public.report_credit_events(user_id);
```

### 3B: 添加缺失列（若表已存在）

```sql
ALTER TABLE public.report_credit_events
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delta INT DEFAULT 0;
```

### 3C: 创建或更新 v_user_quota 视图

```sql
DROP VIEW IF EXISTS public.v_user_quota CASCADE;

CREATE VIEW public.v_user_quota AS
SELECT
  p.id as user_id,
  p.email,
  COALESCE(rc.plan, 'free') as plan,
  COALESCE(rc.quota_limit, 5) as quota_limit,
  COALESCE(
    (SELECT SUM(-delta) FROM report_credit_events WHERE user_id = p.id AND delta < 0),
    0
  ) as reports_used,
  COALESCE(rc.quota_limit, 5) -
  COALESCE(
    (SELECT SUM(-delta) FROM report_credit_events WHERE user_id = p.id AND delta < 0),
    0
  ) as remaining_credits
FROM auth.users p
LEFT JOIN report_credits rc ON p.id = rc.user_id;
```

### 3D: 创建或更新 fn_consume_report_credit 函数

```sql
DROP FUNCTION IF EXISTS public.fn_consume_report_credit CASCADE;

CREATE FUNCTION public.fn_consume_report_credit(
  p_user_id UUID,
  p_cost INT DEFAULT 1
)
RETURNS TABLE (success BOOLEAN, remaining_credits INT) AS $$
DECLARE
  v_remaining INT;
BEGIN
  -- 获取剩余额度
  SELECT COALESCE(remaining_credits, 0)
  INTO v_remaining
  FROM v_user_quota
  WHERE user_id = p_user_id;

  -- 检查额度是否足够
  IF v_remaining < p_cost THEN
    RETURN QUERY SELECT FALSE, v_remaining;
    RETURN;
  END IF;

  -- 记录扣费
  INSERT INTO report_credit_events (user_id, delta, metadata)
  VALUES (p_user_id, -p_cost, jsonb_build_object(
    'type', 'report_generation',
    'timestamp', NOW()::TEXT
  ));

  -- 返回新的剩余额度
  SELECT COALESCE(remaining_credits, 0)
  INTO v_remaining
  FROM v_user_quota
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT TRUE, v_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 第 4 步：验证修正完成

在 SQL Editor 中执行验证：

```sql
-- 验证 report_documents 结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'report_documents'
ORDER BY ordinal_position;

-- 验证 report_credit_events 有新列
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'report_credit_events'
ORDER BY ordinal_position;

-- 验证视图可查询
SELECT * FROM v_user_quota LIMIT 1;

-- 验证函数存在
SELECT proname FROM pg_proc WHERE proname = 'fn_consume_report_credit';

-- 验证 RLS 已启用
SELECT tablename, rowsecurity
FROM pg_class
JOIN pg_tables ON pg_class.relname = pg_tables.tablename
WHERE tablename IN ('report_documents', 'report_credit_events', 'report_runs')
AND schemaname = 'public';
```

---

## 第 5 步：生成 TypeScript 类型（Claude 负责）

SQL 修正完成后，在本地执行：

```bash
# 方法 1：使用 CLI（需登录）
npx supabase gen types typescript --project-id inmtounwqcjwsxkfnsfd > types/database.ts

# 方法 2：使用 REST API
curl -X POST "https://inmtounwqcjwsxkfnsfd.supabase.co/rest/v1/rpc/gen_types" \
  -H "Authorization: Bearer sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP" \
  -H "Content-Type: application/json" \
  > types/database.ts

# 检查是否有变更
git diff types/database.ts

# 如有变更，提交
git add types/database.ts
git commit -m "chore: sync types from Hosted instance"
```

---

## 第 6 步：创建私有存储桶 & 配置 RLS（Dashboard UI）

1. 打开 Dashboard → Storage
2. 点击 "Create new bucket"
3. 配置：
   - Name: `report-assets`
   - Visibility: **Private**
   - 点击 Create
4. 进入 `report-assets` → Policies
5. 添加策略：
   - **策略 1** (允许属主读取)
     - Type: SELECT
     - Target: report-assets
     - Allowed role: authenticated
     - Check: `(bucket_id = 'report-assets')`
   - **策略 2** (Service Role 完全控制)
     - Type: ALL
     - Target: report-assets
     - Allowed role: service_role
     - Check: (no check, allow all)

---

## 执行流程总结

1. ✅ 在 SQL Editor 执行"检查 SQL"（第 1 步）
2. ✅ 根据结果执行"情景 A"或"情景 B"（第 2 步）
3. ✅ 执行"第 3 步" SQL 补充 report_credit_events 与函数
4. ✅ 执行"第 4 步"验证 SQL
5. ➡️ **通知 Claude "schema 修正完成"**
6. ➡️ Claude 执行类型生成、存储桶创建、最终验证及 PR 提交

---

**何时完成本步骤**：

- SQL 1-4 都执行无误
- 验证查询 (第 4 步) 显示所有表/视图/函数存在
- 粘贴验证查询结果或直接说 "schema 修正完成" 告知 Claude
