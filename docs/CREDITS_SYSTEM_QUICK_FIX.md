# 积分系统 - 立即行动指南

## 🎬 5 分钟快速修复

### 第一步：应用数据库迁移（5 分钟）

**选项 A - 使用 Supabase 控制台**（推荐新手）

1. 登录 Supabase 仪表盘 → SQL Editor
2. 复制以下内容执行：

```sql
-- 粘贴 supabase/migrations/20251130000001_init_user_credits_30.sql 的全部内容
```

3. 点击"Run"，等待完成

**选项 B - 使用 Supabase CLI**（推荐开发者）

```bash
cd D:\Projects\investor-ai-g1
supabase migration up
```

### 第二步：验证修改生效（2 分钟）

在 Supabase SQL Editor 执行：

```sql
-- 检查 profiles 默认值
SELECT column_name, column_default FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'quota_limit';
-- 应该显示: DEFAULT 30

-- 检查函数是否存在
SELECT proname FROM pg_proc WHERE proname = 'fn_claim_daily_reward';
-- 应该返回: fn_claim_daily_reward

-- 检查新表是否存在
SELECT table_name FROM information_schema.tables WHERE table_name = 'daily_rewards';
-- 应该返回: daily_rewards
```

### 第三步：测试新账号注册（2 分钟）

1. 使用浏览器无痕窗口（避免缓存）
2. 登录 http://localhost:3000 或你的应用 URL
3. 用新邮箱注册
4. 点击邮箱链接或通过 Google OAuth 完成
5. **验证**: 进入个人设置页面，检查是否显示 30 积分

### 第四步：测试每日奖励 API

在浏览器控制台执行：

```javascript
// 替换 YOUR_TOKEN 为实际的认证 token
fetch("/api/report/daily-reward", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((r) => r.json())
  .then((data) => console.log(data));

// 预期输出: { success: true, message: "Daily reward claimed", remainingCredits: 40 }
```

## 📱 前端集成（5-10 分钟）

### 在首页添加"领取每日奖励"按钮

编辑 `app/page.tsx`：

```typescript
import { claimDailyReward } from "@/lib/services/api";

// 在 Home 组件中添加：
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
      await refreshQuota(); // 刷新配额显示
      alert(t("quota.daily.claimed")); // 需要先添加翻译
    } else {
      alert(result.message);
    }
  } catch (err) {
    console.error("Claim daily reward error:", err);
    alert(t("quota.daily.error") || "Failed to claim reward");
  } finally {
    setClaimingReward(false);
  }
};
```

在 JSX 中添加按钮（放在配额卡片附近）：

```tsx
<button
  onClick={handleClaimDailyReward}
  disabled={claimingReward || !isAuthenticated}
  className="rounded-full border border-emerald-400 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-400/10"
>
  {claimingReward ? t("quota.status.refreshing") : "领取 10 积分"}
</button>
```

### 添加国际化文本

编辑 `lib/i18n.tsx`，在 translations 对象中添加：

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
"quota.daily.error": {
  "en": "Failed to claim daily reward",
  "ja": "毎日の報酬の取得に失敗しました",
  "ko": "일일 보상 받기 실패",
  "zh-Hant": "領取每日獎勵失敗",
  "zh-Hans": "领取每日奖励失败",
},
```

## ✅ 完整清单

- [ ] 第一步：应用数据库迁移
- [ ] 第二步：SQL 查询验证
- [ ] 第三步：测试新账号（应显示 30 积分）
- [ ] 第四步：测试 API（调用应 +10 积分）
- [ ] 第五步：修改 `app/page.tsx`（添加按钮）
- [ ] 第六步：修改 `lib/i18n.tsx`（添加文本）
- [ ] 第七步：运行 `npm run lint` 确保无错误
- [ ] 第八步：手动测试领取按钮
  - [ ] 未登录点击 → 跳转登录
  - [ ] 首次登录点击 → 显示成功，积分 +10
  - [ ] 再次点击 → 显示 "Already claimed today"
  - [ ] 明天再测 → 可以再领

## 🆘 故障排除

| 症状               | 原因                   | 修复方法                               |
| ------------------ | ---------------------- | -------------------------------------- |
| 迁移执行失败       | SQL 语法错误或权限不足 | 检查迁移文件，确保 service role 有权限 |
| 新账号仍显示 0     | 触发器未生效           | 重新创建触发器或手动插入数据           |
| API 返回 401       | 未登录                 | 先登录再调用                           |
| API 返回 500       | daily_rewards 表不存在 | 检查第二步的验证是否通过               |
| 同一用户可领取多次 | RLS 策略不完整         | 检查 daily_rewards 表的 RLS 策略       |

## 📊 预期结果

### 迁移前

```
新账号 → 显示 0 积分 ❌
账号页面 → 显示 1 ❌
无法获取更多积分 ❌
```

### 迁移后

```
新账号 → 显示 30 积分 ✅
账号页面 → 显示 30 积分 ✅
每日可领取 10 积分 ✅
积分变动有完整记录 ✅
```

## 🔗 相关文件

| 文件                                                        | 修改内容                |
| ----------------------------------------------------------- | ----------------------- |
| supabase/migrations/20251130000001_init_user_credits_30.sql | 数据库迁移 + 函数       |
| app/api/report/daily-reward/route.ts                        | 新 API 端点             |
| lib/services/api.ts                                         | 添加 claimDailyReward() |
| app/page.tsx                                                | 添加按钮（待做）        |
| lib/i18n.tsx                                                | 添加翻译（待做）        |

## 💬 反馈

如有问题，请检查：

1. 迁移是否已应用（查看 Supabase "Migrations" 选项卡）
2. 新账号的 report_credits 是否有记录（query the table directly）
3. API 日志是否有错误（check server console）
4. 浏览器缓存（尝试无痕窗口）

---

**预计完成时间**: 15-20 分钟
**难度**: ⭐⭐ (中等)
**风险**: 🟢 低 (所有操作均带 IF NOT EXISTS 保护)
