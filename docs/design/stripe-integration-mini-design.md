# Stripe 接入 Mini Design — 支付流程与额度管理

**日期**：2025-11-26
**目标**：T+2 期间完成 Stripe Checkout 接入，实现月/年订阅与配额升级
**状态**：设计阶段，等待业务需求确认

---

## 1. 需求概述

### 核心目标
- 接入 Stripe Checkout（托管版），支持**月套餐**和**年套餐**订阅
- 订阅成功后自动扣除配额、更新用户额度与订阅计划标记
- 支持订阅取消/续期/升级流程
- 与现有配额系统无缝集成，兼容多语言提示

### 约束条件
- **支付网关**：Stripe（托管版 Checkout，不自建表单）
- **通知机制**：Webhook 接收 `checkout.session.completed`、`customer.subscription.updated` 等事件
- **额度规则**：
  - 首份免费报告（新用户自动获赠 1 份）
  - 月套餐：额外 10 份/月
  - 年套餐：额外 120 份/年（等价优惠）
- **数据库集成**：Supabase users & quotas 表

---

## 2. 数据模型扩展

### users 表（扩展字段）
```sql
-- 既有字段：id, email, provider, provider_id, created_at
ALTER TABLE users ADD COLUMN (
  stripe_customer_id VARCHAR(50) UNIQUE,           -- Stripe 客户 ID
  subscription_plan VARCHAR(20),                   -- 'free' | 'monthly' | 'annual'
  subscription_id VARCHAR(100),                    -- Stripe Subscription ID
  subscription_status VARCHAR(20),                 -- 'active' | 'past_due' | 'canceled' | 'incomplete'
  subscription_starts_at TIMESTAMP,                -- 订阅开始时间
  subscription_ends_at TIMESTAMP,                  -- 订阅结束时间（取消时）
  subscription_renews_at TIMESTAMP,                -- 下次续期时间
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
```

### quotas 表（扩展字段）
```sql
-- 既有字段：user_id, remaining_credits, reports_used, created_at
ALTER TABLE quotas ADD COLUMN (
  monthly_quota INT DEFAULT 10,                    -- 月份额度（仅 monthly 套餐）
  yearly_quota INT DEFAULT 120,                    -- 年份额度（仅 annual 套餐）
  quota_resets_at TIMESTAMP,                       -- 配额重置时间（月/年的第一天）
  plan_source VARCHAR(20),                         -- 'free' | 'stripe_monthly' | 'stripe_annual'
  last_reset_at TIMESTAMP
);
```

---

## 3. 支付流程设计

### 3.1 前端 CTA 流程

**当前 Fallback 状态**：
```
用户点击"升级订阅" CTA
  ├─ 未登录 → 跳转登录页面
  └─ 已登录 → 弹出 "Subscription is coming soon" 提示，降级到报告生成
```

**T+2 Stripe 接入后**：
```
用户点击"升级订阅" CTA
  ├─ 未登录 → 跳转登录页面
  └─ 已登录
      ├─ 检查当前订阅状态（query users 表 subscription_plan）
      ├─ 若已订阅 → 显示"管理订阅"按钮，跳转 Stripe 客户门户
      └─ 若未订阅
          ├─ 展示定价卡片（月 $X / 年 $Y）
          └─ 点击购买 → 调用 /api/checkout/create → 重定向 Stripe Checkout
```

### 3.2 Checkout 流程（后端）

**端点**：`POST /api/checkout/create`

```typescript
// 请求
{
  priceId: "price_1..." | "price_2...",  // Stripe Price ID（月或年）
  lookupKey: "monthly" | "annual",       // 套餐标识
}

// 响应
{
  checkoutUrl: "https://checkout.stripe.com/...",  // 重定向 URL
  sessionId: "cs_...",                             // 会话 ID（可选，用于后续查询）
}
```

**实现步骤**：
1. 获取 session 用户 ID
2. 查询或创建 Stripe Customer（`stripe.customers.create` 或 `retrieve`）
3. 创建 Checkout Session（`stripe.checkout.sessions.create`）
4. 存储 session ID 到数据库（便于后续追踪）
5. 返回 checkoutUrl，前端重定向

