# 积分系统架构与数据流

## 🏗️ 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户认证流程                              │
└─────────────────────────────────────────────────────────────────┘

  用户点击登录
      │
      ├─────────────────────────────┬─────────────────────┐
      │                             │                     │
   Google OAuth              邮箱 OTP
      │                             │
  Supabase Auth              Supabase Auth
      │                             │
      └─────────────────────────────┴─────────────────────┘
                       │
                       ↓
          /api/auth/callback/route.ts
                       │
      ┌────────────────┼────────────────┐
      │                │                │
   ① 交换 code      ② 获取用户 ID    ③ 调用 RPC
      │                │                │
      └────────────────┼────────────────┘
                       │
                       ↓
          fn_initialize_profile()
                       │
      ┌────────────────┼────────────────────┬─────────────────┐
      │                │                    │                 │
   插入 profiles   插入 report_credits    插入事件日志      创建 daily_reward
   (30 积分)      (credits_available=30) (event='granted')
      │                │                    │                 │
      └────────────────┼────────────────────┴─────────────────┘
                       │
                       ↓
           ✅ 登录成功，首页显示 30 积分


┌─────────────────────────────────────────────────────────────────┐
│                    生成报告 - 积分消耗流程                        │
└─────────────────────────────────────────────────────────────────┘

  用户点击"生成报告"
      │
      ↓
  POST /api/report?symbol=NVDA&lang=en&tone=baseline
      │
      ├─① 检查认证 → 401 (未登录)
      │
      ├─② 检查配额
      │  ├─ Query: v_user_quota
      │  ├─ Return: remaining_credits=30
      │  └─ 检查: 30 > 0 ✓
      │
      ├─③ 调用 LLM 生成报告
      │  └─ OpenRouter / Helicone
      │
      ├─④ 保存到 Storage
      │  └─ /report-assets/{userId}/{reportId}/document.md
      │
      ├─⑤ 消耗配额 - 调用 RPC
      │  │
      │  ↓
      │  fn_consume_report_credit(user_id)
      │  │
      │  ├─ 原子锁定行: report_credits (user_id)
      │  │
      │  ├─ 检查: credits_available > 0
      │  │  ├─ YES → 继续
      │  │  └─ NO → 返回 (false, 0) → API 返回 429
      │  │
      │  ├─ 更新数据:
      │  │  ├─ credits_available: 30 → 29
      │  │  ├─ credits_used: 0 → 1
      │  │  └─ updated_at: NOW()
      │  │
      │  ├─ 记录事件:
      │  │  └─ INSERT event (event_type='consumed', delta=-1)
      │  │
      │  └─ 返回: (true, 29) ✓
      │
      └─⑥ 返回响应
         ├─ symbol: "NVDA"
         ├─ report: "# NVDA 报告..."
         ├─ remainingQuota: 29
         └─ reportRunId: "uuid-xxx"


┌─────────────────────────────────────────────────────────────────┐
│                  每日奖励 - 积分获取流程                          │
└─────────────────────────────────────────────────────────────────┘

  用户每天首次点击"领取 10 积分"
      │
      ↓
  POST /api/report/daily-reward
      │
      ├─① 认证检查 → 401
      │
      ├─② 调用 RPC
      │  │
      │  ↓
      │  fn_claim_daily_reward(user_id)
      │  │
      │  ├─ 查询: daily_rewards 表
      │  │  ├─ 无记录 → 首次领取，创建
      │  │  ├─ last_claimed 今天 → 返回错误 ❌
      │  │  └─ last_claimed 昨天+ → 更新 streak
      │  │
      │  ├─ 原子更新:
      │  │  ├─ report_credits: +10
      │  │  ├─ daily_rewards: last_claimed=NOW()
      │  │  └─ streak_count: +1
      │  │
      │  ├─ 记录事件:
      │  │  └─ event_type='daily_reward', delta=+10
      │  │
      │  └─ 返回: (true, "Daily reward claimed", 40)
      │
      └─③ 返回响应给前端
         ├─ success: true
         ├─ message: "Daily reward claimed"
         └─ remainingCredits: 40 (29+10+1)


┌─────────────────────────────────────────────────────────────────┐
│                       数据库表关系                                │
└─────────────────────────────────────────────────────────────────┘

  auth.users (Supabase 托管)
        │
        ↓ references (id)

  profiles (用户基本信息)
  ├─ id (PK, FK to auth.users)
  ├─ email
  ├─ display_name
  ├─ plan: 'free' | 'pro' | 'business'
  ├─ quota_limit: INT (默认 30) ← 【已更新】
  ├─ reports_used: INT
  └─ created_at / updated_at
        │
        ├─────────────────────────────┬──────────────────┐
        ↓                             ↓                  ↓

  report_credits          daily_rewards         report_credit_events
  ├─ id (PK)             ├─ id (PK)             ├─ id (PK)
  ├─ user_id (FK)        ├─ user_id (FK)        ├─ user_id (FK)
  ├─ credits_available   ├─ last_claimed ← 【新增】
  ├─ credits_used        ├─ streak_count
  ├─ last_reset          └─ created_at / updated_at
  └─ created_at / updated_at

                                                 ├─ event_type: 'granted'
                                                 │             | 'consumed'
                                                 │             | 'daily_reward'
                                                 ├─ credits_amount: INT
                                                 ├─ delta: INT ← 【新增】
                                                 ├─ reason: TEXT
                                                 └─ created_at


┌─────────────────────────────────────────────────────────────────┐
│                    调用栈与代码位置                               │
└─────────────────────────────────────────────────────────────────┘

