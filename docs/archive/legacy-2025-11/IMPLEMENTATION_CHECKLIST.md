# 🚀 积分系统修复 - 完整实施清单

## 状态总览

| 组件              | 状态        | 说明                                                                        |
| ----------------- | ----------- | --------------------------------------------------------------------------- |
| 数据库迁移文件    | ✅ 已创建   | `supabase/migrations/20251130000001_init_user_credits_30.sql` (150 行)      |
| API 错误码处理    | ✅ 已实现   | 401/429/500 正确区分，含 trace 日志                                         |
| 每日奖励 API 端点 | ✅ 已创建   | `app/api/report/daily-reward/route.ts` (59 行)                              |
| 前端服务函数      | ✅ 已创建   | `lib/services/api.ts` 中 `claimDailyReward()` 和 `DailyRewardResponse` 类型 |
| 前端配额加载逻辑  | ✅ 已实现   | `quotaLoaded` 标记，错误分类与显示                                          |
| **待完成**        | 🔄 **就绪** | 执行迁移和测试                                                              |

---

## 第 1 步：应用数据库迁移 (必做)

### 📋 任务

将数据库迁移应用到本地 Supabase，初始化所有用户为 30 积分。

### 🕐 预计时间

3-5 分钟

### 选项 A：使用 Supabase 控制台（推荐）

**步骤**:

1. 打开 Supabase 控制台: https://supabase.com/dashboard
2. 选择你的项目
3. 导航到 **SQL Editor**
4. 点击 **New Query**
5. 打开本地文件：`supabase/migrations/20251130000001_init_user_credits_30.sql`
6. 复制文件全部内容
7. 粘贴到 SQL Editor
8. 点击 **Run** 按钮（右上角）
9. 等待执行完成，应该看到 "Query successful" ✅

**预期输出**:

```
Query successful - X rows affected
```

### 选项 B：使用 Supabase CLI

```bash
cd "D:\Projects\qiltrack-ai-g1"
supabase link  # 如果还未链接
supabase migration up
```

### ✔️ 完成指标

在 SQL Editor 运行以下查询验证迁移成功:

```sql
-- 1. 验证 profiles 默认值已改为 30
SELECT column_default
FROM information_schema.columns
WHERE table_name='profiles' AND column_name='quota_limit';
-- 预期: 30

-- 2. 验证新函数存在
SELECT proname
FROM pg_proc
WHERE proname='fn_claim_daily_reward';
-- 预期: fn_claim_daily_reward

-- 3. 验证新表存在
SELECT table_name
FROM information_schema.tables
WHERE table_name='daily_rewards';
-- 预期: daily_rewards

-- 4. 验证现存用户已初始化（如果有的话）
SELECT COUNT(*) as initialized_users
FROM report_credits;
-- 预期: > 0
```

---

## 第 2 步：测试新账号注册 (强烈建议)

### 📋 任务

验证新注册账号能正确显示 30 积分。

### 🕐 预计时间

3-5 分钟

### 步骤

1. **打开无痕浏览器**:
   - Chrome: Ctrl+Shift+N
   - Firefox: Ctrl+Shift+P
   - Safari: Cmd+Shift+N

2. **访问应用**: `http://localhost:3001/`

3. **点击登录**

