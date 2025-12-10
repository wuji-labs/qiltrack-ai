# CAVR 报告：邀请奖励系统 Bug 修复

**日期**：2025-12-10
**工作组**：G1
**分支**：g1/develop
**提交**：2a4a8fa
**架构师**：G1-Codex (Claude 顶替)
**实施工程师**：G1-Claude

---

## Context（上下文）

### 问题来源
用户反馈邀请奖励系统存在严重问题（见 `q1.png`）：
1. **邀请链接复制后访问，不会显示提醒**
2. **新用户注册后，邀请人的统计数据不会更新（显示为 0）**

### 诊断结果
通过完整代码审查和数据流分析，确认两个 P0 阻塞性问题：

#### 问题 #1：Stripe webhook 未调用邀请转化奖励函数
- **位置**：`app/api/stripe/webhook/route.ts:74-87`
- **影响**：用户升级 Pro/Ultra 时，邀请人和付费人的奖励未发放
  - Pro 升级：应各得 150 积分，实际未发放
  - Ultra 升级：应付费人得 900 积分，邀请人得 Pro 月卡，实际未发放

#### 问题 #2：Cookie 传递时机问题
- **位置**：`app/ref/[code]/route.ts:26-42`
- **影响**：邀请链接访问时设置的 Cookie 可能未正确传递
  - Next.js `redirect()` 会抛出异常终止执行
  - Cookie 设置可能在重定向前丢失
  - 导致注册时读取不到 `referral_code`，邀请关系未建立

### 架构 Snapshot
详见：`docs/decisions/2025-12-10-referral-system-bugfix.md`

---

## Actions（实施动作）

### 1. 分支管理
- **分支**：`g1/develop`（G1 组固定长期分支）
- **提交**：2a4a8fa

### 2. 代码修改

#### 修改 #1：Stripe webhook 添加邀请转化奖励调用
**文件**：`app/api/stripe/webhook/route.ts`
**位置**：第 89-110 行（新增）

```typescript
// 调用邀请转化奖励函数
try {
  const { data: rewardGranted, error: rewardError } = await (supabase as any).rpc(
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
```

**改动说明**：
- 在成功调用 `fn_upgrade_membership` 后，立即调用 `fn_grant_conversion_reward`
- 使用 try-catch 包裹，确保奖励发放失败不影响支付主流程
- 添加详细日志，方便调试
- 函数内置幂等性检查，Stripe 重试不会重复发放

#### 修改 #2：修复邀请链接 Cookie 传递时机
**文件**：`app/ref/[code]/route.ts`
**位置**：第 20-44 行（重构）

**修改前**：
```typescript
if (error || !referrer) {
  console.warn('[INVALID_REFERRAL_CODE]', { code });
  redirect('/'); // ❌ 抛出异常
}

// 在Cookie中存储邀请码（7天有效）
cookieStore.set('referral_code', code, { ... }); // ⚠️ 可能未执行

redirect(`/?ref=${code}&referrer=${referrerName}`); // ❌ Cookie 丢失
```

**修改后**：
```typescript
if (error || !referrer) {
  console.warn('[INVALID_REFERRAL_CODE]', { code });
  return NextResponse.redirect(new URL('/', request.url)); // ✅ 显式返回
}

// 使用 NextResponse.redirect 并显式设置 cookie
const referrerName = encodeURIComponent(referrer.display_name || '好友');
const redirectUrl = new URL(`/?ref=${code}&referrer=${referrerName}`, request.url);
const response = NextResponse.redirect(redirectUrl);

// 在响应上设置 cookie（7天有效）
response.cookies.set('referral_code', code, {
  maxAge: 7 * 24 * 60 * 60, // 7 天
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
});

return response; // ✅ Cookie 正确传递
```

**改动说明**：
- 移除 `redirect()` 调用，改用 `NextResponse.redirect()`
- 在 response 对象上显式设置 cookie
- 确保 HTTP 响应头包含 Set-Cookie
- 添加 `NextResponse` 导入（已存在）

### 3. 文档更新

#### 新增文档
- **Architecture Snapshot**：`docs/decisions/2025-12-10-referral-system-bugfix.md`
  - 完整问题诊断（12 个问题点）
  - 数据流分析
  - 修复方案设计
  - 测试验证矩阵
  - 风险缓解措施

#### 更新协作文档
- **`CODEX_CLAUDE_COLLAB.md`**（第 96-107 行）：
  - 明确 5 个工作组固定分支规则
  - G1-G5 各组使用 `gX/develop` 长期分支
  - 禁止临时 feature 分支（特殊情况除外）

- **`docs/plans/workstreams.md`**：
  - 添加任务 WS-2025-12-10（邀请系统修复）
  - 更新本周概况和工作量统计

---

## Verification（验证结果）

### 1. Lint 检查
```bash
$ npm run lint
✖ 347 problems (11 errors, 336 warnings)
```

**结果分析**：
- ✅ 修改的两个文件（`webhook/route.ts`、`ref/[code]/route.ts`）**无 lint 错误**
- ⚠️ 其他文件的 lint 问题为既有问题，不在本次修复范围内
- ✅ 未引入新的 lint 错误或警告

