# 后台数据获取问题排查指南

**日期**: 2025-12-02
**问题**: 后台管理页面无法获取 Supabase 数据
**状态**: ✅ 已解决

## 问题总结

后台管理页面（`/admin/*`）无法从 Supabase 获取数据，表现为：
- 登录成功但显示"未登录"
- 无法获取用户列表
- 出现 RLS 策略错误

## 根本原因

### 1. **Supabase Client 不一致** 🔑
系统中混用了两个不同的 Supabase 客户端库：
- **登录页面**: 使用 `@supabase/auth-helpers-nextjs` 的 `createClientComponentClient`
- **后台页面**: 使用 `@supabase/ssr` 的 `createBrowserClient`

两者使用不同的 cookie 存储机制，导致 session 无法共享。

### 2. **RLS 策略无限递归** ♾️
原始 RLS 策略在查询 `profiles` 表时触发自身，造成无限递归：

```sql
-- ❌ 错误的策略（会递归）
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p  -- 这里又查询 profiles，触发同一策略
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );
```

### 3. **用户 ID 不匹配** 🆔
`auth.users` 表和 `profiles` 表中的用户 ID 不一致：
- **auth.users**: `8fb6f7cc-6b8c-423f-9806-eb63b068fea0` (当前登录)
- **profiles**: `e609c987-988c-47f4-a828-8096ef610f6a` (旧 ID)

这是因为用户重新注册，但 profile 记录没有更新。

## 解决方案

### 解决方案 1: 统一 Supabase Client ✅

**修改**: `lib/supabase/client.ts`

```typescript
// ❌ 旧代码
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// ✅ 新代码
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function createClient() {
  return createClientComponentClient<Database>();
}
```

**更新所有后台页面**：统一使用 `useSupabaseAuth` hook 获取 client。

### 解决方案 2: 修复 RLS 无限递归 ✅

**创建辅助函数**（绕过 RLS）:

```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER  -- 关键：绕过 RLS
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'editor')
  );
$$;
```

**更新策略**：

```sql
-- ✅ 正确的策略（使用函数）
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR auth.role() = 'service_role'
    OR public.is_admin(auth.uid())  -- 使用函数，不会递归
  );
```

### 解决方案 3: 修复用户 ID 不匹配 ✅

**执行 SQL 迁移**:

```sql
-- 1. 临时禁用外键检查
SET session_replication_role = 'replica';

-- 2. 更新相关表
UPDATE public.report_credits
SET user_id = '新ID'
WHERE user_id = '旧ID';

UPDATE public.report_credit_events
SET user_id = '新ID'
WHERE user_id = '旧ID';

-- 3. 更新 profiles 主键
UPDATE public.profiles
SET id = '新ID'
WHERE id = '旧ID';

-- 4. 重新启用外键检查
SET session_replication_role = 'origin';
```

## 诊断工具

我们创建了以下诊断脚本（位于 `scripts/` 目录）：

### 1. `diagnose-admin.js` - 快速诊断
检查后台数据获取是否正常：
```bash
node scripts/diagnose-admin.js
```

### 2. `find-profile-by-email.js` - 查找用户 ID 不匹配
```bash
node scripts/find-profile-by-email.js
```

### 3. `check-duplicate-profiles.js` - 检查重复记录
```bash
node scripts/check-duplicate-profiles.js
```

### 4. `verify-admins.js` - 验证管理员账户
```bash
node scripts/verify-admins.js
```

## 排查步骤

遇到类似问题时，按以下顺序排查：

### Step 1: 检查登录状态
访问 `/admin/test` 测试页面，查看：
- ✅ 是否已登录？
- ✅ 用户 ID 是什么？
- ✅ 是否能获取用户信息？

### Step 2: 检查 Supabase Client 一致性
```bash
# 搜索所有使用 Supabase client 的地方
grep -r "createClient\|createBrowserClient\|createClientComponentClient" app/
```

确保所有客户端页面使用相同的 client 创建方式。

### Step 3: 检查 RLS 策略
在 Supabase Dashboard 查看策略是否包含递归查询。