4. **注册新账号**:
   - 使用从未用过的邮箱，例如: `test-${Date.now()}@gmail.com`
   - 或访问 Mailpit (http://127.0.0.1:54324) 检查邮件

5. **完成邮箱验证**:
   - 打开邮箱链接完成 OTP 验证
   - 如果无法收到邮件，检查 Mailpit

6. **验证首页配额**:
   - 登录后应该看到首页显示 **30 积分** ✅
   - 不应该是 0，不应该是 1，应该是 **30**

7. **验证账号页配额**:
   - 点击右上角进入设置页面 `/account`
   - 应该也显示 **30 积分** ✅
   - 首页和账号页应该一致

### ❌ 故障排除

| 显示数字 | 可能原因     | 解决方案                   |
| -------- | ------------ | -------------------------- |
| 0        | 迁移未应用   | 重新运行第 1 步迁移        |
| 1        | 旧迁移生效   | 清除缓存，用新邮箱重新注册 |
| 5        | 触发器未更新 | 检查迁移是否完全执行       |
| 30 ✅    | 正常！       | 继续下一步                 |

---

## 第 3 步：测试每日奖励 API (可选但推荐)

### 📋 任务

验证每日奖励 API 端点正常工作。

### 🕐 预计时间

2-3 分钟

### 步骤

1. **登录应用** (使用第 2 步创建的新账号)

2. **打开浏览器开发者工具**:
   - Chrome/Firefox: F12
   - Safari: Cmd+Option+I

3. **切换到 Console 标签**

4. **复制并运行此代码**:

```javascript
fetch("/api/report/daily-reward", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
})
  .then((r) => r.json())
  .then((d) => {
    console.log("响应:", d);
    console.log("success:", d.success);
    console.log("message:", d.message);
    console.log("remaining:", d.remainingCredits);
  })
  .catch((e) => console.error("错误:", e));
```

### ✔️ 预期输出

**第一次调用**:

```javascript
响应: Object { success: true, message: "Daily reward claimed", remainingCredits: 40 }
success: true
message: Daily reward claimed
remaining: 40  // 从 30 增加到 40（+10）
```

**再次调用** (同一天):

```javascript
响应: Object { success: false, message: "Already claimed today", remainingCredits: 0 }
success: false
message: Already claimed today
remaining: 0
```

### 💡 说明

- `success: true` = 领取成功
- `remainingCredits` = 现有总积分（应该从 30 变成 40）
- 同一天内第二次调用应该返回错误
- 明天再试应该能再领取一次

---

## 第 4 步：验证现有账号修复 (可选)

### 📋 任务

确认已修复的账号（如 xiuluart@foxmail.com）现在显示正确的积分。

### 🕐 预计时间

2-3 分钟

### 步骤

1. **登录现有账号**: xiuluart@foxmail.com（或其他有旧数据的账号）

2. **检查首页配额显示**:
   - 应该显示 Supabase `v_user_quota` 视图中的实际值
   - 如果不是 0，恭喜！✅

3. **检查浏览器控制台** (F12):
   - 打开 Network 标签
   - 点击生成报告
   - 查看 `/api/report/credits` 的响应
   - 应该显示 `remaining_credits: X` (不是 0)

4. **生成报告**:
   - 如果有积分 > 0，点击生成应该成功
   - 积分应该减少 1
   - 不应该被重定向到登录页

### ✅ 成功标志

✅ 首页配额正确显示（不是 0）
✅ API 返回真实的 remaining_credits
✅ 可以正常生成报告
✅ 积分正确消耗

---

## 第 5 步：添加前端 UI 按钮 (可选)

### 📋 任务

在首页添加"领取 10 积分"按钮（改进用户体验）。

### ⚠️ 重要说明

- **迁移和 API 已经完全工作**，不需要这一步
- 这一步只是为了让用户能看到按钮并点击
- 如果不需要，可以跳过

### 如果需要，步骤如下：

#### 5.1 编辑 `app/page.tsx`

在首页添加按钮状态和处理函数:

```typescript
const [claimingReward, setClaimingReward] = useState(false);

const handleClaimDailyReward = async () => {
  if (!isAuthenticated) {
    onRequireLogin();
    return;
  }

  setClaimingReward(true);
  try {
    const result = await claimDailyReward();
    if (result.success) {
      await refreshQuota();
      alert("每日奖励已领取！");
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert("领取失败，请重试");
  } finally {
    setClaimingReward(false);
  }
};
```

在 JSX 中添加按钮:

```tsx
<button
  onClick={handleClaimDailyReward}
  disabled={claimingReward || !isAuthenticated}
  className="rounded-full border border-emerald-400 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-400/10"
>
  {claimingReward ? "正在领取..." : "领取 10 积分"}
</button>
```

添加导入:

```typescript
import { claimDailyReward } from "@/lib/services/api";
```

#### 5.2 添加国际化文本 (可选)

编辑 `lib/i18n.tsx`，添加:

```typescript
"quota.daily.claim": {
  "en": "Claim 10 credits",
  "ja": "10クレジットを取得",
  "ko": "10 크레딧 받기",
  "zh-Hant": "領取 10 積分",
  "zh-Hans": "领取 10 积分",
},
"quota.daily.claimed": {
  "en": "Already claimed today",
  "ja": "本日はすでに取得しました",
  "ko": "오늘 이미 받았습니다",
  "zh-Hant": "今日已領取",
  "zh-Hans": "今日已领取",
},
```

#### 5.3 检查代码

```bash
npm run lint
```

应该没有错误。

---

## 🎯 完成检查表

### 必做项

- [ ] 迁移已应用 (SQL Editor "Query successful")
- [ ] 新账号首页显示 30 积分
- [ ] 新账号账号页面显示 30 积分
- [ ] 首页和账号页数字一致
- [ ] `npm run lint` 通过（无错误）

### 可选项

- [ ] 每日奖励 API 可以调用成功 (POST /api/report/daily-reward 返回 success: true)
- [ ] 首次调用返回 remainingCredits: 40
- [ ] 第二次调用同一天返回错误信息
- [ ] 现有账号 (xiuluart@foxmail.com) 不再显示 0 积分
- [ ] 前端添加了"领取"按钮
- [ ] 按钮功能正常工作

---

## 🚨 故障排除

### 问题 1: 迁移执行失败

**错误**:

```
Error: Relation "daily_rewards" already exists
```

**解决**: 这是正常的，说明迁移已经应用过了。继续下一步。

---

### 问题 2: 新账号仍显示 0 积分

**可能原因**:

1. 迁移未应用
2. 浏览器缓存
3. 新账号刚创建，数据未同步

**解决步骤**:

1. 确认 SQL Editor 迁移查询显示 "Query successful"
2. 清除浏览器缓存: Ctrl+Shift+Delete
3. 用无痕浏览器重新尝试
4. 检查服务器日志是否有错误

---

### 问题 3: API 返回 401

**原因**: 没有登录或会话过期

**解决**: 重新登录

---

### 问题 4: API 返回 500

**原因**: `daily_rewards` 表或 `fn_claim_daily_reward` 函数不存在

**解决**: 检查迁移是否完全运行

---

### 问题 5: 看不到 Mailpit 邮件

**原因**: Mailpit 未运行或端口不对

**解决**:

```bash
# 确认 Mailpit 运行在 http://127.0.0.1:54324
# 检查你的开发环境配置
```

---

## 📞 技术支持

### 快速查询

| 问题               | 查询语句                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------- |
| 某用户当前积分     | `SELECT credits_available FROM report_credits WHERE user_id = 'user-id';`                |
| 某用户积分历史     | `SELECT * FROM report_credit_events WHERE user_id = 'user-id' ORDER BY created_at DESC;` |
| 某用户是否今日领取 | `SELECT last_claimed FROM daily_rewards WHERE user_id = 'user-id';`                      |
| 所有用户统计       | `SELECT COUNT(*) FROM report_credits;`                                                   |

---

## 🎉 预期成果

完成以上步骤后：

✅ **新账号** - 自动获得 30 积分（首页、账号页一致）
✅ **每日奖励** - 用户每天可主动领取 10 积分
✅ **积分消耗** - 生成报告每次消耗 1 积分
✅ **完整历史** - 每次操作都记录到 audit log
✅ **错误提示** - 401/429/500 正确区分并提示用户

---

## 📈 下一步计划

完成基础修复后，可以考虑：

1. **推荐系统** - 邀请好友 +50 积分
2. **任务系统** - 完成任务 +5~20 积分
3. **会员等级** - VIP 用户每日 +20 积分
4. **积分商城** - 用积分购买功能
5. **排行榜** - 显示积分排名

---

**预计总时间**: 10-15 分钟
**难度**: ⭐⭐ 中等
**风险**: 🟢 低（所有操作幂等）

祝实施顺利！🚀
