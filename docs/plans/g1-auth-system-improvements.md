# G1 Implementation Plan: 登录系统架构改进

> **工作组**: G1
> **分派时间**: 2025-12-10 21:35
> **依赖**: WS-AUTH-01 (已完成)
> **预计完成**: 2025-12-11
> **Architecture Snapshot**: `docs/decisions/2025-12-10-login-system-bug-fix.md`

---

## 📋 任务概览

本计划包含 4 个 Stage，按优先级 P0 → P1 → P2 → P3 顺序实施，每个 Stage 独立提交 PR。

| Stage | 任务 ID        | 优先级 | 预估时间 | 文件数 | 说明                     |
| ----- | -------------- | ------ | -------- | ------ | ------------------------ |
| 1     | WS-AUTH-02     | P0     | 0.5 天   | 3      | Redirect URL 配置修复    |
| 2     | WS-AUTH-03     | P1     | 0.5 天   | 1      | 密码恢复 fallback        |
| 3     | WS-AUTH-04     | P2     | 2 天     | 5      | 错误处理 + 密码校验统一  |
| 4     | WS-AUTH-05     | P3     | 1 天     | 4      | 长期改进（监控 + 提示）  |

---

## 🎯 Stage 1: Redirect URL 配置修复 (P0)

### 背景
当前 `hooks/useSupabaseAuth.ts:39-48` 的 `getAuthRedirectBase()` 函数在 SSR 时默认返回 `http://localhost:3000`，多环境部署时会导致 OAuth/Magic Link 回调 404。

### 实施清单

#### 1.1 更新环境变量配置
**文件**: `.env.local.example`
```bash
# 添加明确的说明
# Auth Redirect Base URL (必须配置，用于 OAuth/Magic Link 回调)
# 开发环境: http://192.168.8.40:3000 或 http://localhost:3000
# 生产环境: https://your-domain.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**验收标准**:
- `.env.local.example` 包含 `NEXT_PUBLIC_SITE_URL` 及详细注释
- 说明开发/生产环境的配置示例

#### 1.2 增强 getAuthRedirectBase() 函数
**文件**: `hooks/useSupabaseAuth.ts:39-48`

**当前代码**:
```typescript
function getAuthRedirectBase(): string {
  const base =
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL;
  if (base) {
    return base.replace(/\/$/, "");
  }
  if (typeof window === "undefined") {
    return "http://localhost:3000";  // ← 风险点
  }
  return window.location.origin;
}
```

**修改要求**:
1. 添加环境变量验证，在开发模式下输出 warning
2. 添加文档注释说明优先级
3. SSR 默认值改为读取 `NEXT_PUBLIC_SITE_URL`，如仍缺失则抛出警告

**期望代码**:
```typescript
/**
 * 获取认证回调的基础 URL
 * 优先级: NEXT_PUBLIC_AUTH_REDIRECT_URL > NEXT_PUBLIC_SITE_URL > NEXT_PUBLIC_VERCEL_URL > runtime
 *
 * @returns 基础 URL (不含尾部斜杠)
 * @throws 在开发模式下，如果所有环境变量都未配置，会输出 console.warn
 */
