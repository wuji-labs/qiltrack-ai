# 🎯 积分系统完全修复方案 - 总览

> **状态**: ✅ **完全准备就绪**
> **日期**: 2025-11-30
> **预计时间**: 15-20 分钟
> **难度**: ⭐⭐ 中等

---

## 🚨 问题概述

你发现的问题完全正确：

```
新账号注册后：
├─ 首页显示: 0 积分 ❌（应该 30）
├─ 账号页显示: 1 积分 ❌（应该 30）
└─ 无法主动获取更多积分 ❌（应该每日 +10）
```

**根本原因**：

1. 新用户注册时，`report_credits` 表没有正确初始化
2. 初始值设得太小（5 而不是 30）
3. 没有日常奖励机制让用户主动获取积分

---

## ✨ 解决方案已准备完成

### 📦 已自动化创建

| 类别         | 文件                                                          | 用途                      |
| ------------ | ------------------------------------------------------------- | ------------------------- |
| **DB 迁移**  | `supabase/migrations/20251130000001_init_user_credits_30.sql` | 初始化 30 积分 + 每日奖励 |
| **API 端点** | `app/api/report/daily-reward/route.ts`                        | 处理领取请求              |
| **服务层**   | `lib/services/api.ts`                                         | 前端 API 调用             |
| **文档**     | 5 份详细文档                                                  | 指导和参考                |

### 🎬 三步快速启动

#### 1️⃣ 应用迁移（3 分钟）✨ **最关键**

```bash
# 选项 A：使用 Supabase 控制台（推荐）
1. 登录 Supabase 仪表盘
2. SQL Editor → New Query
3. 复制 supabase/migrations/20251130000001_init_user_credits_30.sql 内容
4. 粘贴并点击 Run
5. ✅ 完成！

# 选项 B：使用 CLI
cd D:\Projects\qiltrack-ai-g1
supabase migration up
```

**结果**：新账号自动获得 30 积分 ✅

#### 2️⃣ 验证修改（1 分钟）

在 Supabase SQL Editor 运行：

```sql
-- 检查默认值已更新
SELECT column_default FROM information_schema.columns
WHERE table_name='profiles' AND column_name='quota_limit';
-- 应返回: 30

-- 检查新函数存在
SELECT proname FROM pg_proc WHERE proname='fn_claim_daily_reward';
-- 应返回: fn_claim_daily_reward

-- 检查新表存在
SELECT table_name FROM information_schema.tables WHERE table_name='daily_rewards';
-- 应返回: daily_rewards
```

#### 3️⃣ 测试新账号（2 分钟）

用新邮箱注册 → 完成邮箱验证 → 进入 `/account` → **应显示 30 积分** ✅

---

## 📱 前端集成（可选，10 分钟）

如果想让用户能点击按钮领取奖励：

1. 编辑 `app/page.tsx`，添加"领取 10 积分"按钮
2. 编辑 `lib/i18n.tsx`，添加翻译
3. 运行 `npm run lint` 检查
4. 完成！

详见 `ACTION_CHECKLIST.md` 的第 4 步。

---

## 📚 文档导航

### 👨‍💻 开发者必读

| 文档                                         | 内容                    | 何时阅读       |
| -------------------------------------------- | ----------------------- | -------------- |
| 📖 **ACTION_CHECKLIST.md**                   | 完整执行清单 + 故障排除 | **首先读这个** |
| 📖 **CREDITS_SYSTEM_QUICK_FIX.md**           | 5 分钟快速指南          | 想快速上手     |
| 📖 **CREDITS_FIX_SUMMARY.md**                | 详细总结 + FAQ          | 想了解全貌     |
| 📖 **ARCHITECTURE_AND_DATA_FLOW.md**         | 架构图 + 数据流         | 想深入理解     |
| 📖 **2025-11-30-credits-system-solution.md** | 完整设计文档            | 想看完整方案   |

### 📂 代码文件

```
supabase/
└─ migrations/
   └─ 20251130000001_init_user_credits_30.sql    【新增】

app/api/report/
└─ daily-reward/route.ts                         【新增】

lib/services/
└─ api.ts                                        【修改】
```

---

## 🎯 预期效果

### 修复前 ❌

```
新账号注册
  ├─ 首页: 0 积分
  ├─ 账号: 1 积分
  └─ 无法获取更多
```

### 修复后 ✅

