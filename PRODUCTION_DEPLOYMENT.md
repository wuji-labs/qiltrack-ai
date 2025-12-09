# 生产环境部署清单

**部署日期**: 2025-12-09
**修复版本**: v1.1.0
**本次修复**: 报告生成 + 每日奖励功能

---

## ⚠️ 重要提醒

**在部署到生产环境前，必须先备份生产数据库！**

```bash
# 1. 备份生产数据库
node scripts/backup-production-db.js

# 2. 确认备份成功后再继续
```

---

## 📋 需要同步的内容

### 1️⃣ 数据库迁移（按顺序执行）

生产数据库需要运行以下迁移文件（如果还没有运行）：

| 序号 | 文件 | 说明 | 状态检查 |
|-----|------|------|---------|
| 1 | `20251207000000_clean_schema.sql` | 完整数据库架构重构 | **最关键** |
| 2 | `20251207100000_set_xiuluart_super_admin.sql` | 设置超级管理员（可选） | 生产环境跳过 |
| 3 | `20251207150000_migrate_annual_to_ultra.sql` | 迁移年费计划到ultra | 如果有年费用户需要 |
| 4 | `20251207160000_update_plan_constraint.sql` | 更新计划约束 | 必须 |
| 5 | `20251207170000_remove_enterprise_plan.sql` | 移除企业版计划 | 如果有企业版用户需要检查 |

**检查生产数据库是否已应用迁移**：

```sql
-- 在 Supabase Dashboard > SQL Editor 中运行
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

如果没有看到 `20251207000000` 等版本，需要应用迁移。

---

### 2️⃣ 代码修改（需要部署到生产）

| 文件 | 修改内容 | 重要性 |
|------|---------|-------|
| `lib/core/credits/manager.ts:96` | 修复积分扣除参数 `p_cost` → `p_amount` | 🔴 **必须** |
| `lib/core/reports/persistence.ts:75-121` | 修复数据库插入顺序 | 🔴 **必须** |
| `lib/core/reports/generator.ts:105` | 增加 maxTokens: 4096 → 16384 | 🔴 **必须** |
| `lib/services/llm.ts:155,209` | 增加默认 max_tokens | 🔴 **必须** |
| `app/api/report/daily-reward/status/route.ts:34` | 修复表名 `credit_transactions` → `report_credit_events` | 🔴 **必须** |

---

### 3️⃣ 环境变量配置

**⚠️ 生产环境 `.env.production` 需要确保**：

```bash
# LLM 配置 - OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your-production-key
OPENROUTER_MODEL=openai/gpt-5.1

# Supabase 云端配置（不是本地！）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...（你的生产环境 anon key）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...（你的生产环境 service role key）

# Helicone（如果生产环境支持，可以启用；否则注释掉）
# HELICONE_API_KEY=sk-helicone-xxx
# HELICONE_MODEL=gpt-5.1
```

---

## 🚀 部署步骤

### 步骤 1: 备份生产数据库 ⚠️

```bash
# 运行备份脚本
node scripts/backup-production-db.js

# 备份文件位置：backups/production-YYYYMMDD-HHMMSS.sql
# 确认备份成功后才能继续！
```

### 步骤 2: 检查生产数据库迁移状态

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的生产项目
3. 进入 **SQL Editor**
4. 运行以下查询：

```sql
-- 检查已应用的迁移
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;

-- 检查关键表是否存在
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'report_credit_events',  -- 新表名
    'daily_rewards',
    'report_credits',
    'report_runs',
    'report_posts'
  );

-- 检查关键函数是否存在
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'fn_consume_credit',
    'fn_claim_daily_reward'
  );
```

### 步骤 3: 应用数据库迁移（如果需要）

**方法 1: 使用 Supabase CLI（推荐）**

```bash
# 1. 登录 Supabase
npx supabase login

# 2. 链接到生产项目
npx supabase link --project-ref your-project-ref

# 3. 应用迁移（会自动跳过已应用的）
npx supabase db push