**关键参数**：
```typescript
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  line_items: [
    {
      price: priceId,  // 从 Stripe 仪表板获取
      quantity: 1,
    },
  ],
  mode: 'subscription',
  success_url: `${baseUrl}/reports?success=true&sessionId={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/pricing`,
  metadata: {
    userId: user.id,
    plan: lookupKey,
  },
});
```

### 3.3 Webhook 处理（后端）

**端点**：`POST /api/webhooks/stripe`

**触发事件**：
1. `checkout.session.completed` → 初次购买成功
2. `customer.subscription.updated` → 订阅更新（续期、升级等）
3. `customer.subscription.deleted` → 订阅取消
4. `invoice.payment_succeeded` → 续期扣款成功
5. `invoice.payment_failed` → 续期扣款失败

**核心逻辑**：
```typescript
export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')!;
  const event = await stripe.webhooks.constructEventAsync(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata!.userId;
      const plan = session.metadata!.plan; // 'monthly' | 'annual'

      // 1. 更新 users 表：存储 Stripe Customer ID 和订阅信息
      await updateUserSubscription(userId, {
        stripe_customer_id: session.customer as string,
        subscription_plan: plan,
        subscription_status: 'active',
        subscription_starts_at: new Date(),
      });

      // 2. 更新 quotas 表：扣除初次配额，设置重置时间
      const quotaToAdd = plan === 'monthly' ? 10 : 120;
      await updateQuota(userId, {
        remaining_credits: quotaToAdd,
        monthly_quota: plan === 'monthly' ? 10 : 0,
        yearly_quota: plan === 'annual' ? 120 : 0,
        plan_source: `stripe_${plan}`,
        quota_resets_at: calculateNextReset(plan),
      });

      // 3. 发送确认邮件
      await sendEmail(session.customer_details!.email!, 'subscription_confirmed', {
        plan,
        quota: quotaToAdd,
      });

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await getUserByStripeId(subscription.customer as string);

      // 更新订阅状态（续期时自动添加配额）
      if (subscription.status === 'active') {
        const plan = subscription.metadata?.plan || 'monthly';
        const quotaToAdd = plan === 'monthly' ? 10 : 120;
        await updateQuota(userId, {
          remaining_credits: quotaToAdd,
          quota_resets_at: calculateNextReset(plan),
        });
      }

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await getUserByStripeId(subscription.customer as string);

      await updateUserSubscription(userId, {
        subscription_plan: 'free',
        subscription_status: 'canceled',
        subscription_ends_at: new Date(),
      });

      break;
    }

    // ... 其他事件
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

---

## 4. 前端 UI 变更

### 4.1 定价页面（pricing.tsx）

**当前状态**：CTA 按钮为 fallback（点击显示 "coming soon"）

**T+2 目标**：
```tsx
// 定价卡片 CTA 按钮
<button onClick={() => handleSubscribe(plan === 'monthly' ? 'price_...' : 'price_...')}>
  {isLoading ? 'Processing...' : t('pricing.plan.cta.subscribe')}
</button>

// 处理逻辑
const handleSubscribe = async (priceId: string) => {
  if (!isAuthenticated) {
    router.push('/login');
    return;
  }

  setIsLoading(true);
  try {
    const { checkoutUrl } = await fetch('/api/checkout/create', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    }).then(r => r.json());

    window.location.href = checkoutUrl; // 重定向到 Stripe Checkout
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

### 4.2 订阅成功回调页面

**路径**：`/reports?success=true&sessionId=...`

```tsx
// 验证 Checkout 成功
useEffect(() => {
  if (searchParams.get('success') === 'true') {
    // 1. 显示成功提示
    showNotification(t('subscription.success'), 'success');

    // 2. 刷新用户配额和订阅状态
    await refreshSession();
    await refreshQuota();

    // 3. 重定向到报告列表（或生成新报告）
    setTimeout(() => router.push('/reports'), 2000);
  }
}, [searchParams]);
```

### 4.3 订阅管理页面（可选）

**路径**：`/account/subscriptions`

```tsx
// 展示当前订阅状态
<SubscriptionCard>
  <p>{t('account.subscription.plan')}: {userPlan}</p>
  <p>{t('account.subscription.status')}: {subscriptionStatus}</p>
  <p>{t('account.subscription.renews')}: {subscriptionRenewsAt}</p>
  <button onClick={() => goToStripePortal()}>
    {t('account.subscription.manage')}
  </button>
</SubscriptionCard>

// 跳转 Stripe 客户门户
const goToStripePortal = async () => {
  const portalUrl = await fetch('/api/stripe/customer-portal')
    .then(r => r.json())
    .then(d => d.url);

  window.location.href = portalUrl;
};
```

---

## 5. 配额重置逻辑

### 重置时机
- **月套餐**：每月 1 日 UTC 0 时重置 10 份
- **年套餐**：每年 1 月 1 日 UTC 0 时重置 120 份

### 实现方案

**选项 A：数据库定时任务（推荐）**
```sql
-- 每日凌晨 0 时 UTC 运行
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
  UPDATE quotas
  SET remaining_credits = monthly_quota,
      quota_resets_at = DATE_TRUNC('month', NOW() + INTERVAL '1 month')
  WHERE
    plan_source = 'stripe_monthly'
    AND quota_resets_at <= NOW();

  UPDATE quotas
  SET remaining_credits = yearly_quota,
      quota_resets_at = DATE_TRUNC('year', NOW() + INTERVAL '1 year')
  WHERE
    plan_source = 'stripe_annual'
    AND quota_resets_at <= NOW();
END;
$$ LANGUAGE plpgsql;
```

**选项 B：后端定时任务**
```typescript
// lib/cron/resetQuotas.ts
import cron from 'node-cron';

export function startQuotaResetCron() {
  // 每天 00:00 UTC 执行
  cron.schedule('0 0 * * *', async () => {
    const expiredQuotas = await supabase
      .from('quotas')
      .select('user_id, plan_source')
      .lte('quota_resets_at', new Date());

    for (const quota of expiredQuotas) {
      const quotaAmount = quota.plan_source === 'stripe_monthly' ? 10 : 120;
      await supabase
        .from('quotas')
        .update({
          remaining_credits: quotaAmount,
          quota_resets_at: calculateNextReset(quota.plan_source),
          last_reset_at: new Date(),
        })
        .eq('user_id', quota.user_id);
    }
  });
}
```

---

## 6. 安全与合规

### 6.1 环境变量
```bash
# .env.local
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
```

### 6.2 API 安全
- **身份验证**：所有支付端点需 NextAuth session
- **HTTPS 强制**：Webhook 仅接受 HTTPS
- **签名验证**：Webhook 事件需 Stripe 签名验证（`stripe.webhooks.constructEvent`）
- **幂等性**：Webhook 处理应幂等（支持重复调用）

### 6.3 PCI 合规
- **不存储卡片信息**：全部由 Stripe 托管
- **Webhook 日志**：记录关键事件便于审计
- **错误处理**：敏感信息不泄露给前端

---

## 7. 测试计划

### 单元测试
```typescript
// api/checkout/create.test.ts
describe('POST /api/checkout/create', () => {
  test('unauthenticated user returns 401', async () => {
    // ...
  });

  test('creates checkout session for monthly plan', async () => {
    // ...
  });

  test('creates customer if not exists', async () => {
    // ...
  });
});

// api/webhooks/stripe.test.ts
describe('Stripe Webhook', () => {
  test('checkout.session.completed updates users and quotas', async () => {
    // ...
  });

  test('subscription.deleted sets plan to free', async () => {
    // ...
  });
});
```

### 集成测试（手动）
1. 进入定价页面 → 点击"升级" → 进入 Stripe Checkout
2. 完成虚拟购买（使用 Stripe 测试卡 `4242 4242 4242 4242`）
3. 验证配额更新：`SELECT * FROM quotas WHERE user_id = ...`
4. 验证订阅状态：`SELECT * FROM users WHERE id = ...`
5. 确认确认邮件发送
6. 取消订阅 → 验证状态切换为 `canceled`

---

## 8. 文案与 i18n

### 需要的 i18n keys

**中文**：
```json
{
  "pricing.plan.monthly.price": "¥99/月",
  "pricing.plan.annual.price": "¥999/年",
  "pricing.plan.cta.subscribe": "升级订阅",
  "pricing.plan.features": ["10 份报告/月", "..."],
  "subscription.success": "订阅成功！您已获得 {quota} 份报告额度",
  "subscription.error": "订阅失败，请重试",
  "account.subscription.plan": "当前套餐",
  "account.subscription.status": "订阅状态",
  "account.subscription.renews": "下次续期",
  "account.subscription.manage": "管理订阅",
  "email.subscription_confirmed.subject": "订阅确认",
  "email.subscription_confirmed.body": "感谢您订阅 {plan} 套餐..."
}
```

**英文**：
```json
{
  "pricing.plan.monthly.price": "$9.99/mo",
  "pricing.plan.annual.price": "$99.99/yr",
  "pricing.plan.cta.subscribe": "Upgrade Plan",
  "pricing.plan.features": ["10 reports/month", "..."],
  "subscription.success": "Subscription successful! You've received {quota} report credits",
  "subscription.error": "Subscription failed, please try again",
  "account.subscription.plan": "Current Plan",
  "account.subscription.status": "Subscription Status",
  "account.subscription.renews": "Next Renewal",
  "account.subscription.manage": "Manage Subscription",
  "email.subscription_confirmed.subject": "Subscription Confirmed",
  "email.subscription_confirmed.body": "Thank you for subscribing to the {plan} plan..."
}
```

---

## 9. 实施时间表

### T+2 完成清单
- [ ] 注册/配置 Stripe 账户（生产环境）
- [ ] 创建 Price Objects（月 & 年）
- [ ] 实现 `/api/checkout/create` 端点
- [ ] 实现 `/api/webhooks/stripe` 端点
- [ ] 数据库迁移（users & quotas 表扩展）
- [ ] 定时任务：配额重置（选择 A 或 B）
- [ ] 前端定价页面改动
- [ ] 订阅成功/取消回调页面
- [ ] 邮件通知模板
- [ ] i18n 字典补充
- [ ] 安全审计与 PCI 检查
- [ ] 集成测试 & 手动验证

### 依赖关系
```
Stripe 账户配置
  ↓
API 端点实现 & Webhook
  ↓
数据库迁移
  ↓
前端页面 & i18n
  ↓
测试 & 上线
```

---

## 10. 风险与缓解

| 风险 | 级别 | 缓解方案 |
|------|------|---------|
| Webhook 延迟 | 中 | 实现幂等性处理，支持重试 |
| 配额重置不及时 | 中 | 选用数据库触发器（更可靠）或 Cron + 告警 |
| 支付失败通知缺失 | 高 | 监听 `invoice.payment_failed` Webhook，发送邮件 |
| 价格调整影响现有用户 | 中 | 为现有订阅创建独立 Price ID，不影响续期 |
| Stripe 账户限制 | 低 | 提前进行身份验证和合规审核 |

---

## 11. 审批检查清单

### 业务确认
- [ ] 月套餐价格确认：¥99 / $9.99
- [ ] 年套餐价格确认：¥999 / $99.99
- [ ] 配额规则确认：10/月, 120/年
- [ ] 首份免费报告政策确认
- [ ] 支持的国家和币种确认

### 技术实现
- [ ] Stripe 环境配置（测试 & 生产）
- [ ] API 端点安全审计
- [ ] Webhook 签名验证完整
- [ ] 数据库备份与恢复计划
- [ ] 日志与监控系统就绪

### 运营支持
- [ ] 客户支持文档（如何管理订阅）
- [ ] 常见问题解答
- [ ] 退款流程文档
- [ ] 支持团队培训

---

**准备好以上内容后，即可在 T+2 期间进行 Stripe 接入，并在 T+3 上线支付功能。**