function getAuthRedirectBase(): string {
  const base =
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL;

  if (base) {
    return base.replace(/\/$/, "");
  }

  // 开发模式警告
  if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
    console.warn(
      "[Auth] NEXT_PUBLIC_SITE_URL not configured, using localhost:3000. " +
      "This may cause OAuth/Magic Link callback failures in non-local environments."
    );
  }

  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  }

  return window.location.origin;
}
```

**验收标准**:
- 函数添加 JSDoc 注释
- 开发模式下，缺少环境变量时输出 console.warn
- 逻辑保持向后兼容

#### 1.3 添加 Supabase 配置检查脚本
**新建文件**: `scripts/check-supabase-redirects.js`

```javascript
/**
 * 检查 Supabase Auth Redirect URLs 配置
 * 运行: node scripts/check-supabase-redirects.js
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const requiredUrls = [
  `${siteUrl}/api/auth/callback`,
  `${siteUrl}/account/reset-password`,
];

console.log('🔍 Checking Supabase Auth Redirect URLs...\n');
console.log('Current NEXT_PUBLIC_SITE_URL:', siteUrl);
console.log('\n✅ Required Redirect URLs in Supabase Dashboard:');
requiredUrls.forEach(url => console.log(`   - ${url}`));
console.log('\n📖 Configuration Path:');
console.log('   Supabase Dashboard → Authentication → URL Configuration → Redirect URLs');
console.log('\n⚠️  Make sure ALL above URLs are added to your Supabase project settings.');
```

**验收标准**:
- 脚本可独立运行
- 输出当前环境的必需回调 URL 列表
- 包含 Supabase Dashboard 配置路径说明

#### 1.4 更新文档
**文件**: `README.md` 或 `docs/guides/environment-setup.md`

添加章节：
```markdown
### 配置认证回调 URL

1. 在 `.env.local` 中设置：
   ```bash
   NEXT_PUBLIC_SITE_URL=http://192.168.8.40:3000
   ```

2. 运行检查脚本：
   ```bash
   node scripts/check-supabase-redirects.js
   ```

3. 在 Supabase Dashboard 添加所有列出的回调 URL：
   - 路径: Authentication → URL Configuration → Redirect URLs
   - 添加脚本输出的所有 URL
```

**验收标准**:
- 文档清晰说明配置步骤
- 包含脚本使用示例

### 测试要求

```bash
# 1. 验证环境变量警告
# 删除 .env.local 中的 NEXT_PUBLIC_SITE_URL
# 启动开发服务器，检查 console 是否输出警告

# 2. 验证 Magic Link 回调
# 登录页面 → Sign in via magic link
# 输入邮箱 → 检查 Mailpit (http://localhost:54324)
# 点击邮件链接 → 应成功跳转回应用

# 3. 验证脚本输出
node scripts/check-supabase-redirects.js
# 应输出正确的回调 URL 列表
```

### 交付物
- [ ] `.env.local.example` 更新
- [ ] `hooks/useSupabaseAuth.ts` 函数增强
- [ ] `scripts/check-supabase-redirects.js` 新建
- [ ] 文档更新 (README 或 guides)
- [ ] Stage 1 CAVR 报告: `docs/reports/2025-12-10-g1-auth-stage1-cavr.md`

---

## 🎯 Stage 2: 密码恢复 Fallback (P1)

### 背景
`app/api/auth/callback/route.ts` 密码恢复流程使用纯 JavaScript redirect 保留 URL hash，当用户禁用 JS 时无法完成密码重置。

### 实施清单

#### 2.1 添加 noscript Fallback
**文件**: `app/api/auth/callback/route.ts:80-90`

**当前代码**:
```typescript
if (isRecovery) {
  const html = `
    <script>
      var target = "/account/reset-password" + search + hash;
      window.location.replace(target);
    </script>
  `;
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
```

**修改要求**:
添加 `<noscript>` 和 `<meta>` fallback

**期望代码**:
```typescript
if (isRecovery) {
  const target = `/account/reset-password${search}${hash}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Redirecting...</title>
        <noscript>
          <meta http-equiv="refresh" content="0; url=${target}">
        </noscript>
      </head>
      <body>
        <script>
          window.location.replace("${target}");
        </script>
        <noscript>
          <p>Redirecting to password reset page...</p>
          <p>If you are not redirected, <a href="${target}">click here</a>.</p>
        </noscript>
      </body>
    </html>
  `;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
```

**验收标准**:
- 包含 `<noscript>` meta refresh
- 包含手动点击链接的 fallback
- 正确转义 URL 参数（防止 XSS）

#### 2.2 添加 URL 转义函数
在同文件中添加辅助函数：

```typescript
/**
 * 转义 HTML 属性中的特殊字符，防止 XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

并在 HTML 中使用：
```typescript
const safetarget = escapeHtml(target);
```

**验收标准**:
- URL 参数正确转义
- 无 XSS 漏洞

### 测试要求

```bash
# 1. 正常流程测试（JS 启用）
# 登录页 → Forgot password → 输入邮箱
# Mailpit 查看邮件 → 点击链接
# 应跳转至 /account/reset-password 并保留 hash

# 2. JS 禁用测试
# Chrome DevTools → Settings → Disable JavaScript
# 重复上述流程
# 应仍能跳转至密码重置页面（通过 meta refresh）

# 3. XSS 测试
# 构造恶意 hash 参数
# 验证 HTML 输出中特殊字符被正确转义
```

### 交付物
- [ ] `app/api/auth/callback/route.ts` 添加 noscript fallback
- [ ] 添加 `escapeHtml()` 辅助函数
- [ ] Stage 2 CAVR 报告: `docs/reports/2025-12-10-g1-auth-stage2-cavr.md`

---

## 🎯 Stage 3: 错误处理 + 密码校验统一 (P2)

### 背景
1. 错误处理依赖字符串匹配，不可靠
2. 前端提示 8 字符，后端验证 12 字符，用户困惑

### 实施清单

#### 3.1 定义 Supabase 错误代码常量
**新建文件**: `lib/auth/supabase-error-codes.ts`

```typescript
/**
 * Supabase Auth 官方错误代码
 * 参考: https://supabase.com/docs/guides/auth/error-codes
 */
