# Architecture Snapshot: 邀请奖励系统 Bug 修复

**日期**：2025-12-10
**架构师**：G1-Codex (Claude 顶替)
**优先级**：P0（紧急，核心功能异常）

---

## 1. 背景与问题描述

### 用户报告的问题

从截图 `q1.png` 和用户反馈，邀请奖励系统存在两个严重问题：

1. **邀请链接复制后访问，不会显示提醒**
2. **新用户注册后，邀请人的统计数据不会更新（显示为 0）**

当前显示：
- 累计获得积分：0
- 成功邀请人数：0
- 付费转化人数：0

### 系统诊断结果

通过完整代码审查，发现以下关键问题：

---

## 2. 问题清单（按严重性排序）

### 🔴 P0 - 阻塞性问题

#### 问题 #1：Stripe webhook 未调用邀请转化奖励函数

**文件**：`app/api/stripe/webhook/route.ts:74-87`

**当前代码**：
```typescript
case "checkout.session.completed": {
  // ...
  const { error: upgradeError } = await supabase.rpc("fn_upgrade_membership", {
    p_user_id: userId,
    p_plan: plan,
    p_stripe_customer_id: customerId,
    p_stripe_subscription_id: subscriptionId,
  });
  // ❌ 缺少：fn_grant_conversion_reward 的调用
}
```

**影响**：
- 用户升级到 Pro 时，邀请人应得 150 积分（被邀请人也得 150 积分）
- 用户升级到 Ultra 时，被邀请人应得 900 积分，邀请人应得 1 个月 Pro 会员
- **当前这些奖励完全未发放**

**数据流**：
```
用户支付 Stripe → webhook 收到 checkout.session.completed
→ 调用 fn_upgrade_membership（✓ 已执行）
→ ❌ 应调用 fn_grant_conversion_reward（缺失）
→ 邀请人和付费人获得奖励
```

---

#### 问题 #2：Cookie 传递时机问题

**文件**：`app/ref/[code]/route.ts:26-42`

**当前代码**：
```typescript
// 在Cookie中存储邀请码（7天有效）
cookieStore.set('referral_code', code, {
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
});

// ⚠️ 直接 redirect 可能丢弃刚设置的 Cookie
redirect(`/?ref=${code}&referrer=${referrerName}`);
```

**问题分析**：
- Next.js 的 `redirect()` 会抛出 `NEXT_REDIRECT` 错误来终止执行
- 在某些 Next.js 版本中，redirect 前设置的 cookie 可能不会被传递到响应头
- 应使用 `NextResponse.redirect()` 并在返回前显式设置 cookie

**影响**：
- 邀请链接访问后，Cookie 可能未被设置
- 用户注册时，`/api/auth/callback` 读取不到 `referral_code` cookie
- 导致邀请关系未建立，统计数据为 0

---

### 🟡 P1 - 高优先级（安全和逻辑增强）

#### 问题 #3：邀请码校验不严格

**文件**：`app/ref/[code]/route.ts:14-24`

**当前逻辑**：
```typescript
const { data: referrer, error } = await supabase
  .from('profiles')
  .select('id, display_name, referral_code')
  .eq('referral_code', code)
  .single();
```

**缺失校验**：
- ✓ 邀请码是否存在（已检查）
- ✗ 邀请人账户是否被禁用/删除
- ✗ 邀请人是否为有效会员
- ✗ 邀请码是否过期（当前无过期机制）

---

#### 问题 #4：邀请码生成冲突处理

**文件**：`supabase/migrations/20251210000000_referral_system.sql:139-155`

**当前逻辑**：
```sql
LOOP
  v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || p_user_id::TEXT) FROM 1 FOR 8));

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = v_code) THEN
    UPDATE profiles SET referral_code = v_code WHERE id = p_user_id;
    RETURN v_code;
  END IF;

  v_attempts := v_attempts + 1;
  IF v_attempts >= 10 THEN
    RAISE EXCEPTION 'Failed to generate unique referral code';
  END IF;
END LOOP;
```

**风险**：
- 只重试 10 次，在高并发或数据库记录多时可能失败
- 8 位大写字母+数字的组合空间：36^8 = 2.8 万亿，冲突概率低但存在
- 建议增加重试次数或使用更强的唯一性保证（如 UUID 前缀）

---

## 3. 完整数据流分析

### 3.1 当前邀请流程（含 Bug）

