# 🎯 积分系统完整修复方案总结

## 现状诊断 ⚠️

你发现的问题完全正确：

| 现象 | 原因 | 严重性 |
|------|------|--------|
| 首页显示 0 积分 | report_credits 表未初始化 | 🔴 高 |
| 账号页面显示 1 | 可能有默认值或兜底逻辑 | 🟡 中 |
| 应该是 30 但只有 5 | 旧迁移默认值过小 | 🔴 高 |
| 无法主动获取积分 | 没有日常奖励机制 | 🟡 中 |

## 解决方案 ✅

### 核心改动

**1. 数据库层 - 新迁移文件**
```
supabase/migrations/20251130000001_init_user_credits_30.sql
```

做了什么：
- ✅ 修改 `profiles.quota_limit` 默认值: 1 → **30**
- ✅ 初始化所有现存用户为 30 积分
- ✅ 更新新用户注册触发器: 自动创建 30 积分
- ✅ 更新 `fn_initialize_profile`: 注册时原子初始化
- ✅ 新增 `daily_rewards` 表: 记录每日领取状态
- ✅ 新增 `fn_claim_daily_reward` 函数: 每日 +10 积分

**2. API 层 - 新端点**
```
app/api/report/daily-reward/route.ts
```

做了什么：
- ✅ POST 端点，需认证
- ✅ 调用数据库 RPC 函数
- ✅ 返回 { success, message, remainingCredits }

**3. 前端服务层 - API 客户端**
```
lib/services/api.ts
```

做了什么：
- ✅ 添加 `claimDailyReward()` 函数
- ✅ 添加 `DailyRewardResponse` 类型定义

### 待完成项

**还需要你做的**（5-10 分钟）：

1. **应用数据库迁移**
   - 复制 SQL 到 Supabase 控制台执行
   - 或运行 `supabase migration up`

2. **前端集成**（可选，但强烈建议）
   - 在首页添加"领取每日奖励"按钮
   - 在账号页面显示领取状态
   - 添加多语言文本

## 🚀 执行步骤

### 第 1 步：应用迁移（必做，3 分钟）

**使用 Supabase 控制台：**
1. 登录 Supabase 仪表盘
2. SQL Editor
3. 打开并复制：`supabase/migrations/20251130000001_init_user_credits_30.sql` 全部内容
4. 粘贴并执行

**结果**：新用户自动获得 30 积分 ✅

### 第 2 步：验证迁移（1 分钟）

在 SQL Editor 执行：
```sql
-- 验证 profiles 默认值
SELECT column_default FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'quota_limit';
-- 应显示: 30

-- 验证函数存在
SELECT proname FROM pg_proc WHERE proname = 'fn_claim_daily_reward';
-- 应显示: fn_claim_daily_reward
```

### 第 3 步：测试新账号（可选，2 分钟）

1. 用新邮箱注册
2. 完成邮箱验证或 Google OAuth
3. 进入个人设置页面
4. 验证显示 **30 积分** ✅

### 第 4 步：测试 API（可选，2 分钟）

登录后，在浏览器控制台执行：
```javascript
fetch('/api/report/daily-reward', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log(d));

// 预期: { success: true, message: "Daily reward claimed", remainingCredits: 40 }
```

### 第 5 步：前端集成（可选，10 分钟）

编辑 `app/page.tsx`，添加"领取每日奖励"按钮
- 参考: `docs/CREDITS_SYSTEM_QUICK_FIX.md` 的完整代码

编辑 `lib/i18n.tsx`，添加翻译
- 参考: `docs/CREDITS_SYSTEM_QUICK_FIX.md` 的翻译表

## 📋 技术细节

### 积分流向

