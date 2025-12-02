# 管理员账户配置

## 概述
本文档记录了如何在 Investor AI 系统中配置管理员账户。

## 当前管理员账户

1. **xiuluart@foxmail.com** ✅ 已配置
   - 状态：已激活
   - 角色：admin
   - 计划：annual
   - 配置时间：2025-12-02

2. **xiuluart@icloud.com** ⏳ 待注册
   - 状态：等待用户首次登录
   - 注册后将自动设置为管理员

## 系统架构

系统使用 Supabase 数据库的 `profiles` 表来管理用户角色：

- **role 字段**：可选值为 `'admin'`、`'editor'`、`'user'`（默认）
- **权限检查**：通过 `app/api/_utils/supabase.ts` 中的 `isAdmin()` 和 `isAdminOrEditor()` 函数
- **RLS 策略**：管理员可以查看和管理所有用户数据

## 相关文件

### 数据库 Migration
- `supabase/migrations/20251202100000_admin_view_all_users.sql` - 添加 role 字段和 RLS 策略
- `supabase/migrations/20251202120000_add_admin_foxmail.sql` - 设置管理员账户

### 脚本工具
- `scripts/set-admin.js` - 设置指定邮箱为管理员
- `scripts/verify-admins.js` - 验证所有管理员账户
- `scripts/check-icloud-admin.js` - 检查并设置 iCloud 账户为管理员

## 如何添加新管理员

### 方法 1：使用脚本（推荐）
```bash
# 修改 scripts/set-admin.js 中的邮箱地址
node scripts/set-admin.js

# 验证结果
node scripts/verify-admins.js
```

### 方法 2：通过 Migration
1. 创建新的 migration 文件
2. 添加 UPDATE 语句：
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'new-admin@example.com';
```

### 方法 3：直接在 Supabase Dashboard
1. 打开 Supabase Dashboard
2. 进入 Table Editor → profiles
3. 找到目标用户并将 role 字段设置为 'admin'

## 管理员权限

管理员账户拥有以下权限：
- ✅ 查看所有用户的 profiles
- ✅ 查看所有用户的 report_credits
- ✅ 查看所有用户的 report_runs
- ✅ 查看所有用户的 credit_events
- ✅ 更新任何用户的 profile
- ✅ 删除用户账户
- ✅ 授予积分（通过 fn_grant_credits 函数）

## 安全注意事项

1. **授权检查**：所有管理员操作都需要通过 `isAdmin()` 函数验证
2. **RLS 策略**：数据库层面也有相应的 RLS 策略保护
3. **审计日志**：所有管理员操作都会记录在 `audit_logs` 表中
4. **Service Role Key**：敏感操作使用 Service Role Key，需妥善保管

## 环境变量

以下环境变量用于 Supabase 连接：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://inmtounwqcjwsxkfnsfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

## 测试

运行以下脚本验证管理员配置：
```bash
# 验证所有管理员
node scripts/verify-admins.js

# 检查特定用户
node scripts/check-icloud-admin.js
```

## 更新历史

- 2025-12-02：添加 xiuluart@foxmail.com 为管理员
- 2025-12-02：准备 xiuluart@icloud.com 管理员配置（待用户注册）