export const SUPABASE_AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'invalid_grant',
  OTP_EXPIRED: 'otp_expired',
  RATE_LIMIT: 'over_request_rate_limit',
  EMAIL_EXISTS: 'email_address_already_exists',
  WEAK_PASSWORD: 'weak_password',
  INVALID_EMAIL: 'invalid_email',
  USER_NOT_FOUND: 'user_not_found',
  UNEXPECTED_FAILURE: 'unexpected_failure',
} as const;

export type SupabaseAuthErrorCode = typeof SUPABASE_AUTH_ERROR_CODES[keyof typeof SUPABASE_AUTH_ERROR_CODES];

/**
 * 映射 Supabase 错误代码到用户友好消息
 */
export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case SUPABASE_AUTH_ERROR_CODES.INVALID_CREDENTIALS:
      return 'Invalid email or password';
    case SUPABASE_AUTH_ERROR_CODES.OTP_EXPIRED:
      return 'This link has expired. Please request a new one.';
    case SUPABASE_AUTH_ERROR_CODES.RATE_LIMIT:
      return 'Too many attempts. Please wait 60 seconds and try again.';
    case SUPABASE_AUTH_ERROR_CODES.EMAIL_EXISTS:
      return 'This email is already registered. Try signing in instead.';
    case SUPABASE_AUTH_ERROR_CODES.WEAK_PASSWORD:
      return 'Password must be at least 12 characters with uppercase, lowercase, number, and symbol.';
    case SUPABASE_AUTH_ERROR_CODES.INVALID_EMAIL:
      return 'Please enter a valid email address.';
    case SUPABASE_AUTH_ERROR_CODES.USER_NOT_FOUND:
      return 'No account found with this email.';
    case SUPABASE_AUTH_ERROR_CODES.UNEXPECTED_FAILURE:
      return 'Login is temporarily unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}
```

**验收标准**:
- 所有常用错误代码已定义
- 包含 TypeScript 类型定义
- 消息清晰且用户友好

#### 3.2 重构 mapAuthError() 函数
**文件**: `hooks/useSupabaseAuth.ts`

**当前代码**: 使用 `includes()` 字符串匹配

**修改要求**: 使用官方错误代码

```typescript
import { getAuthErrorMessage, SUPABASE_AUTH_ERROR_CODES } from '@/lib/auth/supabase-error-codes';

function mapAuthError(error: AuthError | null): AuthError | null {
  if (!error) return null;

  // 优先使用 Supabase 返回的错误代码
  if (error.code) {
    return {
      ...error,
      message: getAuthErrorMessage(error.code),
    };
  }

  // Fallback: 处理旧版错误格式（保持向后兼容）
  const msg = error.message?.toLowerCase() || '';

  if (msg.includes('invalid') && (msg.includes('credentials') || msg.includes('password'))) {
    return {
      ...error,
      code: SUPABASE_AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      message: getAuthErrorMessage(SUPABASE_AUTH_ERROR_CODES.INVALID_CREDENTIALS),
    };
  }

  if (msg.includes('60 seconds') || msg.includes('rate limit')) {
    return {
      ...error,
      code: SUPABASE_AUTH_ERROR_CODES.RATE_LIMIT,
      message: getAuthErrorMessage(SUPABASE_AUTH_ERROR_CODES.RATE_LIMIT),
    };
  }

  return error;
}
```

**验收标准**:
- 优先使用 `error.code`
- Fallback 逻辑保持向后兼容
- 所有错误消息来自 `getAuthErrorMessage()`

#### 3.3 统一密码校验规则
**文件 1**: `lib/auth/password-validator.ts`

确认默认配置为 12 字符：
```typescript
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 12,  // ✓ 已是 12
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
};
```

**文件 2**: `app/(auth)/login/page.tsx` (Sign Up 表单)

**查找当前提示文本**，可能是：
```typescript
<p className="text-sm text-muted-foreground">
  Must be at least 8 characters
