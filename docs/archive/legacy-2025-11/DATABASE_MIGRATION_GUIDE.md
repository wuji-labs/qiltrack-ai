# 数据库迁移指南

本文档说明如何在开发环境和生产环境之间安全地同步数据库变更。

## 环境信息

| 环境 | 项目 ID | URL |
|------|---------|-----|
| 生产环境 | inmtounwqcjwsxkfnsfd | https://inmtounwqcjwsxkfnsfd.supabase.co |
| 开发环境 | nkqwtejxnghotzuazslk | https://nkqwtejxnghotzuazslk.supabase.co |

## 核心原则

1. **所有 Schema 变更必须通过迁移文件管理**
2. **开发环境先测试，验证通过后再推生产**
3. **迁移文件必须是幂等的（可重复执行）**
4. **用户数据永远不要从开发同步到生产**

---

## 工作流程

```
开发环境修改 → 创建迁移文件 → 本地测试 → 提交代码 → 生产环境执行
```

---

## 一、Schema 变更（表结构修改）

### 1.1 创建迁移文件

```bash
# 创建新的迁移文件
supabase migration new add_phone_to_profiles
```

这会在 `supabase/migrations/` 目录下创建一个带时间戳的 SQL 文件。

### 1.2 编写迁移 SQL（幂等写法）

```sql
-- supabase/migrations/20251206100000_add_phone_to_profiles.sql

-- 添加新字段（使用 IF NOT EXISTS）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 添加新表
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
  ON public.user_settings(user_id);

-- 启用 RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（先删后建，保证幂等）
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
```

### 1.3 在开发环境测试

```bash
# 方式1: 使用 Supabase CLI
supabase db push --db-url "postgresql://postgres:[password]@db.nkqwtejxnghotzuazslk.supabase.co:5432/postgres"

# 方式2: 在开发环境 Dashboard > SQL Editor 直接执行
```

### 1.4 提交代码

```bash
git add supabase/migrations/
git commit -m "feat: add phone column to profiles"
git push
```

### 1.5 生产环境部署

```bash
# 方式1: CLI 推送
supabase db push --db-url "postgresql://postgres:[password]@db.inmtounwqcjwsxkfnsfd.supabase.co:5432/postgres"

# 方式2: 在生产环境 Dashboard > SQL Editor 执行迁移文件内容
```

---

## 二、常见变更类型示例

### 2.1 添加新字段

```sql
-- 推荐：带默认值，向后兼容
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT NULL;

-- 不推荐：NOT NULL 无默认值（会导致现有数据报错）
-- ALTER TABLE public.profiles ADD COLUMN phone TEXT NOT NULL;
```

### 2.2 修改字段类型

```sql
-- 安全的类型转换
ALTER TABLE public.profiles
  ALTER COLUMN quota_limit TYPE BIGINT;

-- 危险操作：可能丢失数据，需要先备份
-- ALTER TABLE public.profiles ALTER COLUMN status TYPE INTEGER USING status::integer;
```

### 2.3 删除字段

```sql
-- 生产环境慎用！先确认代码不再使用该字段
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS deprecated_field;
```

### 2.4 添加新表

```sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 别忘了 RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
```

### 2.5 添加/修改 RLS 策略

```sql
-- 先删后建，保证幂等
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
CREATE POLICY "policy_name" ON public.table_name
  FOR SELECT USING (condition);
```

### 2.6 添加/修改函数

```sql
-- CREATE OR REPLACE 保证幂等
CREATE OR REPLACE FUNCTION public.my_function()
RETURNS void AS $$
BEGIN
  -- function body
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 三、配置数据同步

对于需要在生产环境初始化的配置数据，使用 `ON CONFLICT` 实现幂等：

```sql
-- 套餐配置
INSERT INTO public.pricing_plans (slug, name, price, features) VALUES
  ('free', '免费版', 0, '{"reports": 5}'),
  ('pro', '专业版', 99, '{"reports": 100}'),
  ('enterprise', '企业版', 999, '{"reports": -1}')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  features = EXCLUDED.features;

-- 系统配置
INSERT INTO public.copy_modules (module_key, module_value) VALUES
  ('hero', '{"title": "Welcome"}'),
  ('footer', '{"copyright": "2024"}')
ON CONFLICT (module_key) DO UPDATE SET
  module_value = EXCLUDED.module_value;
```

---

## 四、从生产环境拉取 Schema

如果生产环境有手动修改，需要同步到本地：

```bash
# 拉取远程 schema 差异
supabase db pull --db-url "postgresql://postgres:[password]@db.inmtounwqcjwsxkfnsfd.supabase.co:5432/postgres"

# 这会生成一个新的迁移文件，包含远程与本地的差异
```

---

## 五、数据复制（开发环境初始化）

### 5.1 从生产复制到开发

```bash
# 使用项目提供的脚本
node scripts/copy-prod-to-dev.js
```

**注意**：
- 用户密码无法复制，开发环境统一使用 `TempPassword123!`
- Storage 文件需要单独同步

### 5.2 设置开发环境管理员

```bash
node scripts/set-dev-super-admin.js
```

---

## 六、常用命令速查

```bash
# 创建迁移
supabase migration new <name>

# 查看迁移列表
supabase migration list

# 应用迁移到远程
supabase db push --db-url <url>

# 从远程拉取 schema
supabase db pull --db-url <url>

# 重置本地数据库
supabase db reset

# 查看数据库差异
supabase db diff
```

---

## 七、危险操作清单

以下操作在生产环境需要特别小心：

| 操作 | 风险 | 建议 |
|-----|------|------|
| `DROP TABLE` | 数据丢失 | 先备份，确认无引用 |
| `DROP COLUMN` | 数据丢失 | 确认代码不再使用 |
| `TRUNCATE` | 数据清空 | 仅限开发环境 |
| `ALTER TYPE` | 可能失败 | 测试数据转换 |
| `DROP POLICY` | 权限泄露 | 立即创建新策略 |

---

## 八、故障排除

### 8.1 迁移执行失败

```sql
-- 查看当前 schema 版本
SELECT * FROM supabase_migrations.schema_migrations;

-- 手动标记迁移已完成（慎用）
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('20251206100000');
```

### 8.2 外键约束失败

```sql
-- 临时禁用外键检查（仅限数据迁移）
SET session_replication_role = 'replica';

-- 执行数据操作...

-- 重新启用
SET session_replication_role = 'origin';
```

### 8.3 RLS 策略阻止操作

```sql
-- 使用 service_role 绕过 RLS
-- 在代码中使用 createServiceRoleClient()
```

---

## 九、检查清单

部署前确认：

- [ ] 迁移文件使用幂等写法（IF NOT EXISTS, ON CONFLICT）
- [ ] 新字段有默认值或允许 NULL
- [ ] RLS 策略已配置
- [ ] 索引已创建（针对常用查询字段）
- [ ] 开发环境已测试通过
- [ ] 相关代码已更新并部署

---

## 相关文件

- `supabase/migrations/` - 迁移文件目录
- `scripts/copy-prod-to-dev.js` - 生产到开发数据复制
- `scripts/set-dev-super-admin.js` - 设置开发环境管理员
- `scripts/sync-dev-schema.sql` - 开发环境 Schema 补丁