# 4. 验证迁移
npx supabase db diff
```

**方法 2: 手动在 Supabase Dashboard 执行**

1. 进入 **SQL Editor**
2. 依次运行每个迁移文件的内容（按文件名顺序）
3. **注意**: 跳过 `20251207100000_set_xiuluart_super_admin.sql`（这是本地测试用的）

### 步骤 4: 部署代码到生产环境

```bash
# 1. 提交所有代码修改
git add .
git commit -m "fix: 修复报告生成和每日奖励功能

- 增加 maxTokens 从 4096 到 16384
- 修复积分扣除参数名
- 修复数据库插入顺序
- 修复每日奖励表名不一致"

# 2. 推送到主分支（或你的生产分支）
git push origin main

# 3. 如果使用 Vercel/其他平台，会自动触发部署
# 如果是手动部署，运行：
npm run build
npm run start
```

### 步骤 5: 验证生产环境

部署完成后，测试以下功能：

#### 5.1 测试报告生成

1. 登录生产环境
2. 生成一个测试报告（如 TSLA）
3. 验证：
   - ✅ 报告生成成功（无"服务器内部错误"）
   - ✅ 报告内容完整（有第3-7章）
   - ✅ 积分正确扣除
   - ✅ 数据库记录正确保存

#### 5.2 测试每日奖励

1. 点击每日签到按钮
2. 验证：
   - ✅ 签到成功
   - ✅ 积分增加
   - ✅ 连续签到天数显示正确
   - ✅ 第二次点击提示"已领取"

#### 5.3 检查错误日志

```bash
# 如果使用 Vercel
vercel logs --prod

# 查看 Supabase 日志
# 在 Dashboard > Logs 中检查是否有错误
```

---

## 🔍 迁移验证 SQL

在生产数据库运行以下 SQL，确认所有内容正确：

```sql
-- 1. 检查 report_credit_events 表结构
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'report_credit_events';

-- 预期结果应包含:
-- id, user_id, event_type, delta, balance_after, reason, metadata, created_at

-- 2. 检查 fn_consume_credit 函数参数
SELECT
  routine_name,
  parameter_name,
  data_type
FROM information_schema.parameters
WHERE specific_name = 'fn_consume_credit';

-- 预期结果应包含:
-- p_user_id (uuid)
-- p_amount (integer)  ← 注意是 p_amount，不是 p_cost
-- p_symbol (text)
-- p_metadata (jsonb)

-- 3. 检查 fn_claim_daily_reward 函数
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'fn_claim_daily_reward';

-- 预期结果: 应该返回 1 行

-- 4. 测试每日奖励查询（用你的用户ID替换）
SELECT COUNT(*)
FROM report_credit_events
WHERE user_id = 'your-user-id'
  AND event_type = 'daily_reward'
  AND created_at >= CURRENT_DATE;

-- 预期结果: 如果今天已领取，返回 1；否则返回 0
```

---

## 🔄 回滚计划（如果出问题）

如果部署后发现严重问题：

### 代码回滚

```bash
# 1. 回滚到上一个版本
git revert HEAD
git push origin main

# 2. 如果使用 Vercel，也可以在 Dashboard 中直接回滚
```

### 数据库回滚

```bash
# 恢复备份（使用备份脚本生成的 .sql 文件）
node scripts/restore-production-db.js backups/production-20251209-120000.sql
```

---

## 📝 部署检查清单

在部署前，确认所有步骤：

- [ ] ✅ 已备份生产数据库
- [ ] ✅ 已检查生产数据库迁移状态
- [ ] ✅ 已应用所有必要的数据库迁移
- [ ] ✅ 已验证关键表和函数存在
- [ ] ✅ 已更新生产环境变量
- [ ] ✅ 已提交并推送代码修改
- [ ] ✅ 已验证代码部署成功
- [ ] ✅ 已测试报告生成功能
- [ ] ✅ 已测试每日奖励功能
- [ ] ✅ 已检查生产环境错误日志

---

## 📞 需要帮助？

如果部署过程中遇到问题：

1. **检查日志**: Supabase Dashboard > Logs
2. **检查环境变量**: 确保所有必需的环境变量都已设置
3. **验证迁移**: 运行上面的验证 SQL
4. **回滚**: 如果问题严重，先回滚再调查

---

**部署完成后，记得更新此文档的部署状态！**