</p>
```

**修改为**：
```typescript
<p className="text-sm text-muted-foreground">
  Must be at least 12 characters with uppercase, lowercase, number, and symbol
</p>
```

**文件 3**: 搜索所有提到 "8 characters" 的地方

```bash
# Claude 需要运行：
grep -r "8 characters" app/ lib/ --include="*.tsx" --include="*.ts"
```

并全部更新为 12 字符。

**验收标准**:
- 所有 UI 提示统一为 12 字符
- 密码校验逻辑与提示一致
- 错误消息明确说明要求（大小写 + 数字 + 符号）

#### 3.4 添加密码强度实时验证
**文件**: `app/(auth)/login/page.tsx` (Sign Up 表单)

添加实时反馈组件：

```typescript
import { validatePassword, DEFAULT_PASSWORD_REQUIREMENTS } from '@/lib/auth/password-validator';

// 在表单中添加
const [passwordValidation, setPasswordValidation] = useState<ReturnType<typeof validatePassword> | null>(null);

const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const pwd = e.target.value;
  setPassword(pwd);
  if (pwd) {
    setPasswordValidation(validatePassword(pwd, DEFAULT_PASSWORD_REQUIREMENTS));
  } else {
    setPasswordValidation(null);
  }
};

// UI 显示
{passwordValidation && !passwordValidation.isValid && (
  <ul className="text-xs text-destructive space-y-1 mt-1">
    {passwordValidation.errors.map((err, i) => (
      <li key={i}>• {err}</li>
    ))}
  </ul>
)}
```

**验收标准**:
- 实时显示密码强度错误
- 列表格式清晰
- 符合要求后错误消失

#### 3.5 更新 API 错误响应
**文件**: `app/api/auth/change-password/route.ts`

确认 API 返回的错误消息使用统一的错误代码：

```typescript
import { getAuthErrorMessage, SUPABASE_AUTH_ERROR_CODES } from '@/lib/auth/supabase-error-codes';

// 在错误处理中
if (error.code) {
  return NextResponse.json(
    { error: getAuthErrorMessage(error.code) },
    { status: 400 }
  );
}
```

**验收标准**:
- API 错误消息与前端一致
- 使用统一的错误代码

### 测试要求

```bash
# 1. 错误消息测试
# 测试场景:
# - 错误密码 → "Invalid email or password"
# - 60秒内重复登录 → "Too many attempts. Please wait 60 seconds..."
# - 注册已存在邮箱 → "This email is already registered..."

# 2. 密码强度测试
# 注册页面输入:
# - "short" → 显示 "至少 12 字符"
# - "lowercase12!" → 显示 "需要大写字母"
# - "Uppercase12" → 显示 "需要符号"
# - "ValidPass123!" → 无错误，允许提交

# 3. 一致性测试
# 前端提示与后端验证规则完全一致
grep -r "8 characters" app/ lib/
# 应无结果（已全部改为 12）
```

### 交付物
- [ ] `lib/auth/supabase-error-codes.ts` 新建
- [ ] `hooks/useSupabaseAuth.ts` mapAuthError() 重构
- [ ] `app/(auth)/login/page.tsx` 密码提示 + 实时验证
- [ ] `app/api/auth/change-password/route.ts` 错误响应统一
- [ ] 所有 "8 characters" 文本替换为 "12 characters"
- [ ] Stage 3 CAVR 报告: `docs/reports/2025-12-10-g1-auth-stage3-cavr.md`

---

## 🎯 Stage 4: 长期改进 (P3)

### 背景
三个非关键但影响长期维护性的改进。

### 实施清单

#### 4.1 Cookie 名称监控
**文件**: `lib/supabase/server.ts:getAllCookies()`

**当前代码**: 硬编码 cookie 名称

**修改要求**: 添加版本检查和警告

```typescript
import { version as supabaseSSRVersion } from '@supabase/ssr/package.json';

// 添加常量
const KNOWN_SUPABASE_SSR_VERSION = '0.7.0';
const COMMON_COOKIE_NAMES = [
  'sb-auth-token',
  'sb-session',
  'sb_auth_token',
  'sb_session',
];

