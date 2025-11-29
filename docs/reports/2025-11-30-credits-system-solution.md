# 积分系统完整解决方案 (2025-11-30)

## 🎯 问题总结

1. **新用户显示 0 积分** - 首页配额显示为 0，但账号页面显示 1
2. **初始积分不足** - 应该是 30，但系统默认只有 5
3. **没有每日领取机制** - 用户无法主动获取积分

## ✅ 解决方案已实施

### 1️⃣ 数据库层修改

**文件**: `supabase/migrations/20251130000001_init_user_credits_30.sql`

- ✅ 更新 `profiles.quota_limit` 默认值: 1 → **30**
- ✅ 初始化所有现存用户: 30 积分
- ✅ 更新触发器: 新用户自动初始化 30 积分
- ✅ 更新 `fn_initialize_profile`: 注册时创建 30 积分 + 事件记录
- ✅ 新增 `daily_rewards` 表: 记录每日领取状态
- ✅ 新增 `fn_claim_daily_reward` 函数: 每日领取 10 积分

**核心逻辑**:
```sql
-- 新用户注册时自动获得 30 积分
INSERT INTO report_credits (user_id, credits_available, credits_used)
VALUES (p_user_id, 30, 0);

-- 用户每天可领取 10 积分（只能领一次）
UPDATE report_credits
SET credits_available = credits_available + 10
WHERE user_id = p_user_id AND NOT already_claimed_today;
```

### 2️⃣ API 端点新增

**文件**: `app/api/report/daily-reward/route.ts`

```
POST /api/report/daily-reward
```

- 认证: 需要登录
- 返回: `{ success, message, remainingCredits }`
- 错误处理: 返回 401 (未登录) 或 500 (系统错误)

### 3️⃣ 前端 API 服务更新

**文件**: `lib/services/api.ts`

新增函数:
```typescript
export async function claimDailyReward(): Promise<DailyRewardResponse>;
```

类型更新:
```typescript
type DailyRewardResponse = {
  success: boolean;
  message: string;
  remainingCredits: number;
};
```

## 🔍 关键代码位置

### 触发器与初始化

| 文件 | 行号 | 功能 |
|------|------|------|
| 新迁移 | 24-37 | 注册时触发器 - 初始化 30 积分 |
| 新迁移 | 40-55 | fn_initialize_profile - 创建 profile + credits |
| 回调处理 | api/auth/callback/route.ts | 调用 fn_initialize_profile |

### 每日奖励流程

| 步骤 | 代码位置 | 描述 |
|------|---------|------|
| 1 | app/api/report/daily-reward/route.ts | API 端点 |
| 2 | 新迁移 68-130 | fn_claim_daily_reward 函数 |
| 3 | lib/services/api.ts | claimDailyReward() 调用 |
| 4 | app/account/page.tsx | 前端 UI（待添加按钮） |

## 🚀 前端集成步骤（待完成）

### 1. 首页配额卡片添加"领取每日奖励"按钮

**文件**: `app/page.tsx`

```typescript
const handleClaimDailyReward = async () => {
  try {
    const result = await claimDailyReward();
    if (result.success) {
      // 刷新配额显示
      await refreshQuota();
      alert(t('quota.daily.claimed')); // 需要添加翻译
    } else {
      alert(result.message); // "Already claimed today" 或其他错误
    }
  } catch (err) {
    alert(t('quota.daily.error'));
  }
};
```

### 2. 账号页面显示领取状态

**文件**: `app/account/page.tsx`

```typescript
// 显示今日是否已领取
const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

// 添加按钮状态
<button
  disabled={dailyRewardClaimed}
  onClick={handleClaimDailyReward}
>
  {dailyRewardClaimed ? t('quota.daily.claimed') : t('quota.daily.claim')}
</button>
```

### 3. 添加国际化文本

**文件**: `lib/i18n.tsx`

```typescript
"quota.daily.claim": {
  "en": "Claim 10 credits",
  "zh-Hans": "领取 10 积分"
},
"quota.daily.claimed": {
  "en": "Already claimed today",
  "zh-Hans": "今日已领取"
},
"quota.daily.error": {
  "en": "Failed to claim daily reward",
  "zh-Hans": "领取每日奖励失败"
}
```

