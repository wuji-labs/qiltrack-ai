# Investor AI - 优化路线图

## 📊 当前状态总结

### ✅ 已完成功能

1. **报告生成系统**
   - 支持多种语言（英语、日语、韩语、繁中、简中）
   - 支持多种分析风格（baseline、buffett、musk、muddy）
   - KPI仪表盘（市值/PE/价格/ROE）
   - 交互式图表（价格走势、估值柱状图、新闻时间线）
   - Markdown美化渲染
   - PDF导出（封面页、双列布局、图表、新闻时间线）

2. **认证系统**
   - Magic Link 邮箱登录
   - Google OAuth登录
   - Session管理

3. **积分系统**
   - 新用户30积分
   - 报告生成消耗积分
   - 每日领取功能
   - 积分审计日志

### ❌ 已知问题

1. **本地开发环境不稳定**
   - Supabase local session经常失效
   - 数据库状态不一致
   - Migration冲突

2. **积分消耗不合理**
   - 当前：1积分/报告（太便宜）
   - 目标：10积分/报告

3. **缺少密码登录**
   - 只有Magic Link和OAuth
   - 用户体验不够灵活

4. **订阅体系缺失**
   - 没有付费套餐
   - 没有定价页面
   - 没有支付集成

---

## 🎯 Phase 1: 基础设施稳定化（优先级：P0）

### 1.1 切换到Supabase托管模式

**目标：** 避免本地环境问题，提供稳定的开发和测试环境

**任务：**

- [ ] 获取Supabase Cloud项目credentials
- [ ] 更新 `.env.local` 配置
- [ ] 推送所有migrations到云端 (`npx supabase db push`)
- [ ] 验证RLS策略正常工作
- [ ] 测试完整auth flow
- [ ] 更新README中的环境配置说明

**预计时间：** 1-2小时

**依赖：** 需要用户提供Supabase Cloud credentials

---

## 🔢 Phase 2: 积分系统优化（优先级：P0）

### 2.1 调整积分消耗逻辑

**当前策略：**

```
新用户: 30积分
每次报告: -1积分
每日领取: +10积分（手动）
```

**目标策略：**

```
新用户: 30积分
每次报告: -10积分（🔄 改为10倍）
每日领取: +10积分（保持不变）
```

**实施步骤：**

#### 2.1.1 更新数据库函数

修改 `supabase/migrations/` 中的 `fn_consume_report_credit` 函数：

```sql
CREATE OR REPLACE FUNCTION public.fn_consume_report_credit(p_user_id UUID)
RETURNS TABLE(remaining_credits INT) AS $$
DECLARE
  v_credits_available INT;
BEGIN
  -- Lock the row for update
  SELECT credits_available INTO v_credits_available
  FROM public.report_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if enough credits
  IF v_credits_available < 10 THEN  -- 🔄 从 1 改为 10
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct 10 credits atomically
  UPDATE public.report_credits
  SET
    credits_available = credits_available - 10,  -- 🔄 从 1 改为 10
    credits_used = credits_used + 10,  -- 🔄 从 1 改为 10
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id
  RETURNING credits_available INTO v_credits_available;

  -- Record event
  INSERT INTO public.report_credit_events (
    user_id,
    event_type,
    credits_amount,
    reason,
    delta
  ) VALUES (
    p_user_id,
    'report_generated',
    10,  -- 🔄 从 1 改为 10
    'Report generation',
    -10  -- 🔄 从 -1 改为 -10
  );

  RETURN QUERY SELECT v_credits_available;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2.1.2 更新UI提示文案

- 首页：生成按钮旁边显示 "消耗10积分"
- 账户页面：明确说明 "每次报告消耗10积分"
- 生成确认弹窗：显示当前积分和消耗后剩余

#### 2.1.3 更新测试

修改 `__tests__/api.test.ts` 中的积分相关测试

**预计时间：** 2-3小时

---

### 2.2 优化每日领取UI

**任务：**

- [ ] 账户页面添加醒目的"每日领取"按钮
- [ ] 添加领取动画和成功提示
- [ ] 显示连续签到天数（streak）
- [ ] 添加领取冷却时间显示（距离下次可领取还有X小时）
- [ ] 首页顶部添加"每日领取"入口

**UI设计建议：**

```tsx
// 大按钮，渐变色，带icon
<button className="btn-daily-reward">
  <GiftIcon />
  <span>领取今日积分 +10</span>
  <span className="streak">🔥 连续 {streak} 天</span>