```
1. 邀请人分享链接：http://localhost:3004/ref/9135D1D4
   ↓
2. 新用户访问 /ref/9135D1D4
   ├─ ✓ 验证邀请码存在
   ├─ ⚠️ 设置 Cookie (可能未传递)
   └─ 重定向到 /?ref=9135D1D4&referrer=好友
   ↓
3. 新用户点击 "注册"
   └─ 表单提交 → signUpWithPassword()
   ↓
4. Supabase 发送确认邮件
   ↓
5. 用户点击邮件链接
   └─ 访问 /api/auth/callback?code=xxx
   ↓
6. 认证回调处理
   ├─ ⚠️ 从 Cookie 读取 referral_code (可能为空)
   ├─ 调用 fn_initialize_profile(user_id, email, referral_code)
   └─ 清除 referral_code Cookie
   ↓
7. fn_initialize_profile 执行
   ├─ 生成用户自己的邀请码
   ├─ 创建 profile
   ├─ 初始化 30 积分
   └─ 如果 referral_code 不为空：调用 fn_claim_referral_signup()
       ↓
       ├─ 创建 referrals 记录（status='completed'）
       ├─ 发放 30 积分给邀请人
       ├─ 发放 30 积分给被邀请人
       ├─ 创建 referral_events 记录
       ├─ 发送通知
       └─ 调用 fn_check_milestones()
   ↓
8. [可选] 被邀请人后续升级 Pro/Ultra
   └─ Stripe webhook → fn_upgrade_membership（✓ 已执行）
   └─ ❌ 未调用 fn_grant_conversion_reward（丢失奖励）
```

### 3.2 修复后的期望流程

```
8. [可选] 被邀请人后续升级 Pro/Ultra
   └─ Stripe webhook 收到 checkout.session.completed
   ├─ 调用 fn_upgrade_membership（升级会员）
   ├─ ✅ 调用 fn_grant_conversion_reward（发放邀请奖励）
   │   ├─ Pro：邀请人 +150 积分，付费人 +150 积分
   │   └─ Ultra：付费人 +900 积分，邀请人获得 Pro 月卡
   └─ 触发 fn_check_milestones（检查里程碑）
```

---

## 4. 修复方案设计

### 方案 #1：修复 Stripe webhook 邀请奖励

**文件**：`app/api/stripe/webhook/route.ts`

**修改位置**：第 74-87 行（`checkout.session.completed` case）

**新增逻辑**：
```typescript
case "checkout.session.completed": {
  // ... 现有代码 ...

  // 1. 调用数据库函数升级会员
  const { error: upgradeError } = await supabase.rpc("fn_upgrade_membership", {
    p_user_id: userId,
    p_plan: plan,
    p_stripe_customer_id: customerId,
    p_stripe_subscription_id: subscriptionId,
  });

  if (upgradeError) {
    console.error("[Stripe] Failed to upgrade membership:", upgradeError);
  } else {
    console.log(`[Stripe] Successfully upgraded user ${userId} to ${plan}`);
  }

  // ✅ 2. 调用邀请转化奖励函数
  try {
    const { data: rewardGranted, error: rewardError } = await supabase.rpc(
      "fn_grant_conversion_reward",
      {
        p_user_id: userId,
        p_plan: plan,
      }
    );

    if (rewardError) {
      console.error("[Stripe] Failed to grant referral conversion reward:", rewardError);
    } else if (rewardGranted) {
      console.log(`[Stripe] Granted referral conversion reward for ${plan} upgrade`);
    } else {
      console.log("[Stripe] No referral reward to grant (user not referred)");
    }
  } catch (err) {
    console.error("[Stripe] Exception calling fn_grant_conversion_reward:", err);
    // 不阻塞主流程
  }

  break;
}
```

**预期效果**：
- Pro 升级：双方各得 150 积分
- Ultra 升级：付费人得 900 积分，邀请人得 Pro 月卡
- 自动检查并更新里程碑进度

---

### 方案 #2：修复 Cookie 传递问题

**文件**：`app/ref/[code]/route.ts`

**修改位置**：第 26-42 行

**修复代码**：
```typescript
// ✅ 使用 NextResponse.redirect 并显式设置 cookie
const referrerName = encodeURIComponent(referrer.display_name || '好友');
const redirectUrl = new URL(`/?ref=${code}&referrer=${referrerName}`, request.url);
const response = NextResponse.redirect(redirectUrl);

// 在响应上设置 cookie
response.cookies.set('referral_code', code, {
  maxAge: 7 * 24 * 60 * 60, // 7 天
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
});

console.info('[REFERRAL_LINK_CLICKED]', {
  code,
  referrer_id: referrer.id,
});

return response;
```

**关键改动**：
- ❌ 移除：`cookieStore.set()` + `redirect()`
- ✅ 改用：`NextResponse.redirect()` + `response.cookies.set()`
- 确保 cookie 在 HTTP 响应头中正确传递