## 📊 积分流动示意

```
新用户注册
    ↓
/api/auth/callback 调用 fn_initialize_profile
    ↓
├─ 创建 profiles 记录 (quota_limit=30)
├─ 创建 report_credits 记录 (credits_available=30)
└─ 记录事件 (event_type='granted', amount=30)

用户每天可以：
    ↓
点击"领取每日奖励"按钮
    ↓
POST /api/report/daily-reward
    ↓
fn_claim_daily_reward 检查：
├─ 今天已领过吗？→ 是：返回错误
└─ 没有：+10 积分，记录 streak

用户生成报告：
    ↓
POST /api/report?symbol=NVDA&...
    ↓
fn_consume_report_credit 扣除 1 积分
```

## 🔧 部署检查表

- [ ] 运行迁移: `supabase migration up` 或直接在 Supabase 控制台执行 SQL
- [ ] 验证表结构: 检查 `report_credits` 和 `daily_rewards` 表
- [ ] 测试 API:
  - `GET /api/report/credits` → 返回 30 积分
  - `POST /api/report/daily-reward` → 返回成功并 +10 积分
  - 再次调用 → 返回 "Already claimed today"
- [ ] 测试注册流程: 新账号注册后自动获得 30 积分
- [ ] 前端集成: 添加"领取每日奖励"按钮和 UI

## ⚡ 快速测试

### 本地测试 (如果用 Supabase CLI)

```bash
# 1. 应用迁移
supabase migration list
supabase migration up

# 2. 测试 RPC 函数
curl -X POST https://your-supabase-url/rest/v1/rpc/fn_claim_daily_reward \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id":"user-id-here"}'

# 3. 检查结果
select * from report_credits where user_id = 'user-id-here';
select * from daily_rewards where user_id = 'user-id-here';
select * from report_credit_events where user_id = 'user-id-here';
```

### 云端测试

1. 登录 Supabase 控制台
2. SQL Editor → 执行新迁移
3. 创建新账号 → 检查 `report_credits` 是否初始化为 30
4. 调用 `POST /api/report/daily-reward` → 检查是否 +10 积分

## 📝 文件清单

### 已创建/修改
- ✅ `supabase/migrations/20251130000001_init_user_credits_30.sql` - 数据库迁移
- ✅ `app/api/report/daily-reward/route.ts` - API 端点
- ✅ `lib/services/api.ts` - 前端 API 服务

### 待完成
- 🔄 `app/page.tsx` - 添加每日奖励按钮
- 🔄 `app/account/page.tsx` - 显示领取状态
- 🔄 `lib/i18n.tsx` - 添加多语言文本

## 🎓 系统设计说明

### 为什么选择这个方案？

1. **原子性**: 所有操作在数据库层通过 RPC 函数保证原子性
2. **幂等性**: 同一用户同一天无法重复领取（通过 `last_claimed` 检查）
3. **审计性**: 每次领取都记录到 `report_credit_events`
4. **扩展性**: 将来可以轻松添加其他事件类型（签到、任务完成等）

### 数据一致性保证

- `report_credits.credits_available` 是唯一的源数据
- `report_credit_events` 是只读审计日志
- `daily_rewards` 仅用于检查领取权限
- 每个操作都通过行级锁确保并发安全

## 🚨 常见问题

**Q: 为什么新用户显示 0？**
A: 可能迁移未应用或旧数据。运行新迁移后，所有新用户自动获得 30 积分。

**Q: 如何给现存用户补偿积分？**
A: 在迁移中已处理 - 所有没有 `report_credits` 的用户会自动补充 30 积分。

**Q: 每日奖励能否在特定时间关闭？**
A: 在 `fn_claim_daily_reward` 中添加条件检查即可（如黑名单用户、特定时间段等）。

**Q: 如何导出/查看用户的积分历史？**
A: 查询 `report_credit_events` 表，按 `user_id` 和 `created_at` 排序。

---

**预期效果**:
- ✅ 新用户注册 → 自动获得 30 积分
- ✅ 首页显示的积分与数据库一致
- ✅ 用户每天可主动领取 10 积分
- ✅ 系统记录所有积分变动，便于审计和分析