### 2. 代码审查
- ✅ Stripe webhook 调用 `fn_grant_conversion_reward` 逻辑正确
- ✅ Cookie 设置使用 `NextResponse` 确保传递
- ✅ 错误处理完善（try-catch + 日志）
- ✅ 幂等性保证（数据库函数内置检查）

### 3. 数据库函数验证
验证 `fn_grant_conversion_reward` 存在且逻辑正确：
- ✅ 函数定义：`supabase/migrations/20251210000000_referral_system.sql:274-413`
- ✅ Pro 奖励：双方各 150 积分
- ✅ Ultra 奖励：付费人 900 积分，邀请人 Pro 月卡
- ✅ 幂等性检查：`pro_reward_given` / `ultra_reward_given` 标志
- ✅ 事件记录：`referral_events` 表审计日志

### 4. 本地测试计划（待执行）
以下测试需要在开发环境执行：

#### 测试 #1：Cookie 传递验证
```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问邀请链接
http://localhost:3004/ref/9135D1D4

# 3. 检查浏览器 DevTools
# Application → Cookies → localhost:3004
# 应该看到：referral_code = 9135D1D4
```

#### 测试 #2：邀请注册流程
```bash
# 1. 通过邀请链接访问
# 2. 注册新用户
# 3. 确认邮件并激活
# 4. 检查数据库：

# 查询邀请记录
SELECT * FROM referrals WHERE referral_code = '9135D1D4' ORDER BY created_at DESC LIMIT 1;
# 应该看到：status = 'completed', signup_reward_given = TRUE

# 查询积分奖励
SELECT * FROM report_credits WHERE user_id IN (
  SELECT referrer_id FROM referrals WHERE referral_code = '9135D1D4' LIMIT 1
);
# 邀请人应该有 +30 积分

# 查询邀请事件
SELECT * FROM referral_events WHERE event_type = 'signup' ORDER BY created_at DESC LIMIT 2;
# 应该看到两条记录（邀请人 + 被邀请人）
```

#### 测试 #3：Pro 升级奖励
```bash
# 1. 被邀请人通过 Stripe 升级 Pro
# 2. Stripe webhook 触发
# 3. 检查日志：
[Stripe] Checkout completed for user xxx, plan: pro
[Stripe] Successfully upgraded user xxx to pro
[Stripe] Granted referral conversion reward for pro upgrade

# 4. 检查数据库：
SELECT * FROM referral_events WHERE event_type = 'pro_upgrade' ORDER BY created_at DESC LIMIT 2;
# 应该看到：credits_rewarded = 150（双方各一条）

SELECT * FROM referrals WHERE referred_id = '<user_id>';
# 应该看到：status = 'converted_pro', pro_reward_given = TRUE
```

### 5. Git 状态
```bash
$ git status
On branch g1/develop
nothing to commit, working tree clean

$ git log --oneline -1
2a4a8fa fix: 修复邀请奖励系统两个 P0 Bug
```

---

## Risks（风险与遗留问题）

### 高优先级风险（需要后续处理）

#### 风险 #1：Stripe webhook 重复调用
**场景**：Stripe 可能重试 webhook，导致奖励重复发放

**缓解措施**（已实施）：
- ✅ `fn_grant_conversion_reward` 内置幂等性检查
- ✅ `pro_reward_given` / `ultra_reward_given` 标志防止重复

**建议增强**（P1）：
- 在 `referrals` 表添加 Stripe `event_id` 字段
- Webhook 处理前检查 `event_id` 是否已处理

#### 风险 #2：邀请码校验不严格
**位置**：`app/ref/[code]/route.ts:14-23`

**当前逻辑**：
- ✅ 检查邀请码是否存在
- ❌ 未检查邀请人账户状态（是否被禁用/删除）
- ❌ 未检查邀请码是否过期

**建议增强**（P1）：
```typescript
const { data: referrer, error } = await supabase
  .from('profiles')
  .select('id, display_name, referral_code, subscription_status')
  .eq('referral_code', code)
  .is('deleted_at', null) // 排除已删除账户
  .single();

if (referrer.subscription_status === 'banned') {
  console.warn('[BANNED_REFERRER]', { code });
  return NextResponse.redirect(new URL('/', request.url));
}
```

#### 风险 #3：开发环境端口不一致
**场景**：Cookie 在不同端口间不共享（3000 vs 3004）

**影响**：
- 邀请链接访问 `localhost:3004`
- 注册表单提交到 `localhost:3000`
- Cookie 无法跨端口读取

**缓解措施**：
- 开发环境固定使用单一端口（如 3004）
- 或使用 `domain` 属性设置 Cookie（需测试）

### 低优先级风险

#### 风险 #4：邀请码生成冲突
**位置**：`supabase/migrations/20251210000000_referral_system.sql:139-155`

**当前逻辑**：
- 8 位大写字母+数字组合
- 冲突时重试 10 次
- 失败抛出异常