function getAllCookies(cookieStore: ReadonlyRequestCookies): { name: string; value: string }[] {
  // 版本检查
  if (supabaseSSRVersion !== KNOWN_SUPABASE_SSR_VERSION) {
    console.warn(
      `[Supabase] @supabase/ssr version changed: ${KNOWN_SUPABASE_SSR_VERSION} → ${supabaseSSRVersion}. ` +
      `Cookie names in getAllCookies() may need updating. Check: https://github.com/supabase/ssr/releases`
    );
  }

  const cookies: { name: string; value: string }[] = [];

  // 尝试标准方法
  try {
    cookieStore.getAll().forEach((cookie) => {
      cookies.push({ name: cookie.name, value: cookie.value });
    });
    return cookies;
  } catch (error) {
    // Fallback 逻辑保持不变
    console.warn("[Supabase] cookieStore.getAll() failed, using fallback");
    COMMON_COOKIE_NAMES.forEach((name) => {
      const cookie = cookieStore.get(name);
      if (cookie) {
        cookies.push({ name: cookie.name, value: cookie.value });
      }
    });
    return cookies;
  }
}
```

**验收标准**:
- 检测 `@supabase/ssr` 版本变化
- 版本不匹配时输出警告
- 包含 GitHub release 链接

#### 4.2 Google OAuth 友好提示
**文件**: `app/components/GoogleSignInButton.tsx`

**当前代码**:
```typescript
if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
  return (
    <button disabled>Google 登录未配置</button>
  );
}
```

**修改要求**: 显示配置指引

```typescript
if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
  return (
    <div className="border border-dashed border-muted rounded-lg p-4">
      <p className="text-sm text-muted-foreground mb-2">
        Google Sign-In is not configured
      </p>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:underline">
          Setup instructions
        </summary>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Create a Google OAuth app in Google Cloud Console</li>
          <li>Add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to your <code>.env.local</code></li>
          <li>Configure authorized redirect URIs in Google Console</li>
        </ol>
        <a
          href="https://supabase.com/docs/guides/auth/social-login/auth-google"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline mt-2 inline-block"
        >
          View documentation →
        </a>
      </details>
    </div>
  );
}
```

**验收标准**:
- 显示清晰的配置说明
- 包含可展开的详细步骤
- 链接到官方文档

#### 4.3 RPC 函数防御性检查
**文件**: `hooks/useSupabaseAuth.ts:getAuthMethod()`

**当前代码**: 依赖 `fn_user_has_password` RPC

**修改要求**: 添加函数存在性检查

```typescript
// 在文件顶部添加缓存
let rpcFunctionAvailable: boolean | null = null;

async function checkRpcFunction(supabase: SupabaseClient): Promise<boolean> {
  if (rpcFunctionAvailable !== null) {
    return rpcFunctionAvailable;
  }

  try {
    // 尝试调用 RPC（使用 dummy 数据测试）
    const { error } = await supabase.rpc('fn_user_has_password');

    if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
      console.warn(
        '[Auth] RPC function "fn_user_has_password" not found. ' +
        'User authentication method detection will fall back to heuristics. ' +
        'Run: supabase db reset (local) or check migrations (production).'
      );
      rpcFunctionAvailable = false;
    } else {
      rpcFunctionAvailable = true;
    }
  } catch {
    rpcFunctionAvailable = false;
  }

  return rpcFunctionAvailable;
}

// 在 getAuthMethod() 中使用
const getAuthMethod = useCallback(async (): Promise<AuthMethodType> => {
  const user = await getCurrentUser();
  if (!user) return "none";

  // 检查 RPC 可用性
  const rpcAvailable = await checkRpcFunction(supabase);

  if (!rpcAvailable) {
    // Fallback: 基于 provider 推断
    const provider = user.app_metadata?.provider;
    if (provider === 'google' || provider === 'github') {
      return 'oauth';
    }
    // 默认假设是密码
    return 'password';
  }

  // 正常 RPC 调用
  const { data: hasPassword, error: rpcError } = await (supabase.rpc as any)(
    "fn_user_has_password"
  );

  if (rpcError) {
    console.warn("RPC fn_user_has_password failed:", rpcError);
    return user.app_metadata?.provider === 'email' ? 'password' : 'oauth';
  }

  return hasPassword ? "password" : "oauth";
}, [supabase]);
```

**验收标准**:
- RPC 函数缺失时输出明确警告
- Fallback 策略基于 `app_metadata.provider`
- 缓存检查结果避免重复调用

#### 4.4 添加健康检查脚本
**新建文件**: `scripts/check-auth-health.js`

```javascript
/**
 * 检查认证系统健康状态
 * 运行: node scripts/check-auth-health.js
 */

