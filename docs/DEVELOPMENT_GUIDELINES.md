# Qiltrack AI 开发注意事项

> **重要**: 本文档记录了常见的开发陷阱和最佳实践，请在开发前阅读。

---

## 1. Supabase 类型处理 (最常见问题)

### 问题描述

Supabase 数据库返回的字段大多数可能为 `null`，但 TypeScript 代码经常假设它们不为 null，导致类型错误。

### ❌ 错误示例

```typescript
// 错误：假设 created_at 一定存在
data.forEach((item: { created_at: string }) => {
  const date = new Date(item.created_at);
});

// 错误：使用 optional (?) 而不是 nullable (| null)
data.forEach((p: { plan?: string }) => {
  // ...
});
```

### ✅ 正确写法

```typescript
// 正确：声明为 nullable
data.forEach((item: { created_at: string | null }) => {
  if (!item.created_at) return; // 先检查 null
  const date = new Date(item.created_at);
});

// 正确：使用 nullable union type
data.forEach((p: { plan: string | null }) => {
  const plan = p.plan || 'free'; // 提供默认值
});
```

### 常见 nullable 字段

| 表名 | 字段 | 说明 |
|------|------|------|
| profiles | `plan`, `role`, `display_name`, `created_at`, `updated_at` | 用户可能未设置 |
| report_runs | `user_id`, `symbol`, `status`, `created_at` | 运行记录字段 |
| report_credits | `credits_available`, `credits_used` | 积分字段 |
| audit_logs | `resource_type`, `resource_id`, `user_id`, `details` | 审计日志字段 |

### 处理策略

1. **filter + map 组合**
```typescript
// 先过滤掉 null，再映射
const validData = data
  .filter((item) => item.symbol && item.created_at)
  .map((item) => ({
    symbol: item.symbol!, // 安全使用 !
    created_at: item.created_at!
  }));
```

2. **类型断言 (谨慎使用)**
```typescript
// 当你确定数据不为 null 时
const items = (data || []) as SomeType[];
```

3. **默认值**
```typescript
const plan = p.plan || 'free';
const credits = c.credits_available ?? 0;
```

---

## 2. Supabase 表名类型问题

### 问题描述

当数据库有新表但 `types/database.ts` 未更新时，会出现表名类型错误。

### ❌ 错误示例

```typescript
// 错误：表名 'system_config' 不在类型定义中
const { data } = await supabase.from('system_config').select('*');
// Error: Argument of type '"system_config"' is not assignable...
```

### ✅ 解决方案

```typescript
// 方案1：类型断言 (临时方案)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data } = await (supabase as any).from('system_config').select('*');

// 方案2：更新 types/database.ts (推荐)
// 运行: npm run db:types:generate
```

### 受影响的表名 (可能需要类型断言)

- `system_config`
- `subscription_plans`
- `user_notifications`

---

## 3. 文件编码问题

### 问题描述

Windows 环境下生成的文件可能是 UTF-16 编码，导致 ESLint 报告 "File appears to be binary" 错误。

### 检测方法

```bash
file types/database.ts
# 如果输出包含 "UTF-16"，说明编码有问题
```

### ✅ 修复方法

```powershell
# PowerShell 转换为 UTF-8
Get-Content 'types/database.ts' -Raw | Out-File -FilePath 'types/database.ts' -Encoding UTF8
```

---

## 4. Supabase 密钥格式

### 新版格式 (2024+)

Supabase 新版项目使用新的密钥前缀：

| 类型 | 旧格式 | 新格式 |
|------|--------|--------|
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | `sb_publishable_xxx` |
| Service Role Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | `sb_secret_xxx` |

### 验证脚本

```bash
node scripts/check-supabase-keys.js
```

---

## 5. React Hooks 最佳实践

### useEffect 中的异步操作

### ❌ 错误示例

```typescript
// 错误：直接调用 setState 可能导致 cascading renders
useEffect(() => {
  fetchData(); // 直接调用
}, [fetchData]);
```

### ✅ 正确写法

```typescript
useEffect(() => {
  let mounted = true;

  const init = async () => {
    if (mounted) {
      await fetchData();
    }
  };

  init();

  return () => {
    mounted = false;
  };
}, [fetchData]);
```

---

## 6. RPC 函数类型

### 问题描述

当 RPC 函数未在 `types/database.ts` 中定义时，调用会报类型错误。

### ✅ 解决方案

```typescript
// 使用类型断言绕过检查
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data } = await (supabase.rpc as any)('fn_user_has_password');
```

### 已知未定义的 RPC 函数

- `fn_user_has_password`
- `fn_get_user_identities`
- `fn_claim_daily_reward`
- `fn_grant_credits`

---

## 7. 代码检查命令

在提交代码前，务必运行以下检查：

```bash
# TypeScript 类型检查 (必须 0 错误)
npm run type-check

# ESLint 检查 (必须 0 错误，警告可接受)
npm run lint

# 环境配置检查
node scripts/check-env.js

# Supabase 密钥检查
node scripts/check-supabase-keys.js
```

---

## 8. 常见修复清单

当遇到类型错误时，按以下顺序检查：

- [ ] 是否正确处理了 nullable 字段？
- [ ] 是否需要添加 null 检查或默认值？
- [ ] 是否需要使用 filter 过滤 null 值？
- [ ] 表名是否在 types/database.ts 中定义？
- [ ] RPC 函数是否在类型定义中？
- [ ] 文件编码是否正确 (UTF-8)？

---

## 更新日志

| 日期 | 更新内容 |
|------|---------|
| 2025-12-05 | 初始版本，记录 TypeScript/ESLint 修复经验 |

---

> 💡 **提示**: 如果你是 AI 助手，请在修改 admin 页面或处理 Supabase 数据时特别注意上述问题。
