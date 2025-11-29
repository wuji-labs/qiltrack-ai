# 📋 积分系统修复 - 快速参考

## ⚡ 5 分钟快速开始

### 1️⃣ 应用迁移 (3 分钟)

```
1. 打开 https://supabase.com/dashboard
2. 选择项目 → SQL Editor → New Query
3. 打开文件: supabase/migrations/20251130000001_init_user_credits_30.sql
4. 复制全部内容 → 粘贴 → Run
5. 等待 "Query successful" ✅
```

### 2️⃣ 验证迁移 (1 分钟)

在 SQL Editor 运行:
```sql
SELECT column_default FROM information_schema.columns WHERE table_name='profiles' AND column_name='quota_limit';
-- 应该显示: 30 ✅
```

### 3️⃣ 测试新账号 (1 分钟)

```
1. 无痕浏览器打开 http://localhost:3001/
2. 用新邮箱注册
3. 验证首页显示 30 积分 ✅
```

---

## 📝 关键文件位置

| 用途 | 文件 | 说明 |
|------|------|------|
| **实施步骤** | `docs/IMPLEMENTATION_CHECKLIST.md` | 👈 从这里开始 |
| 技术详情 | `docs/TECHNICAL_SUMMARY.md` | 代码和架构 |
| 数据库迁移 | `supabase/migrations/20251130000001_init_user_credits_30.sql` | 核心修改 |
| 每日奖励 API | `app/api/report/daily-reward/route.ts` | 新端点 |
| 前端服务 | `lib/services/api.ts` | claimDailyReward() 函数 |

---

## 🎯 成功标志

✅ 新账号首页显示 **30 积分**（不是 0 或 1）
✅ 新账号账号页显示 **30 积分**（一致）
✅ 可以调用 `/api/report/daily-reward` 获得 +10 积分
✅ 已有账号（如 xiuluart@foxmail.com）不再显示 0 积分

---

## 🚨 常见问题

**Q: 迁移执行失败怎么办？**
A: 检查是否已执行过。错误如 "already exists" 是正常的，继续测试。

**Q: 新账号还是显示 0？**
A: 确认迁移已执行。清除缓存，用新邮箱重新注册。

**Q: 看不到"领取"按钮？**
A: 按钮是可选的，API 已经工作。可以直接在控制台测试：
```javascript
fetch('/api/report/daily-reward', {method:'POST'}).then(r=>r.json()).then(d=>console.log(d))
```

---

## 📞 快速诊断

### 检查迁移是否应用

```sql
SELECT table_name FROM information_schema.tables WHERE table_name='daily_rewards';
-- 如果有结果 → ✅ 已应用
-- 如果无结果 → ❌ 未应用，重新执行迁移
```

### 检查函数是否存在

```sql
SELECT proname FROM pg_proc WHERE proname='fn_claim_daily_reward';
-- 有结果 → ✅
```

### 检查用户积分

```sql
SELECT credits_available FROM report_credits WHERE user_id='xxx';
-- 应该显示 30 或更多
```

---

## 🔍 完整实施流程

**预计时间**: 15 分钟
**难度**: ⭐⭐ 中等
**风险**: 🟢 低

**立即开始**: 打开 `docs/IMPLEMENTATION_CHECKLIST.md` 👈

---