const checks = [
  {
    name: 'Environment Variables',
    check: () => {
      const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
      const missing = required.filter(key => !process.env[key]);
      return missing.length === 0 ? 'OK' : `Missing: ${missing.join(', ')}`;
    }
  },
  {
    name: 'Redirect URL Configuration',
    check: () => {
      return process.env.NEXT_PUBLIC_SITE_URL ? 'OK' : 'Not configured (will use localhost)';
    }
  },
  {
    name: 'OAuth Providers',
    check: () => {
      const providers = [];
      if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) providers.push('Google');
      return providers.length > 0 ? `Configured: ${providers.join(', ')}` : 'None configured';
    }
  }
];

console.log('🏥 Auth System Health Check\n');
checks.forEach(({ name, check }) => {
  const result = check();
  const icon = result === 'OK' || result.includes('Configured') ? '✅' : '⚠️';
  console.log(`${icon} ${name}: ${result}`);
});
```

**验收标准**:
- 检查所有关键环境变量
- 输出清晰的状态报告
- 可集成到 CI/CD

### 测试要求

```bash
# 1. Cookie 版本警告测试
# 升级 @supabase/ssr: npm install @supabase/ssr@latest
# 启动服务器，检查 console 是否输出版本警告

# 2. Google OAuth 提示测试
# 删除 NEXT_PUBLIC_GOOGLE_CLIENT_ID
# 访问登录页面，检查配置提示是否显示

# 3. RPC fallback 测试
# 删除或重命名数据库中的 fn_user_has_password 函数
# 登录后调用 getAuthMethod()
# 应输出警告但仍能正常工作

# 4. 健康检查测试
node scripts/check-auth-health.js
# 应输出所有检查项的状态
```

### 交付物
- [ ] `lib/supabase/server.ts` 添加版本监控
- [ ] `app/components/GoogleSignInButton.tsx` 友好提示
- [ ] `hooks/useSupabaseAuth.ts` RPC 防御性检查
- [ ] `scripts/check-auth-health.js` 健康检查脚本
- [ ] Stage 4 CAVR 报告: `docs/reports/2025-12-10-g1-auth-stage4-cavr.md`

---

## 📦 总体交付要求

### 分支策略
- **Stage 1**: `g1/auth-redirect-url-fix`
- **Stage 2**: `g1/auth-password-recovery-fallback`
- **Stage 3**: `g1/auth-error-handling-refactor`
- **Stage 4**: `g1/auth-long-term-improvements`

### PR 要求
每个 Stage 独立 PR，使用 `.github/pull_request_template.md`：

```markdown
## Stage X: [标题]

### Context
[简述问题背景]

### Actions
- [ ] 文件 1: [修改内容]
- [ ] 文件 2: [修改内容]

### Verification
- [ ] Lint: `npm run lint` ✅
- [ ] 测试场景 1: [描述] ✅
- [ ] 测试场景 2: [描述] ✅

### Risks
[列出潜在风险或遗留问题]

### CAVR Report
详见: `docs/reports/2025-12-10-g1-auth-stageX-cavr.md`
```

### 代码质量
- 所有代码通过 `npm run lint`
- 添加 TypeScript 类型定义
- 关键函数包含 JSDoc 注释
- 保持向后兼容

### 文档要求
- 每个 Stage 完成后更新 CAVR 报告
- 记录所有设计决策
- 列出测试场景和结果

---

## 🔄 协作流程

### Claude 工作流
1. 创建 feature 分支
2. 实施 Stage 1，完成后输出 CAVR
3. 提交 PR，@Codex 审查
4. 审查通过后合并，继续 Stage 2
5. 重复直到所有 Stage 完成

### Codex 审查点
- 代码正确性（逻辑、类型、错误处理）
- 架构一致性（是否符合 Snapshot 设计）
- 测试覆盖（关键场景是否验证）
- 文档完整性（CAVR 是否详实）

---

**开始时间**: 等待老板批准后立即启动
**截止时间**: 2025-12-11 EOD (Stage 1-2), 2025-12-12 EOD (Stage 3-4)
