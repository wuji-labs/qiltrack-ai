# ✅ 积分系统修复 - 执行清单

## 📋 核心任务

### ✨ 已完成（自动化，无需手动）

- [x] 创建数据库迁移文件
  - 文件: `supabase/migrations/20251130000001_init_user_credits_30.sql`
  - 包含: 修改默认值 + 初始化现存用户 + 新增函数表
  - 备注: 所有操作都是幂等的（IF NOT EXISTS）

- [x] 创建 API 端点
  - 文件: `app/api/report/daily-reward/route.ts`
  - 功能: 处理每日奖励领取
  - 安全: 需要认证 + 错误处理

- [x] 更新 API 服务
  - 文件: `lib/services/api.ts`
  - 添加: `claimDailyReward()` 函数
  - 类型: `DailyRewardResponse` 定义

- [x] 生成文档
  - `CREDITS_FIX_SUMMARY.md` - 总结
  - `CREDITS_SYSTEM_QUICK_FIX.md` - 快速指南
  - `2025-11-30-credits-system-solution.md` - 详细设计
  - `ARCHITECTURE_AND_DATA_FLOW.md` - 架构图

---

## 🎯 你需要做的

### 第 1 步：应用数据库迁移 ⭐⭐⭐（必做）

**时间估计**: 3 分钟
**难度**: ⭐ 简单
**后果**: 不做的话新账号永远是 0 积分

#### 选项 A：使用 Supabase 控制台（推荐）

- [ ] 登录 Supabase 仪表盘
- [ ] 点击 "SQL Editor"
- [ ] 点击 "New Query"
- [ ] 打开文件: `supabase/migrations/20251130000001_init_user_credits_30.sql`
- [ ] 复制全部内容
- [ ] 粘贴到 SQL Editor
- [ ] 点击 "Run" 按钮
- [ ] 等待完成（应该显示 "Query successful"）

#### 选项 B：使用 Supabase CLI（可选）

```bash
# 在项目目录运行
cd D:\Projects\qiltrack-ai-g1
supabase migration list      # 查看现有迁移
supabase migration up        # 应用所有待处理迁移
```

**验证成功**:

```sql
-- 在 SQL Editor 运行这些查询
SELECT column_default FROM information_schema.columns
WHERE table_name='profiles' AND column_name='quota_limit';
-- 应返回: 30

SELECT EXISTS(SELECT 1 FROM pg_tables WHERE tablename='daily_rewards');
-- 应返回: true

SELECT proname FROM pg_proc WHERE proname='fn_claim_daily_reward';
-- 应返回: fn_claim_daily_reward
```

✅ 如果上面都通过，迁移成功！

---

### 第 2 步：测试新账号 ⭐⭐（强烈建议）

**时间估计**: 3 分钟
**难度**: ⭐ 简单
**目的**: 验证修复是否有效

- [ ] 用浏览器**无痕模式**打开应用
- [ ] 点击"登录"
- [ ] 用从未用过的邮箱注册（如: `test-230130-xyz@gmail.com`）
- [ ] 检查邮箱，点击登录链接完成邮箱验证
- [ ] 登录成功后，进入个人设置页面 `/account`
- [ ] **验证**: 应该显示 **30 积分** ✅

如果显示其他数字:

- 显示 0: 迁移可能未应用，重试第 1 步
- 显示 1: 清除浏览器缓存重试
- 显示 5: 触发器未生效，检查迁移日志

---

### 第 3 步：测试每日奖励 API ⭐⭐（可选）

**时间估计**: 2 分钟
**难度**: ⭐⭐ 中等
**目的**: 验证领取功能是否可用

- [ ] 登录账号
- [ ] 打开浏览器开发者工具 (F12)
- [ ] 切换到 "Console" 标签
- [ ] 复制并运行以下代码:

```javascript
fetch("/api/report/daily-reward", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
})
  .then((r) => r.json())
  .then((d) => {
    console.log("Response:", d);
    console.log("Success:", d.success);
    console.log("Message:", d.message);
    console.log("Remaining:", d.remainingCredits);
  })
  .catch((e) => console.error("Error:", e));
```

**预期输出**:

```
Response: Object { success: true, message: "Daily reward claimed", remainingCredits: 40 }
Success: true
Message: Daily reward claimed
Remaining: 40
```

**验证**:

- [ ] `success` 是 `true`
- [ ] `remainingCredits` 从 30 增加到 40（+10）
- [ ] 再运行一次，应该返回错误信息

