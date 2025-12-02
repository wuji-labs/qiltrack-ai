# Supabase 存储桶创建指南 — report-assets 私有桶

**日期**：2025-11-26
**目标**：为报告资源创建私有存储桶并配置 RLS
**所需权限**：Supabase 项目管理员

---

## 快速概览

你需要创建一个名为 `report-assets` 的私有存储桶，用于存储用户生成的报告（DOCX、PDF 等）。

| 项目     | 值                                           |
| -------- | -------------------------------------------- |
| 桶名     | `report-assets`                              |
| 访问权限 | Private（私有）                              |
| 上传者   | Service Role（后端）使用 `admin` 权限        |
| 读取者   | 已认证用户（通过签名 URL）                   |
| RLS 策略 | 仅 Service Role 可上传，用户可读取自己的文件 |

---

## 方案一：通过 Dashboard 创建（推荐）

### 步骤 1：登录 Supabase Dashboard

1. 打开 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 选择你的项目：`inmtounwqcjwsxkfnsfd`
3. 左侧菜单 → **Storage**（存储）

### 步骤 2：创建新桶

1. 点击 **New bucket** 按钮
2. 输入桶名：`report-assets`
3. **勾选 "Private bucket"**（重要！）
4. 点击 **Create bucket**

![Dashboard Screenshot Placeholder]

```
Dashboard > Storage > New Bucket
┌─────────────────────────────────┐
│ Bucket name: [report-assets____] │
│ ☑ Private bucket                 │
│ [Create bucket]                 │
└─────────────────────────────────┘
```

### 步骤 3：配置 RLS（行级安全）策略

创建桶后，会自动进入该桶的管理页面。点击 **Policies** 标签：

#### 策略 1：Service Role 上传权限

1. 点击 **New Policy**
2. 选择 **Create a policy from scratch**
3. 名称：`service_role_upload`
4. 操作：**INSERT**
5. 目标角色：**service_role**
6. SQL 表达式：

```sql
true
```

7. 点击 **Save**

#### 策略 2：用户读取自己的文件

1. 点击 **New Policy**
2. 选择 **Create a policy from scratch**
3. 名称：`authenticated_read_own_files`
4. 操作：**SELECT**
5. 目标角色：**authenticated**
6. SQL 表达式：

```sql
bucket_id = 'report-assets'
```

7. 点击 **Save**

#### 策略 3：Service Role 完全访问（用于删除/更新）

1. 点击 **New Policy**
2. 选择 **Create a policy from scratch**
3. 名称：`service_role_full_access`
4. 操作：**UPDATE, DELETE**
5. 目标角色：**service_role**
6. SQL 表达式：

```sql
true
```

7. 点击 **Save**

**完成后应该看到 3 条策略**：

```
✓ service_role_upload (INSERT)
✓ authenticated_read_own_files (SELECT)
✓ service_role_full_access (UPDATE, DELETE)
```

---

## 方案二：通过 Supabase CLI 创建（自动化）

如果你更喜欢命令行或想自动化流程：

### 前置条件

```bash
# 安装 Supabase CLI（如果还没有）
npm install -g supabase

# 或者用 Homebrew（Mac）
brew install supabase/tap/supabase
```

### 创建桶

```bash
# 登录 Supabase
supabase login

# 初始化（如果还没有）
supabase init

# 创建桶（通过 SQL 迁移）
supabase migration new create_report_assets_bucket
```

这会生成一个迁移文件，编辑 `supabase/migrations/<timestamp>_create_report_assets_bucket.sql`：

```sql
-- Create the report-assets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-assets', 'report-assets', false)
ON CONFLICT DO NOTHING;

-- Allow service_role to insert files
CREATE POLICY "service_role_upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'report-assets');

-- Allow authenticated users to read their own files
CREATE POLICY "authenticated_read_own_files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'report-assets');

-- Allow service_role to update/delete files
CREATE POLICY "service_role_full_access"
ON storage.objects FOR UPDATE, DELETE
TO service_role
USING (bucket_id = 'report-assets');
```

然后运行迁移：