**识别递归策略**:
```sql
-- ❌ 有问题：策略中查询自己的表
CREATE POLICY ON table_name
  USING (
    EXISTS (SELECT 1 FROM table_name ...)  -- 递归！
  );
```

### Step 4: 检查用户 ID 匹配
```bash
node scripts/find-profile-by-email.js
```

### Step 5: 检查浏览器 Cookies
打开浏览器 DevTools:
1. Application > Cookies
2. 查找以 `sb-` 开头的 cookies
3. 确认 session cookies 存在且未过期

## 预防措施

### 1. 统一 Supabase Client
- ✅ 在 `lib/supabase/client.ts` 中集中管理 client 创建
- ✅ 所有页面通过统一接口获取 client
- ✅ 避免直接导入不同的 Supabase 库

### 2. RLS 策略最佳实践
- ✅ 使用 `SECURITY DEFINER` 函数封装复杂逻辑
- ✅ 避免策略中查询自身表
- ✅ 测试策略是否会造成递归

### 3. 用户 ID 管理
- ✅ 确保 `profiles` 表的 `id` 字段与 `auth.users.id` 同步
- ✅ 使用触发器自动创建/更新 profile
- ✅ 定期检查 ID 一致性

### 4. 测试页面
保留 `/admin/test` 测试页面用于快速诊断：
- 显示登录状态
- 显示用户信息
- 测试数据权限

## 相关文件

### 已修改
- ✅ `lib/supabase/client.ts` - 统一 client 创建
- ✅ `app/admin/users/page.tsx` - 使用统一 client
- ✅ `app/admin/page.tsx` - 使用统一 client
- ✅ `app/admin/test/page.tsx` - 测试页面

### 新增
- ✅ `supabase/migrations/20251202120000_add_admin_foxmail.sql` - 添加管理员
- ✅ `supabase/migrations/20251202130000_fix_rls_recursion.sql` - 修复 RLS
- ✅ `scripts/diagnose-admin.js` - 诊断脚本
- ✅ `scripts/find-profile-by-email.js` - ID 查找
- ✅ `scripts/migrate-user-id-simple.sql` - ID 迁移
- ✅ `scripts/fix-rls.sql` - RLS 修复
- ✅ `docs/admin-accounts.md` - 管理员文档
- ✅ `docs/troubleshooting/admin-data-access.md` - 本文档

## Supabase API Keys 说明

### 新版 API Keys（2024+）
Supabase 引入了新的 key 格式：
- ✅ `sb_publishable_...` (替代 anon key)
- ✅ `sb_secret_...` (替代 service_role key)
- 格式更短、更易读
- 新旧格式可以互换使用到 2025年10月

### 旧版 API Keys
- JWT token 格式
- 以 `eyJ` 开头
- 长度 200-300 字符

**不要担心**: 如果你的 keys 是 `sb_` 开头的短格式，这是**正常的新版格式**！

## 常见错误信息

### "infinite recursion detected in policy"
**原因**: RLS 策略递归
**解决**: 使用 `SECURITY DEFINER` 函数

### "Cannot coerce the result to a single JSON object"
**原因**: 查询返回多条记录
**解决**: 检查是否有重复的 profile 记录

### "duplicate key value violates unique constraint"
**原因**: 主键或唯一约束冲突
**解决**: 检查用户 ID 或邮箱是否已存在

### Session 无法共享
**原因**: Supabase client 不一致
**解决**: 统一使用相同的 client 库

## 参考资料

- [Supabase New API Keys 讨论](https://github.com/orgs/supabase/discussions/29260)
- [Supabase RLS 最佳实践](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js 15+ Async Cookies](https://nextjs.org/docs/messages/sync-dynamic-apis)

## 总结

这个问题的核心是**三个不同层面的问题叠加**：
1. 🔑 客户端 SDK 不统一
2. ♾️ 数据库策略设计缺陷
3. 🆔 数据一致性问题

解决时需要**系统性排查**，从客户端到数据库逐层检查，不能只看表面错误。

---

**维护者**: Claude
**最后更新**: 2025-12-02