**风险评估**：
- 组合空间：36^8 = 2.8 万亿
- 冲突概率极低（< 0.0001%）

**建议增强**（P2）：
- 增加重试次数到 20 次
- 或使用 10 位邀请码

### 已知限制

#### 限制 #1：邀请统计实时性
**说明**：
- 统计数据通过 API 查询 `referrals` 表
- 可能存在几秒延迟（数据库同步）
- 不影响功能正确性

#### 限制 #2：里程碑检查时机
**说明**：
- 里程碑仅在注册时通过 `fn_check_milestones()` 检查
- 后续邀请完成时不会重新检查
- 用户需要刷新页面才能看到新达成的里程碑

**建议增强**（P2）：
- 在 `fn_claim_referral_signup` 结束后调用 `fn_check_milestones`
- 或在邀请统计 API 中实时检查

---

## 测试覆盖矩阵

| 场景 | 测试方法 | 预期结果 | 优先级 | 状态 |
|------|----------|----------|--------|------|
| 邀请链接访问 | 浏览器 DevTools | Cookie 设置成功 | P0 | ⏳ 待测试 |
| Cookie 持久性（7天） | 访问后 1 小时再注册 | Cookie 仍然存在 | P1 | ⏳ 待测试 |
| 邀请注册（30积分） | 通过邀请链接注册 | 双方各得 30 积分 | P0 | ⏳ 待测试 |
| Pro 升级（150积分） | Stripe 支付成功 | 双方各得 150 积分 | P0 | ⏳ 待测试 |
| Ultra 升级（900积分+月卡） | Stripe 支付成功 | 付费人 900 积分，邀请人 Pro 月卡 | P0 | ⏳ 待测试 |
| 非邀请用户升级 | 直接注册用户升级 | 正常升级，无额外奖励 | P1 | ⏳ 待测试 |
| 邀请 10 人里程碑 | 第 10 人注册 | 自动创建 invite_10（120积分） | P1 | ⏳ 待测试 |
| Stripe webhook 重复 | 重放 webhook 事件 | 奖励不重复发放 | P1 | ⏳ 待测试 |
| 无效邀请码 | 访问错误邀请码 | 重定向到首页 | P2 | ⏳ 待测试 |
| 已删除账户邀请码 | 访问已删除用户邀请码 | 重定向到首页 | P2 | ⏳ 待测试 |

---

## 下一步行动

### 立即执行（P0）
1. ✅ 提交代码到 `g1/develop`
2. ⏳ 本地测试：Cookie 传递验证
3. ⏳ 本地测试：邀请注册流程
4. ⏳ 本地测试：Pro 升级奖励
5. ⏳ 创建 PR 到 `main`

### 后续增强（P1）
1. Stripe webhook 事件去重（记录 `event_id`）
2. 邀请码校验增强（排除已删除/禁用账户）
3. 里程碑自动检查优化

### 可选优化（P2）
1. 邀请码生成增加重试次数
2. Cookie domain 属性配置（解决跨端口问题）
3. 邀请统计实时性优化

---

## 附录

### 修改文件清单
| 文件 | 修改类型 | 行数变化 | 说明 |
|------|----------|----------|------|
| `CODEX_CLAUDE_COLLAB.md` | 更新 | +11 | 添加 5 组分支规则 |
| `app/api/stripe/webhook/route.ts` | 新增 | +22 | 添加邀请转化奖励调用 |
| `app/ref/[code]/route.ts` | 重构 | +13 / -11 | 修复 Cookie 传递时机 |
| `docs/decisions/2025-12-10-referral-system-bugfix.md` | 新增 | +617 | Architecture Snapshot |
| `docs/plans/workstreams.md` | 更新 | +2 | 添加任务条目 |
| `docs/reports/2025-12-10-g1-referral-bugfix-cavr.md` | 新增 | +456 | 本 CAVR 报告 |

### 数据库函数依赖
```
fn_initialize_profile (注册时调用)
  └─ fn_claim_referral_signup (建立邀请关系)
      ├─ 创建 referrals 记录
      ├─ 发放注册奖励（30 积分）
      ├─ 创建 referral_events 记录
      └─ fn_check_milestones (检查里程碑)

fn_grant_conversion_reward (Stripe webhook 调用) ← 本次新增
  ├─ 查找邀请关系（profiles.referred_by）
  ├─ 更新 referrals 状态
  ├─ 发放升级奖励（Pro: 150积分 / Ultra: 900积分+Pro月卡）
  └─ 创建 referral_events 记录
```

### 相关文档
- **Architecture Snapshot**：`docs/decisions/2025-12-10-referral-system-bugfix.md`
- **协作手册**：`CODEX_CLAUDE_COLLAB.md`
- **任务看板**：`docs/plans/workstreams.md`
- **数据库迁移**：`supabase/migrations/20251210000000_referral_system.sql`
- **邀请面板组件**：`app/components/referral/ReferralPanel.tsx`

---

**报告生成时间**：2025-12-10
**提交哈希**：2a4a8fa
**分支**：g1/develop
**状态**：✅ 代码修复完成，⏳ 待本地测试验证