```bash
supabase db push
```

---

## 方案三：通过 SQL 直接执行（高级）

如果你有 Supabase SQL 编辑器的访问权限，可以直接在 Dashboard 的 **SQL Editor** 中执行：

```sql
-- 1. 创建桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-assets', 'report-assets', false)
ON CONFLICT DO NOTHING;

-- 2. 创建 RLS 策略

-- 允许 service_role 上传文件
CREATE POLICY "service_role_upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'report-assets');

-- 允许已认证用户读取文件
CREATE POLICY "authenticated_read_own_files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'report-assets');

-- 允许 service_role 更新和删除
CREATE POLICY "service_role_full_access"
ON storage.objects FOR UPDATE, DELETE
TO service_role
USING (bucket_id = 'report-assets');

-- 3. 启用 RLS（通常默认已启用）
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

---

## 验证创建成功

### 检查 1：Dashboard 确认

1. 打开 Storage → 确认看到 `report-assets` 桶
2. 桶名旁边应该显示 **Private** 标签
3. 点击桶 → **Policies** → 确认 3 条 RLS 策略存在

### 检查 2：SQL 验证

在 **SQL Editor** 中运行：

```sql
-- 查看所有桶
SELECT id, name, public FROM storage.buckets;
-- 应该能看到：report-assets | false

-- 查看 RLS 策略
SELECT * FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
-- 应该看到 3 条策略
```

### 检查 3：后端代码验证

在你的应用中测试上传（后期）：

```typescript
// 使用 Service Role（仅后端，.env 中）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 超级管理员权限
);

// 上传文件（只有 Service Role 能做）
const { data, error } = await supabase.storage
  .from("report-assets")
  .upload(`${userId}/${filename}`, fileBuffer, {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

if (error) console.error("Upload failed:", error);
else console.log("Uploaded:", data);
```

---

## 关键安全点

### ✅ 推荐做法

1. **Private 桶**：禁止公开访问，只能通过签名 URL
2. **Service Role 上传**：后端使用 Service Role 权限上传（不向前端暴露）
3. **用户读取**：已认证用户可以读取文件，但仅通过签名 URL
4. **无公开列表**：前端无法列出桶中的所有文件

### ❌ 避免做法

- ❌ 不要设为 Public bucket（会暴露所有文件列表）
- ❌ 不要在前端代码中存放 Service Role 密钥
- ❌ 不要允许用户直接写入任意路径（总是在后端验证）
- ❌ 不要跳过 RLS 配置（会有安全漏洞）

---

## 故障排除

### 问题 1：创建桶时出错 "Bucket already exists"

**原因**：桶已存在（可能来自之前的尝试）

**解决**：

- 在 Dashboard 中删除旧桶（Storage → 选中桶 → Delete）
- 等待 30 秒后重新创建

### 问题 2：上传时被拒绝 "RLS policy prevents upload"

**原因**：没有正确配置 Service Role INSERT 权限

**解决**：

1. 确认后端使用了 `SUPABASE_SERVICE_ROLE_KEY`
2. 在 Dashboard 检查 Policies 是否正确保存
3. 运行 SQL 验证策略是否存在

### 问题 3：用户读取被拒绝

**原因**：RLS 策略过于严格

**解决**：修改 SELECT 策略为：

```sql
bucket_id = 'report-assets'
```

（不需要检查 owner，只要桶 ID 匹配即可）

---

## 下一步

完成桶创建后：

1. ✅ 更新 `.env.local`（如果需要存储桶名称）
2. ✅ 在后端集成文件上传逻辑
3. ✅ 测试上传和读取流程
4. ✅ 配置文件签名 URL 生成（用于下载）

```typescript
// 生成 7 天有效期的签名 URL
const { data: signedUrl } = await supabase.storage
  .from("report-assets")
  .createSignedUrl(`${userId}/${filename}`, 7 * 24 * 60 * 60);

// 前端用这个 URL 下载文件
window.open(signedUrl);
```

---

**建桶完成后，告诉我结果，我帮你验证和集成到后端！** 🚀
