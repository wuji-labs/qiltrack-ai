# G2 任务 2.1 进度报告:数据库类型同步问题

**日期**: 2025-12-02
**任务**: G2-2.1 - 同步数据库类型定义
**优先级**: P0 (最高)
**状态**: 🔴 阻塞 - 需要HQ批准执行生产数据库迁移

---

## 问题发现

通过脚本 `scripts/check-schema.mjs` 检查发现:

```
Profiles table fields:
[
  'avatar_url', 'created_at', 'display_name', 'email', 'id',
  'last_report_at', 'name', 'plan',
  'quota_limit',      ← ❌ 应该已被删除
  'reports_used',     ← ❌ 应该已被删除
  'role', 'stripe_customer_id', 'stripe_subscription_id', 'updated_at'
]
```

**根本原因**: 迁移文件 `20251201000000_unify_credits_system.sql` **尚未应用到生产数据库**。

---

## 影响范围

### 1. 当前代码仍在使用旧字段

**受影响文件**:
- `app/api/admin/users/create/route.ts` (第19, 63, 74行)
- `app/api/admin/users/update/route.ts` (第18, 35行)
- `app/admin/users/page.tsx` (第16, 53行)

### 2. 类型定义与架构不一致

- 架构文档 `ARCHITECTURE.md` 声称字段已删除
- 生成的 `types/database.ts` 仍包含这些字段(因为数据库实际有)
- 导致新代码可能引用已"废弃"的字段

---

## 验证结果

✅ **安全性检查通过**:
```
Profiles count: 2
Credits count: 2
✅ All users have credit records - safe to proceed with migration
```

所有用户都已有 `report_credits` 记录,可以安全删除 `profiles` 表的旧字段。

---

## 解决方案

### 方案 A: 手动执行SQL (推荐)

1. 在 Supabase Dashboard SQL Editor 执行:
   ```sql
   -- 脚本路径: scripts/manual-migration-remove-quota-fields.sql
   ALTER TABLE public.profiles DROP COLUMN IF EXISTS quota_limit;
   ALTER TABLE public.profiles DROP COLUMN IF EXISTS reports_used;
   ```

2. 重新生成类型:
   ```bash
   npx supabase gen types typescript --linked --schema public > types/database.ts
   ```

3. 修复3个文件中的旧字段引用

### 方案 B: 通过Supabase CLI

```bash
# 需要先修复迁移历史冲突
npx supabase migration repair --status applied 20251129000005
npx supabase db push --linked
```

---

## 推荐行动

**建议采用方案 A**(手动SQL),因为:
- ✅ 更可控,不依赖CLI迁移历史状态
- ✅ 可以在Dashboard实时查看执行结果
- ✅ 避免修复迁移历史表的复杂性

**请HQ决策**:
1. 是否批准执行生产数据库删除列操作?
2. 是否需要先备份数据库?
3. 是否允许 G2 直接执行,还是由HQ执行?

---

## 后续步骤 (批准后)

1. ✅ 执行SQL删除列
2. ✅ 重新生成类型定义
3. ✅ 修复3个文件的代码引用:
   - 删除 `quota_limit` 参数
   - 改用 `report_credits` 表查询/更新
4. ✅ 提交 PR: `[G2/Phase1] Fix: Sync database types - remove legacy quota fields`
5. ✅ 更新迁移状态文档

---

## 需要的信息

- [ ] HQ批准执行迁移
- [ ] 确认是否需要数据库备份(当前用户数:2,数据量很小)
- [ ] 确认执行时间窗口

**预计完成时间**: 批准后 30分钟内完成

---

**G2-Claude 等待指示中...**