```
用户注册
  ↓
fn_initialize_profile 自动调用
  ├─ 创建 profiles (quota_limit=30)
  ├─ 创建 report_credits (credits_available=30)
  └─ 插入事件日志

用户每日可以：
  ↓
点击"领取 10 积分"
  ↓
POST /api/report/daily-reward
  ↓
fn_claim_daily_reward 检查：
  ├─ 今天已领？ → 返回错误
  └─ 未领 → +10 积分 + 更新 streak

用户生成报告：
  ↓
POST /api/report?symbol=NVDA
  ↓
fn_consume_report_credit 扣除 1 积分
```

### 数据一致性保证

- ✅ **原子性**：所有操作通过 RLS 和行级锁保证
- ✅ **幂等性**：同一用户同一天无法重复领取
- ✅ **审计性**：每次操作都记录到 report_credit_events
- ✅ **安全性**：RLS 确保用户只能看/修改自己的数据

## 🎯 预期效果

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 新账号首页显示 | 0 | **30** ✅ |
| 新账号账号页面 | 1 | **30** ✅ |
| 初始配额 | 5 | **30** ✅ |
| 每日可领取 | 无 | **10** ✅ |
| 首页-账号页一致性 | ❌ | **✅** |
| 用户活跃度 | 低 | 高（每日签到） |

## 📚 相关文档

| 文档 | 内容 | 用途 |
|------|------|------|
| `CREDITS_SYSTEM_QUICK_FIX.md` | 5 分钟快速指南 | 立即执行 |
| `2025-11-30-credits-system-solution.md` | 完整设计文档 | 深入理解 |
| `supabase/migrations/20251130000001_init_user_credits_30.sql` | 数据库迁移 | 应用修改 |
| `app/api/report/daily-reward/route.ts` | API 实现 | 参考代码 |

## ❓ 常见问题

**Q: 为什么我的账号还是显示 1？**
A: 迁移还未应用。请先执行第 1 步。迁移后所有账号（含旧账号）都会补充到 30 积分。

**Q: 什么时候新账号会自动获得 30 积分？**
A: 注册并完成邮箱验证或 Google OAuth 后，立即自动创建。不需要额外操作。

**Q: 能否让用户一次性领取 30 积分？**
A: 可以，修改迁移中的 `fn_claim_daily_reward` 函数，改成：
```sql
UPDATE report_credits
SET credits_available = credits_available + 30  -- 改成 30
```

**Q: 如何追踪积分变动历史？**
A: 查询 `report_credit_events` 表：
```sql
SELECT * FROM report_credit_events
WHERE user_id = 'user-id'
ORDER BY created_at DESC;
```

**Q: 是否可以在某个时间段关闭每日奖励？**
A: 可以，在 API 端点添加条件检查：
```typescript
if (new Date().getHours() < 8 || new Date().getHours() > 22) {
  return NextResponse.json({ error: "Reward only available 8:00-22:00" });
}
```

## ⚠️ 注意事项

1. **备份很重要**：执行迁移前，备份 Supabase 数据
2. **影响现有用户**：迁移不会删除现有数据，仅补充
3. **前端集成可选**：迁移独立工作，前端集成是为了用户体验
4. **测试充分**：建议先在开发环境测试，再上生产

## 🎓 学到的教训

这个问题的根本原因是：
1. **多个数据源不同步**：首页读 report_credits，账号页可能读 profiles.quota_limit
2. **初始化时机不对**：新用户注册时没有及时创建 report_credits 记录
3. **默认值设计不当**：5 太小，用户体验差

**最佳实践**：
- ✅ 使用单一真实源（report_credits）
- ✅ 在认证回调时立即初始化
- ✅ 充分的默认值（30）
- ✅ 完整的审计日志

---

## 📞 需要帮助？

- 如果迁移失败：检查 SQL 语法和权限
- 如果新账号还是 0：确认迁移已应用并重新登录
- 如果 API 返回 500：检查服务器日志和 RLS 策略
- 如果前端集成有问题：参考代码示例和 TypeScript 类型提示

**预计总时间**: 5 分钟（迁移）+ 10 分钟（前端，可选）
**难度级别**: ⭐⭐ 中等
**风险评级**: 🟢 低（所有操作幂等且带保护）

祝修复顺利！🚀