---

### 方案 #3：增强邀请码校验（可选，P1）

**文件**：`app/ref/[code]/route.ts`

**修改查询**：
```typescript
const { data: referrer, error } = await supabase
  .from('profiles')
  .select('id, display_name, referral_code, plan, subscription_status')
  .eq('referral_code', code)
  .is('deleted_at', null) // 排除已删除账户
  .single();

if (error || !referrer) {
  console.warn('[INVALID_REFERRAL_CODE]', { code });
  redirect('/');
}

// 可选：校验邀请人账户状态
if (referrer.subscription_status === 'banned') {
  console.warn('[BANNED_REFERRER]', { code, referrer_id: referrer.id });
  redirect('/');
}
```

---

## 5. 数据库函数依赖关系

```
fn_initialize_profile
  └─ fn_claim_referral_signup
      ├─ 创建 referrals 记录
      ├─ 发放注册奖励（30 积分）
      └─ fn_check_milestones

fn_grant_conversion_reward
  ├─ 查找邀请关系（profiles.referred_by）
  ├─ 更新 referrals 状态
  ├─ 发放升级奖励（Pro: 150积分 / Ultra: 900积分+Pro月卡）
  └─ 创建 referral_events 记录

fn_check_milestones
  └─ 自动检测里程碑达成（10/30/88 人）
```

---

## 6. 测试验证矩阵

### 6.1 注册流程测试

| 场景 | 操作 | 期望结果 | 验证方式 |
|------|------|----------|----------|
| 直接访问邀请链接 | 访问 `/ref/CODE` | Cookie 设置成功，重定向到首页 | 检查浏览器 DevTools → Application → Cookies |
| Cookie 持久性 | 访问后 1 小时再注册 | Cookie 仍然存在，邀请关系建立 | 查询 `referrals` 表 |
| 邀请注册 | 通过邀请链接注册 | 双方各得 30 积分，`referrals` 记录创建 | 查询 `report_credits` 和 `referrals` |
| 邀请人统计 | 邀请 3 人注册 | 邀请页面显示：成功邀请 3 人，累计 90 积分 | 查看 `/account?section=referrals` |

### 6.2 付费转化测试

| 场景 | 操作 | 期望结果 | 验证方式 |
|------|------|----------|----------|
| 被邀请人升级 Pro | Stripe 支付成功 | 双方各得 150 积分 | 查询 `referral_events` |
| 被邀请人升级 Ultra | Stripe 支付成功 | 付费人得 900 积分，邀请人得 Pro 月卡 | 查询 `referral_milestones` |
| 非邀请用户升级 | 直接注册用户升级 Pro | 正常升级，无额外奖励 | 检查 `profiles.referred_by` 为 NULL |

### 6.3 里程碑测试

| 场景 | 操作 | 期望结果 | 验证方式 |
|------|------|----------|----------|
| 邀请 10 人 | 第 10 人注册成功 | 自动创建 `invite_10` 里程碑（120 积分） | 查询 `referral_milestones` |
| 邀请 30 人 | 第 30 人注册成功 | 自动创建 `invite_30` 里程碑（Pro 月卡） | 查询 `referral_milestones` |

---

## 7. 风险与缓解措施

### 风险 #1：Stripe webhook 重复调用

**场景**：Stripe 可能重试 webhook，导致奖励重复发放

**缓解措施**：
- ✅ `fn_grant_conversion_reward` 已内置幂等性检查：
  ```sql
  IF EXISTS (SELECT 1 FROM referrals
             WHERE id = v_referral_id AND pro_reward_given = TRUE) THEN
    RETURN FALSE;  -- 已发放，跳过
  END IF;
  ```
- ✅ Stripe webhook 事件 ID 可记录到数据库，防止重复处理（可选增强）

### 风险 #2：Cookie 跨域问题

**场景**：开发环境可能有多个端口（3000-3005）

**缓解措施**：
- ✅ Cookie 已设置 `path: '/'` 确保全站可访问
- ✅ `sameSite: 'lax'` 允许跨站点导航携带 Cookie
- ⚠️ 注意：不同端口视为不同源，Cookie 不共享（开发环境需固定端口）

### 风险 #3：邀请码穷尽

**场景**：8 位邀请码空间在极大用户量下可能冲突

**缓解措施**：
- ✅ 当前重试 10 次，冲突概率极低（36^8 = 2.8 万亿）
- 🔧 可选增强：增加到 20 次重试，或使用 10 位邀请码

---

## 8. 实施清单