</button>
```

**预计时间：** 3-4小时

---

## 🔐 Phase 3: 认证系统增强（优先级：P1）

### 3.1 添加密码登录

**任务：**

- [ ] 更新登录页面UI：添加"邮箱+密码"选项卡
- [ ] 实现注册流程（邮箱+密码+确认密码）
- [ ] 实现密码登录API (`/api/auth/login`)
- [ ] 添加"忘记密码"功能
- [ ] 密码强度验证（至少8位、包含数字和字母）
- [ ] 更新 `useSupabaseAuth` hook支持密码登录

**UI草图：**

```
┌─────────────────────────┐
│  登录 Investor AI       │
├─────────────────────────┤
│  [邮箱+密码] [Magic Link] [Google]  │ ← 三个选项卡
├─────────────────────────┤
│  邮箱: [_______________]│
│  密码: [_______________]│
│  [ ] 记住我             │
│  [          登录        ]│
│  忘记密码?  |  注册账号  │
└─────────────────────────┘
```

**Supabase API调用：**

```typescript
// 注册
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/api/auth/callback`,
  },
});

// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// 重置密码
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

**预计时间：** 6-8小时

---

## 💳 Phase 4: 订阅和支付系统（优先级：P1）

### 4.1 设计订阅套餐

#### 套餐详情

| Feature      | Free | Monthly ($9.99/月) | Annual ($99/年) |
| ------------ | ---- | ------------------ | --------------- |
| 初始积分     | 30   | 200                | 2500 (≈208/月)  |
| 每日领取     | 10   | 20                 | 30              |
| 报告消耗     | 10   | 10                 | 10              |
| 生成优先级   | 普通 | 高                 | 最高            |
| 历史报告保存 | 7天  | 30天               | 永久            |
| PDF导出      | ✓    | ✓                  | ✓               |
| 高级图表     | ✗    | ✓                  | ✓               |
| API访问      | ✗    | ✗                  | ✓               |
| 支持         | 社区 | 邮件               | 优先+电话       |

#### Value Proposition

- **Free**: "试用体验，适合偶尔使用"
- **Monthly**: "个人投资者，每月20份报告够用"
- **Annual**: "专业投资者，省17%，解锁高级功能"

---

### 4.2 数据库Schema设计

```sql
-- subscriptions 表
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'monthly', 'annual')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),

  -- Stripe/Payment相关
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- 周期管理
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- 积分额度（根据套餐）
  monthly_credits_quota INT NOT NULL DEFAULT 30,
  daily_claim_limit INT NOT NULL DEFAULT 10,

  -- 审计
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- RLS策略
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- payment_transactions 表（记录所有支付）
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  subscription_id UUID REFERENCES public.subscriptions(id),

  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,

  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4.3 支付集成（Stripe）

**任务：**

- [ ] 注册Stripe账号
- [ ] 创建产品和价格
- [ ] 安装 `@stripe/stripe-js` 和 `stripe` (Node)
- [ ] 实现Checkout Session API (`/api/stripe/create-checkout`)
- [ ] 实现Webhook处理 (`/api/stripe/webhook`)
- [ ] 订阅管理页面（升级/取消/更改支付方式）

**Stripe产品设置：**