---

### 第 4 步：前端集成 ⭐⭐⭐（可选但推荐）

**时间估计**: 10 分钟
**难度**: ⭐⭐ 中等
**目的**: 用户可以点击按钮领取奖励

#### 4.1 在首页添加按钮

编辑文件: `app/page.tsx`

找到位置: 首页顶部的配额显示卡片附近

添加状态:

```typescript
const [claimingReward, setClaimingReward] = useState(false);
```

添加函数:

```typescript
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

添加导入 (在文件顶部):

```typescript
import { claimDailyReward } from "@/lib/services/api";
```

添加按钮 (在 JSX 中):

```tsx
<button
  onClick={handleClaimDailyReward}
  disabled={claimingReward || !isAuthenticated}
  className="rounded-full border border-emerald-400 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-400/10"
>
  {claimingReward ? "正在领取..." : "领取 10 积分"}
</button>
```

#### 4.2 添加国际化文本

编辑文件: `lib/i18n.tsx`

找到位置: 最后一个翻译键的后面（在关闭大括号前）

添加:

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

#### 4.3 检查代码

- [ ] 运行 `npm run lint` 检查是否有错误
- [ ] 应该显示 "✓ Passed linting" 或无错误
- [ ] 如果有错误，根据提示修复

#### 4.4 测试前端功能

- [ ] 刷新页面
- [ ] 应该看到"领取 10 积分"按钮
- [ ] 点击按钮 → 应该显示成功消息并更新配额
- [ ] 再次点击 → 应该显示"已领取"错误
- [ ] 明天（或改系统时间）再试 → 应该能再领取

---

## 🚨 故障排除

### 问题 1: 新账号仍显示 0 积分

**可能原因**:

1. 迁移未应用
2. 缓存问题
3. 浏览器 Cookie

**解决步骤**:

- [ ] 确认迁移已运行 (查看 Supabase "Migrations" 选项卡)
- [ ] 用完全新邮箱注册
- [ ] 用无痕浏览器测试
- [ ] 检查服务器日志是否有错误

### 问题 2: 迁移执行失败

**可能原因**:

1. SQL 语法错误
2. 权限不足
3. 表名冲突

**解决步骤**:

- [ ] 查看错误消息详情
- [ ] 确保复制了完整的 SQL
- [ ] 检查 `report_credits` 表是否已存在
- [ ] 尝试手动运行 `DROP TABLE IF EXISTS daily_rewards;` 后重新迁移

### 问题 3: API 返回 500

**可能原因**:

1. `daily_rewards` 表不存在
2. RLS 策略缺失
3. 函数权限问题

**解决步骤**:

- [ ] 查看服务器日志
- [ ] 检查 daily_rewards 表是否存在
- [ ] 验证 RLS 策略是否已创建
- [ ] 检查错误日志中的具体错误信息

### 问题 4: "Already claimed today" 提示一直出现

**可能原因**:

1. 系统时间不对
2. 时区设置问题

**解决步骤**:

- [ ] 检查服务器时间: `SELECT CURRENT_TIMESTAMP;`
- [ ] 检查时区设置
- [ ] 等待真正的新一天（或在开发环境修改时间）

---

## 📝 最终检查表

### 必做项

- [ ] 迁移已应用
- [ ] 新账号显示 30 积分
- [ ] 代码无 lint 错误
- [ ] API 可以调用成功

### 可选项

- [ ] 前端添加了按钮
- [ ] 多语言文本已添加
- [ ] 按钮功能可正常使用
- [ ] 所有页面都清晰可读

---

## 🎉 成功标志

当你看到这些，说明修复成功了：

✅ 新账号首页显示 30 积分
✅ 账号页面显示 30 积分
✅ 可以成功调用领取 API
✅ 积分变动有完整历史记录
✅ 用户每天可领取 10 积分

---

## 📞 需要帮助？

| 问题           | 查看文档                                   |
| -------------- | ------------------------------------------ |
| 不知道怎么开始 | 📖 `CREDITS_SYSTEM_QUICK_FIX.md`           |
| 需要代码示例   | 📖 `ARCHITECTURE_AND_DATA_FLOW.md`         |
| 想了解设计细节 | 📖 `2025-11-30-credits-system-solution.md` |
| 想看完整总结   | 📖 `CREDITS_FIX_SUMMARY.md`                |

---

**预计总时间**: 15-20 分钟
**难度**: ⭐⭐ 中等
**风险**: 🟢 低

开始修复吧！🚀