### 阶段 1：紧急修复（P0）

- [ ] 修复 Stripe webhook：添加 `fn_grant_conversion_reward` 调用
- [ ] 修复 Cookie 传递：改用 `NextResponse.redirect()`
- [ ] 本地测试：模拟邀请注册流程
- [ ] 本地测试：模拟 Pro/Ultra 升级流程

### 阶段 2：验证与测试

- [ ] 浏览器 DevTools 验证 Cookie 设置
- [ ] 数据库查询验证邀请记录
- [ ] 端到端测试：邀请 → 注册 → 升级 → 里程碑
- [ ] 审查 Supabase 日志和控制台输出

### 阶段 3：增强（P1）

- [ ] 邀请码校验增强（排除已删除/禁用账户）
- [ ] Stripe webhook 事件去重（记录 event_id）
- [ ] 邀请码生成增加重试次数或长度

---

## 9. 文件清单

### 需要修改的文件

| 文件 | 修改内容 | 优先级 |
|------|----------|--------|
| `app/api/stripe/webhook/route.ts` | 添加 `fn_grant_conversion_reward` 调用 | P0 |
| `app/ref/[code]/route.ts` | 修复 Cookie 传递时机 | P0 |
| `app/ref/[code]/route.ts` | 增强邀请码校验 | P1 |

### 需要测试的文件

| 文件 | 测试内容 |
|------|----------|
| `app/components/referral/ReferralPanel.tsx` | 统计数据显示 |
| `app/api/referrals/stats/route.ts` | 统计查询逻辑 |
| `supabase/migrations/20251210000000_referral_system.sql` | 数据库函数执行 |

---

## 10. 部署注意事项

### 环境变量检查

确保以下环境变量已配置：
- ✅ `STRIPE_WEBHOOK_SECRET`（Webhook 签名验证）
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`（Webhook 使用 service role）

### 数据库迁移

- ✅ `20251210000000_referral_system.sql` 已部署
- ⚠️ 确认所有函数已创建：`fn_initialize_profile`, `fn_claim_referral_signup`, `fn_grant_conversion_reward`, `fn_check_milestones`

### Stripe Webhook 配置

确保 Stripe Dashboard 已配置 webhook 端点：
- URL: `https://yourdomain.com/api/stripe/webhook`
- 事件：`checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.*`

---

## 11. Rollback Plan

如果修复后出现问题：

### 快速回滚

```bash
# 1. 回滚代码
git revert <commit-hash>

# 2. 重启应用
npm run build && npm start

# 3. 检查数据库
# 执行以下查询，确认未出现数据异常
SELECT * FROM referrals ORDER BY created_at DESC LIMIT 10;
SELECT * FROM referral_events ORDER BY created_at DESC LIMIT 10;
```

### 数据修复

如果发现奖励重复发放：
```sql
-- 检查重复发放
SELECT user_id, event_type, COUNT(*)
FROM referral_events
GROUP BY user_id, event_type
HAVING COUNT(*) > 1;

-- 需要人工审核后再决定是否回退积分
```

---

## 12. 成功标准

修复成功的标志：

1. ✅ 访问邀请链接后，浏览器 Cookie 中存在 `referral_code`
2. ✅ 新用户注册后，`referrals` 表有新记录，`status='completed'`
3. ✅ 邀请人的 `/account?section=referrals` 显示正确的统计数据
4. ✅ 被邀请人升级 Pro 后，双方各得 150 积分
5. ✅ 邀请 10 人后，自动创建 `invite_10` 里程碑

---

## 13. 相关文档

- **协作手册**：`CODEX_CLAUDE_COLLAB.md`
- **数据库迁移**：`supabase/migrations/20251210000000_referral_system.sql`
- **邀请面板组件**：`app/components/referral/ReferralPanel.tsx`
- **Stripe 集成指南**：（需补充文档）

---

## 14. 下一步行动

按照 Codex-Claude 协作流程，下一步：

1. **老板 → G1-Codex**：分配任务到 G1 组（邀请系统归属）
2. **G1-Codex**：审阅本 Snapshot，向G1-Claude发布实施指令
3. **G1-Claude**：实施修复，按文件清单逐个修复
4. **G1-Claude**：输出 CAVR 报告到 `docs/reports/2025-12-10-g1-referral-bugfix-cavr.md`
5. **G1-Codex**：审查 PR，验证修复
6. **G1-Codex**：向老板汇报完成状态
7. **老板**：审查并合并 PR 到 main

---

**架构师签名**：G1-Codex (Claude 顶替)
**待分配组别**：G1
**预计完成**：1-2 天
