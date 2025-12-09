# 🚀 快速部署指南

**版本**: v1.1.0 (2025-12-09)
**修复**: 报告生成 + 每日奖励

---

## ⚡ 一键部署流程

### 前置条件

- [ ] 已有 `.env.production` 文件（包含生产环境配置）
- [ ] 已安装 Supabase CLI: `npm install -g supabase`
- [ ] 可以访问生产 Supabase 项目

---

### 步骤 1: 备份生产数据库 ⚠️

```bash
# 这一步非常重要！
node scripts/backup-production-db.js
```

等待备份完成，文件保存在 `backups/production-YYYYMMDD-HHMMSS.json`

---

### 步骤 2: 检查生产数据库迁移

```bash
# 登录 Supabase
npx supabase login

# 链接到生产项目
npx supabase link --project-ref <你的项目ID>

# 查看待应用的迁移
npx supabase db diff
```

如果有待应用的迁移，运行：

```bash
# 应用所有迁移
npx supabase db push
```

---

### 步骤 3: 部署代码

```bash
# 1. 提交修改
git add .
git commit -m "fix: 修复报告生成和每日奖励功能"

# 2. 推送到生产分支
git push origin main

# 如果使用 Vercel，会自动部署
# 否则手动部署：
npm run build
npm run start
```

---

### 步骤 4: 验证部署

1. **测试报告生成**
   - 访问生产网站
   - 生成一份测试报告
   - 确认报告完整（有第3-7章）

2. **测试每日奖励**
   - 点击签到按钮
   - 确认积分增加
   - 确认无错误日志

3. **检查日志**
   ```bash
   # Vercel 日志
   vercel logs --prod

   # 或在 Supabase Dashboard > Logs 查看
   ```

---

## 🔧 关键修改汇总

| 文件 | 修改 |
|------|------|
| `lib/core/reports/generator.ts:105` | maxTokens: 16384 |
| `lib/services/llm.ts:155,209` | max_tokens: 16384 |
| `lib/core/credits/manager.ts:96` | p_cost → p_amount |
| `lib/core/reports/persistence.ts` | 交换插入顺序 |
| `app/api/report/daily-reward/status/route.ts:34` | 表名修复 |

---

## 📋 验证清单

部署后运行以下 SQL 验证：

```sql
-- 1. 检查关键表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('report_credit_events', 'daily_rewards');

-- 2. 检查关键函数
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('fn_consume_credit', 'fn_claim_daily_reward');

-- 3. 测试每日奖励查询
SELECT COUNT(*)
FROM report_credit_events
WHERE event_type = 'daily_reward'
  AND created_at >= CURRENT_DATE;
```

---

## ⚠️ 如果出错

### 代码回滚

```bash
git revert HEAD
git push origin main
```

### 数据库回滚

```bash
node scripts/restore-production-db.js backups/production-YYYYMMDD-HHMMSS.json
```

---

## 📞 问题排查

### 报告生成失败

1. 检查 OpenRouter API Key 是否有效
2. 检查 `maxTokens` 是否已更新到 16384
3. 查看 Supabase 日志中的错误

### 每日奖励不工作

1. 确认 `report_credit_events` 表存在
2. 确认 `fn_claim_daily_reward` 函数存在
3. 检查前端代码是否使用了正确的表名

### 积分扣除失败

1. 确认 `fn_consume_credit` 函数参数是 `p_amount`（不是 `p_cost`）
2. 检查 `lib/core/credits/manager.ts:96` 是否已修复

---

**完整文档**: 查看 `PRODUCTION_DEPLOYMENT.md`