```
新账号注册
  ├─ 首页: 30 积分
  ├─ 账号: 30 积分
  ├─ 每日领取: +10 积分
  └─ 生成报告: -1 积分（可进行 30 次）
```

---

## ⚡ 关键改动

### 数据库 (新迁移)

```sql
-- 修改 profiles 默认值
profiles.quota_limit DEFAULT 1 → 30

-- 初始化现存用户
INSERT INTO report_credits ... (30 积分)

-- 新增表
daily_rewards (记录每日领取)

-- 新增函数
fn_claim_daily_reward() (领取 +10 积分)
fn_initialize_profile() 更新 (初始化 30)
```

### 后端 API

```
POST /api/report/daily-reward
├─ 认证检查 (401)
├─ 调用 RPC 函数
└─ 返回 { success, message, remainingCredits }
```

### 前端服务

```typescript
claimDailyReward(): Promise<DailyRewardResponse>
```

---

## 🔒 安全性保证

✅ **原子性**：所有数据库操作都通过行级锁保证
✅ **幂等性**：同一用户同一天无法重复领取
✅ **审计性**：每次操作都有完整日志记录
✅ **隔离性**：RLS 确保用户只能访问自己的数据

---

## 📊 技术指标

| 指标          | 值                        |
| ------------- | ------------------------- |
| 代码行数      | ~200 行 SQL + 50 行 TS    |
| 新增表        | 1 个 (daily_rewards)      |
| 新增函数      | 2 个 (更新) + 1 个 (新)   |
| 新增 API 端点 | 1 个                      |
| 修改文件      | 2 个                      |
| 风险等级      | 🟢 低                     |
| 回滚难度      | 简单 (IF NOT EXISTS 保护) |

---

## 🚀 立即开始

### 第一步：阅读执行清单

👉 **打开**: `docs/ACTION_CHECKLIST.md`

### 第二步：应用数据库迁移

1. 打开 Supabase 仪表盘
2. SQL Editor
3. 运行迁移 SQL
4. ✅ 完成

### 第三步（可选）：前端集成

参考清单中的第 4 步，添加按钮

### 第四步：测试验证

新账号注册 → 检查 30 积分 → ✅ 成功

---

## 💡 核心概念

### 三大机制

#### 1️⃣ **初始化**

```
注册 → fn_initialize_profile → 创建 profile + 30 积分 + 事件日志
```

#### 2️⃣ **消耗**

```
生成报告 → fn_consume_report_credit → 扣除 1 积分 + 记录
```

#### 3️⃣ **获取**

```
每日点击 → fn_claim_daily_reward → +10 积分 + 更新 streak
```

### 数据一致性

```
report_credits (单一真实源)
├─ credits_available (当前可用)
└─ credits_used (已使用)

report_credit_events (审计日志)
├─ event_type: 'granted' | 'consumed' | 'daily_reward'
└─ delta: 积分变化

daily_rewards (权限检查)
├─ last_claimed (最后领取时间)
└─ streak_count (连续天数)
```

---

## ❓ 常见问题

**Q: 迁移需要备份吗？**
A: 建议备份，但迁移是幂等的，安全性高

**Q: 现存用户会补充到 30 吗？**
A: 是的，迁移会自动补充

**Q: 没有前端按钮可以使用吗？**
A: 可以，迁移独立生效。前端是可选的，为了用户体验

**Q: 如何查看用户的积分历史？**
A: 查询 `report_credit_events` 表

**Q: 能改成 100 积分吗？**
A: 可以，修改迁移中的数字再运行

---

## 📞 支持

如有问题，请按优先级检查：

1. ✅ 迁移是否已应用？（查看 Supabase Migrations 标签）
2. ✅ 新表是否存在？（查询 `daily_rewards`）
3. ✅ 新函数是否存在？（查询 `fn_claim_daily_reward`）
4. ✅ 新账号是否有 30 积分？（实际测试）

---

## 📈 下一步

完成基础修复后，可以考虑：

- 添加推荐好友奖励 (+50)
- 添加任务系统 (完成任务 +5)
- 添加会员等级制 (VIP 每日 +20)
- 添加积分商城 (消费积分)

---

**🎉 祝修复顺利！**

预计 15-20 分钟完成，没有复杂问题。所有代码都已准备好，只需应用迁移即可！

👉 **现在就开始**: 打开 `docs/ACTION_CHECKLIST.md`