前端用户操作
  │
  ├─ 新账号注册
  │  └─ useSupabaseAuth.signInWithEmail()
  │     └─ supabase.auth.signInWithOtp()
  │        └─ [邮箱收到 OTP 链接]
  │           └─ GET /api/auth/callback?code=xxx
  │              └─ supabase.auth.exchangeCodeForSession()
  │                 └─ supabase.rpc('fn_initialize_profile')
  │                    ├─ INSERT profiles
  │                    ├─ INSERT report_credits ← 【初始化 30】
  │                    └─ INSERT report_credit_events
  │
  ├─ 生成报告
  │  └─ generateReport({ symbol, lang, tone })
  │     └─ POST /api/report
  │        ├─ [Auth 检查]
  │        ├─ [Quota 检查] ← v_user_quota view
  │        ├─ [LLM 生成]
  │        ├─ [保存 Storage]
  │        └─ supabase.rpc('fn_consume_report_credit')
  │           ├─ UPDATE report_credits (lock row)
  │           ├─ INSERT report_credit_events
  │           └─ RETURN (success, remaining)
  │
  └─ 领取每日奖励
     └─ claimDailyReward()
        └─ POST /api/report/daily-reward
           └─ supabase.rpc('fn_claim_daily_reward')
              ├─ SELECT daily_rewards (check last_claimed)
              ├─ INSERT / UPDATE daily_rewards
              ├─ UPDATE report_credits (+10)
              ├─ INSERT report_credit_events
              └─ RETURN (success, message, remaining)


┌─────────────────────────────────────────────────────────────────┐
│                        文件树结构                                 │
└─────────────────────────────────────────────────────────────────┘

supabase/
  └─ migrations/
     ├─ 20251123000001_init_schema.sql          (初始化)
     ├─ 20251128000003_sync_quota_schema.sql    (旧配额同步)
     └─ 20251130000001_init_user_credits_30.sql (【新增】积分初始化)
        ├─ 更新 profiles.quota_limit 默认值
        ├─ 初始化现存用户 (30 积分)
        ├─ 更新触发器 (新用户 30 积分)
        ├─ 更新 fn_initialize_profile (原子初始化)
        ├─ 新增 daily_rewards 表
        └─ 新增 fn_claim_daily_reward 函数

app/
  ├─ api/
  │  ├─ auth/
  │  │  └─ callback/route.ts               (认证回调)
  │  │     └─ 调用 fn_initialize_profile
  │  │
  │  ├─ report/
  │  │  ├─ route.ts                        (生成报告)
  │  │  │  └─ 调用 fn_consume_report_credit
  │  │  │
  │  │  ├─ credits/route.ts                (查询配额)
  │  │  │  └─ Query v_user_quota
  │  │  │
  │  │  └─ daily-reward/route.ts           (【新增】每日奖励)
  │  │     └─ 调用 fn_claim_daily_reward
  │  │
  │  └─ ...
  │
  ├─ page.tsx                              (首页)
  │  ├─ 调用 fetchCredits()
  │  ├─ 显示配额数字
  │  └─ 【待添加】"领取 10 积分"按钮
  │
  ├─ account/page.tsx                      (账号设置)
  │  └─ 【待添加】领取按钮 + 状态显示
  │
  └─ sections/
     └─ ReportGeneratorSection.tsx          (报告生成器)
        └─ 调用 generateReport()

lib/
  ├─ services/
  │  └─ api.ts                              (API 客户端)
  │     ├─ generateReport()
  │     ├─ fetchCredits()
  │     └─ 【新增】claimDailyReward()
  │
  └─ i18n.tsx                               (国际化)
     └─ 【待添加】quota.daily.* 翻译


┌─────────────────────────────────────────────────────────────────┐
│                     时间序列示例                                  │
└─────────────────────────────────────────────────────────────────┘

时间轴：
├─ 2024-11-30 08:00
│  └─ 用户注册账号
│     └─ report_credits.credits_available = 30
│
├─ 2024-11-30 10:00
│  └─ 首次生成报告 NVDA
│     └─ report_credits.credits_available = 29
│
├─ 2024-11-30 12:00
│  └─ 领取每日奖励
│     └─ report_credits.credits_available = 39
│
├─ 2024-11-30 14:00
│  └─ 再次领取每日奖励
│     └─ 返回错误: "Already claimed today"
│
├─ 2024-12-01 00:00 (新的一天)
│  └─ 可以再次领取奖励
│     └─ report_credits.credits_available = 49

Audit Log (report_credit_events):
├─ [2024-11-30 08:00] event_type='granted', delta=+30, reason='Initial signup bonus'
├─ [2024-11-30 10:00] event_type='consumed', delta=-1, reason='Report generation (NVDA)'
└─ [2024-11-30 12:00] event_type='daily_reward', delta=+10, reason='Daily reward claim'
```

---

## 📊 关键数据流

### 三大操作的数据流

| 操作 | 输入 | 处理 | 输出 |
|------|------|------|------|
| **注册** | email | fn_initialize_profile | credits_available=30 ✅ |
| **生成报告** | symbol | fn_consume_report_credit | credits_available-1 ✅ |
| **领取奖励** | user_id | fn_claim_daily_reward | credits_available+10 ✅ |

### 并发安全保证

```
并发场景 1: 同一用户同时生成 2 份报告
├─ 请求 1 获取 lock
├─ 请求 2 等待 lock
├─ 请求 1 完成: 积分 30 → 29
├─ 请求 2 获取 lock
├─ 请求 2 完成: 积分 29 → 28
└─ ✅ 最终正确

并发场景 2: 用户同时领取多次奖励
├─ 请求 1 检查 last_claimed (NULL)
├─ 请求 1 插入 daily_rewards
├─ 请求 2 检查 last_claimed (今天)
├─ 请求 2 返回错误
└─ ✅ 防止重复领取

```

这就是完整的架构！🎉