```javascript
// Monthly Plan
{
  name: "Investor AI - Monthly",
  price: 999, // $9.99 in cents
  currency: "usd",
  recurring: { interval: "month" },
  metadata: {
    plan_type: "monthly",
    credits_quota: 200,
    daily_claim: 20
  }
}

// Annual Plan
{
  name: "Investor AI - Annual",
  price: 9900, // $99 in cents
  currency: "usd",
  recurring: { interval: "year" },
  metadata: {
    plan_type: "annual",
    credits_quota: 2500,
    daily_claim: 30
  }
}
```

**API实现示例：**

```typescript
// app/api/stripe/create-checkout/route.ts
export async function POST(request: NextRequest) {
  const { priceId } = await request.json();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/account?success=true`,
    cancel_url: `${origin}/pricing?canceled=true`,
    customer_email: user.email,
    metadata: { userId: user.id },
  });
  return NextResponse.json({ url: session.url });
}

// app/api/stripe/webhook/route.ts
export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

  switch (event.type) {
    case "checkout.session.completed":
      // 创建subscription记录
      break;
    case "invoice.payment_succeeded":
      // 续期，增加积分
      break;
    case "customer.subscription.deleted":
      // 取消订阅
      break;
  }
}
```

**预计时间：** 10-12小时

---

### 4.4 创建定价页面 (`/pricing`)

**UI结构：**

```
┌──────────────────────────────────────┐
│          选择适合你的套餐             │
│  [月付] [年付（省17%）] ← 切换开关    │
├──────────────────────────────────────┤
│  ┌───────┐  ┌───────┐  ┌───────┐    │
│  │ Free  │  │Monthly│  │Annual │    │
│  │       │  │ $9.99 │  │ $8.25 │    │
│  │  /月  │  │  /月  │  │  /月  │    │
│  ├───────┤  ├───────┤  ├───────┤    │
│  │ 30积分│  │200积分│  │2500积分│   │
│  │ +10/天│  │ +20/天│  │ +30/天│   │
│  │ 3份报告│  │ 20份  │  │ 250份 │   │
│  │       │  │ 高优先│  │最高优先│   │
│  │       │  │ 高级图│  │ API访问│   │
│  │[当前] │  │[升级] │  │[升级] │   │
│  └───────┘  └───────┘  └───────┘    │
├──────────────────────────────────────┤
│  ❓ 常见问题 FAQ                     │
│  - 如何取消订阅？                    │
│  - 积分会过期吗？                    │
│  - 可以退款吗？                      │
└──────────────────────────────────────┘
```

**任务：**

- [ ] 创建 `app/pricing/page.tsx`
- [ ] 套餐卡片组件 (`PricingCard.tsx`)
- [ ] FAQ手风琴组件
- [ ] "立即升级"按钮集成Stripe Checkout
- [ ] 响应式设计（移动端优化）

**预计时间：** 8-10小时

---

## 🎨 Phase 5: UI/UX优化（优先级：P2）

### 5.1 首页优化

**任务：**

- [ ] 顶部导航栏添加"剩余积分"显示（带icon）
- [ ] 生成按钮旁边显示"消耗10积分"提示
- [ ] 积分不足时：禁用生成按钮 + 显示"积分不足，去充值"
- [ ] 添加"升级套餐"入口（醒目位置）

---

### 5.2 账户页面优化

**当前布局优化：**

```
┌─────────────────────────────────────┐
│  账户设置                           │
│  ┌─────────────────────────────┐   │
│  │ 👤 33333@qq.com              │   │
│  │ 套餐: Free                   │   │
│  │ [每日领取 +10积分] ← 大按钮  │   │
│  └─────────────────────────────┘   │
│  ┌─────────┐  ┌─────────────┐     │
│  │剩余积分 │  │ 套餐详情    │     │
│  │   30    │  │ Free Plan   │     │
│  │可生成3份│  │ 到期: -     │     │
│  │         │  │ [升级套餐]  │     │
│  └─────────┘  └─────────────┘     │
└─────────────────────────────────────┘
```

**任务：**

- [ ] 重新设计卡片布局
- [ ] 添加积分使用历史图表（最近7天）
- [ ] 显示套餐到期时间（付费用户）
- [ ] 升级套餐按钮（直接跳转 `/pricing`）

**预计时间：** 6-8小时

---

### 5.3 报告生成优化

**任务：**

- [ ] 添加生成确认弹窗（显示当前积分和消耗）
- [ ] 生成中显示进度条和预计时间
- [ ] 生成失败时显示详细错误和建议操作
- [ ] 积分不足时引导用户升级或领取每日积分

**预计时间：** 4-6小时

---

## 📱 Phase 6: 移动端优化（优先级：P2）

**任务：**

- [ ] 响应式导航栏（汉堡菜单）
- [ ] 移动端优化首页表单布局
- [ ] 报告页面移动端滚动优化
- [ ] 账户页面移动端布局调整
- [ ] Touch事件优化（按钮、卡片）

**预计时间：** 8-10小时

---

## 🚀 Phase 7: 性能和安全（优先级：P2）

### 7.1 性能优化

- [ ] 实现报告缓存机制（Redis）
- [ ] 图片CDN加速
- [ ] 代码分割和懒加载
- [ ] SSR优化（关键页面）

### 7.2 安全加固

- [ ] 添加Rate Limiting（防止滥用）
- [ ] API密钥管理（环境变量加密）
- [ ] SQL注入防护审查
- [ ] XSS防护审查
- [ ] CSRF Token（Supabase已提供）

**预计时间：** 10-12小时

---

## 📊 总时间估算

| Phase             | 优先级 | 预计时间      | 依赖                |
| ----------------- | ------ | ------------- | ------------------- |
| Phase 1: 基础设施 | P0     | 1-2小时       | 用户提供credentials |
| Phase 2: 积分系统 | P0     | 5-7小时       | Phase 1             |
| Phase 3: 密码登录 | P1     | 6-8小时       | Phase 1             |
| Phase 4: 订阅支付 | P1     | 18-22小时     | Phase 1, Phase 2    |
| Phase 5: UI/UX    | P2     | 18-24小时     | Phase 2, Phase 3    |
| Phase 6: 移动端   | P2     | 8-10小时      | Phase 5             |
| Phase 7: 性能安全 | P2     | 10-12小时     | Phase 4             |
| **总计**          |        | **66-85小时** |                     |

---

## 🎯 MVP路线图（最小可行产品）

**目标：2周内上线核心付费功能**

### Week 1

- ✅ Day 1-2: Phase 1（基础设施）+ Phase 2（积分系统）
- ✅ Day 3-4: Phase 3（密码登录）
- ✅ Day 5-7: Phase 4（订阅支付）前半部分（Schema + Stripe集成）

### Week 2

- ✅ Day 8-10: Phase 4（订阅支付）后半部分（Webhook + UI）
- ✅ Day 11-12: Phase 5（UI优化）核心页面
- ✅ Day 13-14: 测试 + Bug修复 + 上线

---

## 📋 下一步行动

1. **立即执行：**
   - [ ] 提供Supabase Cloud credentials
   - [ ] 确认定价策略（$9.99/月 + $99/年）
   - [ ] 注册Stripe账号

2. **本次PR范围：**
   - ✅ 修复积分系统认证问题
   - ✅ 更新查询逻辑（VIEW → Table）
   - ✅ 修复RPC返回值处理
   - 📝 完整的修复文档
   - 📝 优化路线图

3. **下次PR计划：**
   - 切换到Supabase托管
   - 调整积分消耗为10
   - 优化每日领取UI

---

## 💡 备注

- 所有时间估算基于单人开发
- 包含测试和文档时间
- 不包括设计稿制作时间（假设复用现有设计系统）
- Stripe集成假设使用标准Checkout flow（不自定义UI）
