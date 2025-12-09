# 数据库管理规范指南

**创建时间:** 2025-12-10
**目标受众:** 所有开发者和 AI 助手
**重要性:** ⭐⭐⭐⭐⭐ 必读

## ⚠️ 核心原则

**请务必记住：`supabase db reset` 会删除所有用户数据！**

在大多数情况下，你应该使用 `supabase db push` 而不是 `supabase db reset`。

---

## 📋 目录

1. [命令对比](#命令对比)
2. [何时使用 db push](#何时使用-db-push)
3. [何时使用 db reset](#何时使用-db-reset)
4. [迁移工作流](#迁移工作流)
5. [测试数据管理](#测试数据管理)
6. [云端数据库同步](#云端数据库同步)
7. [故障排查](#故障排查)

---

## 命令对比

| 命令 | 影响范围 | 是否删除数据 | 使用场景 |
|------|---------|------------|---------|
| `supabase db push` | 仅应用新的迁移文件 | ❌ 不删除 | ✅ **日常开发推荐** |
| `supabase db reset` | 完全重建数据库 | ⚠️ **删除所有数据** | 仅在特殊情况使用 |
| `supabase migration new` | 创建新迁移文件 | ❌ 不影响 | 修改数据库结构时 |
| `supabase migration repair` | 修复迁移历史 | ❌ 不影响 | 解决迁移冲突 |

---

## 何时使用 db push

✅ **推荐使用场景（95%的情况）：**

1. **添加新的数据库迁移**
   ```bash
   # 创建新迁移
   supabase migration new add_user_avatar_field

   # 编辑 SQL 文件
   # supabase/migrations/20251210_add_user_avatar_field.sql

   # 应用到本地数据库（不删除现有数据）
   supabase db push
   ```

2. **同步本地迁移到云端**
   ```bash
   # 推送到云端生产数据库
   supabase db push --linked
   ```

3. **应用别人创建的新迁移**
   ```bash
   # 拉取最新代码后
   git pull origin develop

   # 应用新迁移（保留现有数据）
   supabase db push
   ```

**优点：**
- ✅ 保留所有用户账号
- ✅ 保留所有业务数据
- ✅ 只应用新的更改
- ✅ 更快的执行速度
- ✅ 更安全

---

## 何时使用 db reset

⚠️ **仅在以下特殊情况使用：**

1. **迁移文件严重冲突**
   ```bash
   # 示例：本地和远程迁移历史不一致，无法用 repair 解决
   supabase db reset
   ```

2. **数据库结构完全损坏**
   ```bash
   # 示例：手动修改导致表结构错误
   supabase db reset
   ```

3. **需要完全清空测试数据**
   ```bash
   # 示例：积累了大量测试数据，想要干净的环境
   supabase db reset
   ```

**缺点：**
- ⚠️ **删除所有用户账号**
- ⚠️ **删除所有业务数据**
- ⚠️ 需要重新注册账号
- ⚠️ 需要重新生成测试数据

**使用后的恢复步骤：**

```bash
# 1. Reset 后会自动执行 seed.sql
supabase db reset

# 2. 验证测试账号已创建
# 访问 http://127.0.0.1:54323 (Supabase Studio)
# 查看 auth.users 表

# 3. 使用测试账号登录
# 邮箱: test@qiltrack.com
# 密码: Test123456!
```

---

## 迁移工作流

### 标准流程

```bash
# 1. 创建新迁移
supabase migration new create_user_uploads_bucket

# 2. 编辑 SQL 文件
# supabase/migrations/20251210_create_user_uploads_bucket.sql

# 3. 应用到本地（保留数据）
supabase db push

# 4. 测试功能
npm run dev
# 测试头像上传等功能

# 5. 生成 TypeScript 类型
supabase gen types typescript --local --schema public > types/database.ts

# 6. 提交代码
git add supabase/migrations/20251210_create_user_uploads_bucket.sql
git add types/database.ts
git commit -m "feat: add user uploads bucket"

# 7. 推送到远程
git push origin g3/develop

# 8. 同步到云端数据库
supabase db push --linked
```

### 处理迁移冲突

如果遇到本地和远程迁移不一致：

```bash
# 1. 查看迁移状态
supabase migration list

# 输出示例：
# Local          | Remote         | Time (UTC)
# ---------------|----------------|---------------------
# 20251207000000 | 20251207000000 | 2025-12-07 00:00:00
#                | 20251209200000 | 2025-12-09 20:00:00  ← 远程多了这个
# 20251209201736 | 20251209201736 | 2025-12-09 20:17:36

# 2. 将远程多余的迁移标记为 reverted
supabase migration repair --status reverted 20251209200000

# 3. 应用本地迁移
supabase db push

# 4. 重新标记为 applied（如果需要）
supabase migration repair --status applied 20251209200000
```

---

## 测试数据管理

### seed.sql 文件

项目中的 `supabase/seed.sql` 文件会在每次 `db reset` 后自动执行。

**当前配置的测试账号：**

| 邮箱 | 密码 | 角色 | 套餐 | 积分 |
|------|------|------|------|------|
| test@qiltrack.com | Test123456! | user | free | 30 |
| dev@qiltrack.com | Test123456! | developer | pro | 100 |

**修改测试数据：**

```bash
# 1. 编辑 seed.sql 文件
code supabase/seed.sql

# 2. 添加更多测试用户或数据

# 3. 重新应用（注意：会删除现有数据）
supabase db reset

# 4. 验证
# 访问 Supabase Studio 查看数据
```

---

## 云端数据库同步

### 连接到云端项目

```bash
# 1. 首次连接（仅需一次）
supabase link --project-ref inmtounwqcjwsxkfnsfd

# 2. 验证连接
supabase projects list
# 输出应显示：
# LINKED | ORG ID | REFERENCE ID         | NAME       | REGION
# ●      | ...    | inmtounwqcjwsxkfnsfd | iltrack-ai | East US
```

### 推送迁移到云端

```bash
# 方法 1：推送所有未应用的迁移
supabase db push --linked

# 方法 2：推送特定迁移（使用 migration repair）
supabase migration repair --status reverted 20251209201736
supabase db push --linked
supabase migration repair --status applied 20251209201736
```

### ⚠️ 云端数据库注意事项

1. **永远不要在云端使用 `db reset`**
   - 会删除所有生产用户数据！
   - 无法恢复！

2. **推送前先在本地测试**
   ```bash
   # 本地测试
   supabase db push
   npm run dev
   # 测试功能

   # 确认无问题后再推送到云端
   supabase db push --linked
   ```

3. **禁止在 Supabase Dashboard 直接修改 schema**
   - 所有 schema 更改必须通过迁移文件
   - 保持代码和数据库的一致性

---

## 故障排查

### 问题 1：用户数据丢失

**症状：** 每次运行数据库命令后，需要重新注册账号

**原因：** 错误使用了 `supabase db reset`

**解决方案：**
```bash
# 1. 以后使用 db push 代替 db reset
supabase db push

# 2. 如果已经 reset，使用测试账号
# test@qiltrack.com / Test123456!

# 3. 或者注册新账号（会自动获得 30 积分）
```

### 问题 2：迁移历史不匹配

**症状：**
```
Remote migration versions not found in local migrations directory.
```

**解决方案：**
```bash
# 1. 查看差异
supabase migration list

# 2. 标记远程多余的迁移为 reverted
supabase migration repair --status reverted <timestamp>

# 3. 推送本地迁移
supabase db push
```

### 问题 3：存储桶未创建

**症状：** 头像上传失败，Storage 404

**解决方案：**
```bash
# 1. 检查迁移文件是否存在
ls supabase/migrations/*user_uploads*

# 2. 应用迁移
supabase db push

# 3. 验证存储桶已创建
docker exec supabase_db_qiltrack-ai psql -U postgres -d postgres \
  -c "SELECT id, name, public FROM storage.buckets WHERE id = 'user-uploads';"

# 4. 如果需要，推送到云端
supabase db push --linked
```

### 问题 4：类型文件过时

**症状：** TypeScript 报错，找不到新增的字段

**解决方案：**
```bash
# 重新生成类型文件
supabase gen types typescript --local --schema public > types/database.ts

# 或者针对云端数据库
supabase gen types typescript --linked --schema public > types/database.ts
```

### 问题 5：注册功能失败 - "登录暂不可用"

**症状：**
- 用户注册时显示"登录暂不可用，请稍后再试"
- Auth 日志显示：`ERROR: function public.fn_initialize_profile(...) is not unique`

**原因：** 多个 worktree 创建了不同版本的 `fn_initialize_profile` 函数，数据库无法确定调用哪个

**解决方案：**
```bash
# 1. 检查是否有重复函数
docker exec supabase_db_qiltrack-ai psql -U postgres -d postgres \
  -c "SELECT proname, pronargs FROM pg_proc WHERE proname = 'fn_initialize_profile';"

# 2. 如果显示多个结果，删除旧版本
docker exec supabase_db_qiltrack-ai psql -U postgres -d postgres \
  -c "DROP FUNCTION IF EXISTS public.fn_initialize_profile(uuid, text, text);"

# 3. 重启 Supabase 服务
supabase stop && supabase start

# 4. 应用修复迁移（如果存在）
supabase db push --include-all

# 5. 测试注册功能
```

**预防措施：**
- 在创建新函数前，先同步最新代码：`git pull origin develop`
- 使用 `CREATE OR REPLACE FUNCTION` 而不是 `CREATE FUNCTION`
- 在 PR 中明确标注新增或修改的数据库函数

---

## 📚 相关文档

- [Supabase CLI 本地开发手册](./supabase-local-cli.md)
- [Supabase Bucket 设置指南](../setup/supabase-bucket-setup-guide.md)

---

## ✅ 快速检查清单

使用此清单确保你遵循了最佳实践：

- [ ] 优先使用 `supabase db push` 而不是 `db reset`
- [ ] 创建新迁移时使用 `supabase migration new`
- [ ] 应用迁移后重新生成 TypeScript 类型
- [ ] 推送到云端前先在本地测试
- [ ] 所有 schema 更改通过迁移文件而不是 Dashboard
- [ ] 了解测试账号信息（test@qiltrack.com / Test123456!）
- [ ] 提交代码时包含迁移文件和类型文件

---

## 🆘 需要帮助？

如果遇到问题：

1. 查看本文档的[故障排查](#故障排查)部分
2. 查看 [Supabase CLI 本地开发手册](./supabase-local-cli.md)
3. 在项目 Issue 中描述问题并 @mention 相关开发者

---

**记住：保护用户数据是第一优先级。当不确定时，使用 `db push` 而不是 `db reset`。**
