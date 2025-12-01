# 登录系统全面诊断报告

**日期**: 2025-12-01
**问题**: 创建账号/密码登录/魔术链接全部失败
**症状**: 提示"登录暂不可用"或其他错误

---

## 🔍 诊断结果

### 1. 代码审查完成

#### ✅ 登录页面 (`app/(auth)/login/page.tsx`)
- 表单处理逻辑正常
- 错误处理覆盖完整（invalid_credentials, user_already_exists, cooldown, invalid_email）
- 回调 URL 设置正确：`${window.location.origin}/api/auth/callback`

#### ✅ useSupabaseAuth Hook (`hooks/useSupabaseAuth.ts`)
- 所有认证方法实现正常：
  - `signInWithPassword` - 密码登录
  - `signUpWithPassword` - 注册（含邮件确认）
  - `signInWithEmail` - 魔术链接 (OTP)
  - `resetPassword` - 密码重置
- 错误映射逻辑完整
- Email 验证正则正常

#### ⚠️ Auth Callback 路由 (`app/api/auth/callback/route.ts`)
**发现的问题**:

1. **Profile 初始化可能失败**（第 67-75 行）
   ```typescript
   const { error: rpcError } = await supabase.rpc("fn_initialize_profile", {
     p_user_id: user.id,
     p_email: user.email,
   } as never);
   ```
   - 调用 `fn_initialize_profile` RPC 函数
   - 如果 RPC 不存在或失败，会记录错误但不阻断登录
   - **需要验证 Supabase 数据库是否有此 RPC 函数**

2. **Recovery 检测逻辑**（第 15 行）
   ```typescript
   const isRecovery = type === "recovery" || tokenHash !== null;
   ```
   - 这个逻辑可能导致误判
   - **如果其他流程（如注册/魔术链接）携带 `token_hash`，会被错误地重定向到密码重置页面**

### 2. 环境配置检查

#### ✅ .env.local 存在且配置正常
```bash
NEXT_PUBLIC_SUPABASE_URL=https://inmtounwqcjwsxkfnsfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### 3. 可能的根本原因

#### 🔴 **最可能的问题：`fn_initialize_profile` RPC 函数不存在或错误**

当用户首次注册或登录时：
1. Supabase 成功交换 code 为 session
2. 调用 `fn_initialize_profile` 创建 profile 和 report_credits
3. **如果 RPC 失败，虽然登录继续，但可能导致后续页面崩溃**
4. 用户看到"登录不可用"可能是因为：
   - Profile 未创建，导致首页/账户页查询失败
   - Session 有效但 profile 缺失

#### 🟡 **次要问题：Recovery 检测误判**

魔术链接(OTP)可能携带 `token_hash` 参数，导致：
1. 用户点击魔术链接邮件
2. `isRecovery = true`（因为有 `token_hash`）
3. 被重定向到 `/account/reset-password` 而非首页
4. Reset password 页面因为不是真正的 recovery 流程而失败

---

## 🔧 需要验证的点

### 1. **Supabase 数据库检查（最优先）**
```sql
-- 检查 RPC 函数是否存在
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'fn_initialize_profile';

-- 检查 profiles 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles';

-- 检查 report_credits 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'report_credits';
```

### 2. **Supabase Auth 配置**
- Email Templates 是否正确设置重定向 URL？
- Email Confirmations 是否启用？
- Site URL 是否配置为 `http://localhost:3000` (开发) 或生产域名？

### 3. **浏览器测试**
运行应用并打开浏览器 DevTools：
- **Console 标签页**: 查看 JavaScript 错误
- **Network 标签页**: 查看 `/api/auth/callback` 请求响应
- **Application → Cookies**: 检查 Supabase session cookie 是否设置

---

## 💡 立即修复建议

### Fix 1: 安全化 RPC 调用（避免阻断）

当前逻辑已经不阻断登录，但应该更明确地处理：

```typescript
// app/api/auth/callback/route.ts:65-76
if (user && user.email) {
  try {
    const { error: rpcError } = await supabase.rpc("fn_initialize_profile", {
      p_user_id: user.id,
      p_email: user.email,
    } as never);

    if (rpcError) {
      console.error("[AUTH] Failed to initialize profile:", rpcError);
      // Consider logging to external service for monitoring
    }
  } catch (err) {
    console.error("[AUTH] Exception calling fn_initialize_profile:", err);
    // Don't fail the login
  }
}
```

### Fix 2: 修复 Recovery 误判

只在明确的 recovery 场景下触发：

```typescript
// app/api/auth/callback/route.ts:12-15
// Only treat as recovery if:
// 1. Explicit type=recovery parameter
// 2. AND has token_hash (recovery links always have both)
const isRecovery = type === "recovery" && tokenHash !== null;
```

### Fix 3: 增强错误处理和日志

在 callback 路由添加更详细的日志：

```typescript
console.log("[AUTH] Callback invoked:", {
  hasCode: !!code,
  type,
  hasTokenHash: !!tokenHash,
  isRecovery
});
```

---

## 📋 验证步骤

1. **检查 Supabase 数据库**
   - 登录 Supabase Dashboard
   - SQL Editor → 运行上述 SQL 查询
   - 确认 `fn_initialize_profile` 存在

2. **检查 Supabase Auth 设置**
   - Authentication → Settings → Email Templates
   - 确认 Redirect URL 包含 `/api/auth/callback`

3. **应用修复并测试**
   - 应用 Fix 2（Recovery 误判）
   - 重启 dev 服务器
   - 尝试注册/登录/魔术链接

4. **查看日志**
   - 终端查看 `[AUTH]` 前缀的日志
   - 确认 code exchange 成功
   - 确认 RPC 是否被调用及结果

---

## 🎯 下一步行动

1. **立即应用 Fix 2**（Recovery 误判是最明显的 bug）
2. **请 Codex 提供 Supabase Dashboard 访问或数据库 schema**
3. **添加详细日志后重新测试所有登录流程**
4. **如果 RPC 缺失，创建或移除该调用**

---

## 🔗 相关文件

- `app/(auth)/login/page.tsx` - 登录界面
- `hooks/useSupabaseAuth.ts` - 认证逻辑
- `app/api/auth/callback/route.ts` - 回调处理 ⚠️
- `docs/reports/2025-12-01-g2-password-recovery-cavr.md` - 密码重置修复
