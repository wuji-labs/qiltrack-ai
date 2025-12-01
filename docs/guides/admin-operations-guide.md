# Admin 操作手册

> **最后更新**: 2025-12-01
> **适用版本**: v2.0 (三层架构重构后)

---

## 目录

1. [访问 Admin 面板](#访问-admin-面板)
2. [用户管理](#用户管理)
3. [积分管理](#积分管理)
4. [报告管理](#报告管理)
5. [审计日志](#审计日志)
6. [常见操作](#常见操作)
7. [故障排查](#故障排查)

---

## 访问 Admin 面板

### 1. 登录要求

Admin 面板仅对具有管理员权限的用户开放：

- **URL**: `https://your-domain.com/admin`
- **本地开发**: `http://localhost:3000/admin`
- **权限要求**: `profiles.role` 必须为 `admin` 或 `superadmin`

### 2. 首次登录

```bash
# 1. 使用普通方式登录应用
# 2. 在 Supabase Dashboard 中将用户角色设置为 admin

# 或使用 SQL:
UPDATE profiles
SET role = 'admin'
WHERE id = 'your-user-id';
```

### 3. 面板结构

```
/admin
├── /               # Dashboard (统计概览)
├── /users          # 用户管理
├── /credits        # 积分管理
├── /reports        # 报告管理
└── /audit          # 审计日志
```

---

## 用户管理

### 查看用户列表

**路径**: `/admin/users`

#### 功能
- 📋 查看所有注册用户
- 🔍 按邮箱、用户名搜索
- 📊 查看用户积分余额
- 📅 查看注册时间

#### 用户信息字段

| 字段 | 说明 | 示例 |
|------|------|------|
| `id` | 用户 UUID | `123e4567-e89b-12d3-a456-426614174000` |
| `email` | 邮箱地址 | `user@example.com` |
| `role` | 用户角色 | `user` / `admin` / `superadmin` |
| `created_at` | 注册时间 | `2025-12-01T10:00:00Z` |

### 查看用户详情

**路径**: `/admin/users/[id]`

点击用户列表中的「查看」按钮，可以查看：
- 基本信息
- 积分余额
- 报告生成历史
- 积分交易记录

### 编辑用户信息

**路径**: `/admin/users/[id]/edit`

可编辑字段：
- ✅ 用户角色 (`role`)
- ✅ 用户名 (`username`)
- ❌ 邮箱 (通过 Supabase Auth 管理)
- ❌ 密码 (用户自行修改)

**示例：提升用户为管理员**

```typescript
// 在编辑页面
role: "admin"  // 从下拉选择
```

---

## 积分管理

### 查看积分列表

**路径**: `/admin/credits`

#### 功能
- 📋 查看所有用户的积分余额
- 📊 查看积分使用情况
- ➕ 授予用户积分
- 📈 查看积分交易历史

#### 积分信息字段

| 字段 | 说明 |
|------|------|
| `user_id` | 用户 ID |
| `credits_available` | 可用积分 |
| `credits_used` | 已使用积分 |
| `last_daily_reward` | 上次每日奖励时间 |
| `streak_count` | 连续签到天数 |

### 授予积分

**步骤**：

1. 在 `/admin/credits` 页面找到「授予积分」表单
2. 选择目标用户
3. 输入积分数量（正整数）
4. 输入原因（可选，建议填写）
5. 点击「授予」

**示例**：

```typescript
// 表单数据
{
  target_user_id: "123e4567-e89b-12d3-a456-426614174000",
  amount: 10,
  reason: "补偿因系统故障导致的报告生成失败"
}
```

**注意事项**：
- ✅ 积分数量必须为正整数
- ✅ 系统会自动记录操作到审计日志
- ✅ 系统会自动创建积分交易记录
- ❌ 不能授予负数积分（如需扣除，请联系技术团队）

### 查看积分交易历史

**路径**: `/admin/credits` → 点击用户 → 「交易记录」

显示信息：
- 交易类型（`earn`, `consume`, `grant`, `refund`）
- 交易金额
- 交易时间
- 关联报告（如有）
- 元数据（原因等）

---

## 报告管理

### 查看报告列表

**路径**: `/admin/reports`

#### 功能
- 📋 查看所有生成的报告
- 🔍 按股票代码、用户搜索
- 📊 查看报告状态
- 🗑️ 删除报告

#### 报告信息字段

| 字段 | 说明 |
|------|------|
| `id` | 报告 Run ID |
| `user_id` | 生成用户 |
| `symbol` | 股票代码 |
| `language` | 语言 |
| `tone` | 报告风格 |
| `status` | 报告状态 (`completed`, `failed`) |
| `created_at` | 生成时间 |

### 查看报告内容

点击报告列表中的「查看」按钮：
- 查看完整报告内容
- 查看市场数据快照
- 查看生成参数

### 删除报告

**注意事项**：
- ⚠️ 删除报告不会返还用户积分
- ⚠️ 删除操作不可逆
- ✅ 删除会记录到审计日志
- ✅ 会同时删除 Storage 中的 JSON 文件

**步骤**：
1. 找到需要删除的报告
2. 点击「删除」按钮
3. 确认删除

---

## 审计日志

### 查看审计日志

**路径**: `/admin/audit`

#### 日志类型

| 类型 | 说明 |
|------|------|
| `report.generated` | 报告生成成功 |
| `report.failed` | 报告生成失败 |
| `credits.granted` | 管理员授予积分 |
| `credits.consumed` | 用户消费积分 |
| `user.role_changed` | 用户角色变更 |
| `report.deleted` | 报告被删除 |

#### 日志字段

```typescript
{
  id: string;                    // 日志 ID
  user_id: string;               // 操作用户
  action: string;                // 操作类型
  resource_type: string;         // 资源类型
  resource_id: string;           // 资源 ID
  metadata: Record<string, any>; // 元数据
  created_at: string;            // 操作时间
}
```

### 筛选日志

- 按用户筛选
- 按操作类型筛选
- 按时间范围筛选
- 按资源类型筛选

---

## 常见操作

### 1. 用户反馈积分异常

**场景**: 用户报告积分被错误扣除

**处理流程**：

1. 访问 `/admin/audit`，搜索该用户的积分交易记录
2. 确认异常交易记录
3. 访问 `/admin/credits`，为用户补充积分
4. 在原因中填写详细说明

```typescript
// 示例
{
  target_user_id: "user-id",
  amount: 1,
  reason: "补偿订单 #12345 因系统错误导致的双重扣费"
}
```

### 2. 报告生成失败

**场景**: 用户报告生成报告时失败但积分已扣除

**处理流程**：

1. 访问 `/admin/audit`，查找该用户的 `report.failed` 记录
2. 确认积分是否已扣除（查看 `credits.consumed` 记录）
3. 如已扣除，访问 `/admin/credits` 退还积分
4. 在原因中注明故障单号

```typescript
{
  target_user_id: "user-id",
  amount: 1,
  reason: "退还因报告生成失败 (report_run_id: xxx) 导致的积分消耗"
}
```

### 3. 批量授予积分

**场景**: 活动奖励，需要给多个用户授予积分

**处理流程**：

目前需要逐个授予。未来版本会支持批量操作。

**临时方案（技术团队）**：

```sql
-- 示例：给所有 2025-12-01 注册的用户授予 5 积分
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id FROM profiles
    WHERE created_at::date = '2025-12-01'
  LOOP
    UPDATE report_credits
    SET credits_available = credits_available + 5
    WHERE user_id = user_record.id;

    INSERT INTO report_credit_events (user_id, amount, event_type, metadata)
    VALUES (user_record.id, 5, 'earn', '{"reason": "2025-12-01 注册活动奖励"}');
  END LOOP;
END $$;
```

### 4. 查询用户报告生成历史

**场景**: 用户询问历史报告

**处理流程**：

1. 访问 `/admin/users`，搜索用户邮箱
2. 点击「查看」进入用户详情
3. 查看「报告生成历史」部分
4. 复制报告链接发送给用户

---

## 故障排查

### 问题 1: 无法访问 Admin 面板

**症状**: 访问 `/admin` 时重定向到首页或显示 403

**可能原因**：
1. 用户角色不是 `admin` 或 `superadmin`
2. Session 过期

**解决方案**：

```sql
-- 1. 检查用户角色
SELECT id, email, role FROM profiles WHERE email = 'user@example.com';

-- 2. 如果角色不对，更新为 admin
UPDATE profiles SET role = 'admin' WHERE id = 'user-id';

-- 3. 重新登录
```

### 问题 2: 授予积分失败

**症状**: 点击「授予」后显示错误

**可能原因**：
1. 用户不存在
2. 积分数量无效
3. RPC 函数权限问题

**解决方案**：

```sql
-- 1. 检查用户是否存在
SELECT * FROM profiles WHERE id = 'user-id';

-- 2. 检查 RPC 函数
SELECT * FROM pg_proc WHERE proname = 'fn_grant_credits';

-- 3. 手动授予积分
UPDATE report_credits
SET credits_available = credits_available + 10
WHERE user_id = 'user-id';
```

### 问题 3: 统计数据不准确

**症状**: Dashboard 显示的统计数据与实际不符

**可能原因**：
1. 缓存问题
2. 数据库查询错误

**解决方案**：

```typescript
// 刷新页面
window.location.reload();

// 或清除浏览器缓存
```

### 问题 4: 报告列表加载缓慢

**症状**: `/admin/reports` 页面加载超过 5 秒

**可能原因**：
1. 报告数量过多
2. 缺少索引

**解决方案**：

```sql
-- 添加索引（如果未添加）
CREATE INDEX IF NOT EXISTS idx_report_posts_user_id ON report_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_report_posts_created_at ON report_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_posts_symbol ON report_posts(symbol);

-- 清理旧报告（可选）
DELETE FROM report_posts WHERE created_at < NOW() - INTERVAL '90 days' AND status = 'failed';
```

---

## 数据备份

### 定期备份

Admin 应定期备份关键数据：

```bash
# 备份用户数据
supabase db dump -f backup-profiles-$(date +%Y%m%d).sql --data-only --table profiles

# 备份积分数据
supabase db dump -f backup-credits-$(date +%Y%m%d).sql --data-only --table report_credits

# 备份报告数据
supabase db dump -f backup-reports-$(date +%Y%m%d).sql --data-only --table report_posts
```

---

## 安全最佳实践

### 1. 权限管理

- ✅ 仅授予必要人员 admin 权限
- ✅ 定期审查 admin 用户列表
- ✅ 使用 `superadmin` 角色区分超级管理员

```sql
-- 查看所有管理员
SELECT id, email, role, created_at
FROM profiles
WHERE role IN ('admin', 'superadmin')
ORDER BY created_at DESC;
```

### 2. 操作审计

- ✅ 所有关键操作都会记录到 `audit_logs`
- ✅ 定期审查审计日志
- ✅ 监控异常操作

```sql
-- 查看今日所有管理员操作
SELECT * FROM audit_logs
WHERE created_at::date = CURRENT_DATE
  AND metadata->>'performed_by' IS NOT NULL
ORDER BY created_at DESC;
```

### 3. 积分管理

- ✅ 授予积分时必须填写原因
- ✅ 大额积分授予需二次确认
- ✅ 监控异常积分变动

```sql
-- 查看大额积分授予记录
SELECT * FROM report_credit_events
WHERE event_type = 'earn'
  AND amount >= 50
ORDER BY created_at DESC
LIMIT 20;
```

---

## 相关文档

- [架构文档](../architecture/README.md)
- [API 开发指南](../architecture/api-development-guide.md)
- [Supabase 部署指南](./supabase-report-stage2-cavr.md)

---

**维护者**: Admin Team
**反馈**: 请通过 GitHub Issues 提交反馈或改进建议
