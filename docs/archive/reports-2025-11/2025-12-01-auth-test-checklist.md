# 登录系统手动测试清单

**测试地址**: http://localhost:3002/login
**日期**: 2025-12-01
**修复内容**: Recovery 误判 + 增强日志

---

## 🧪 测试场景

### 场景 1: 密码注册（Sign Up）

**步骤**:

1. 访问 http://localhost:3002/login
2. 点击 "Sign Up" 标签
3. 输入邮箱: `test-signup-${Date.now()}@example.com`
4. 输入密码: `TestPassword123!`
5. 点击 "Sign Up" 按钮

**预期结果**:

- ✅ 显示绿色成功横幅: "确认邮件已发送"
- ✅ 终端显示日志:
  ```
  [AUTH] Callback invoked: { hasCode: true, type: null, hasTokenHash: true, url: '...' }
  [AUTH] Code exchange successful
  [AUTH] Initializing profile for user: <uuid>
  [AUTH] Profile initialized successfully (或 Failed to initialize profile)
  [AUTH] Redirecting to homepage
  ```
- ❌ **不应该**: 显示 "登录暂不可用" 或跳转到 reset-password

**检查点**:

- [ ] 成功提示显示
- [ ] 终端有 `[AUTH]` 日志
- [ ] 未跳转到错误页面

---

### 场景 2: 密码登录（Sign In）

**前置条件**: 已有确认的账号（或使用场景 1 的账号点击邮件确认）

**步骤**:

1. 访问 http://localhost:3002/login
2. 确保在 "Sign In" 标签
3. 输入已确认的邮箱
4. 输入密码
5. 点击 "Sign In" 按钮

**预期结果**:

- ✅ 成功跳转到 `http://localhost:3002/` (首页)
- ✅ 终端无 `[AUTH]` 日志（因为是直接密码登录，不走 callback）
- ✅ 页面显示用户信息（如有）

**失败场景测试**:

- 输入错误密码 → 应显示 "邮箱或密码错误"
- 输入不存在的邮箱 → 应显示 "邮箱或密码错误"

**检查点**:

- [ ] 正确密码能登录成功
- [ ] 错误密码显示错误提示
- [ ] 未跳转到 reset-password

---

### 场景 3: 魔术链接（Magic Link）⚠️ 关键测试

**步骤**:

1. 访问 http://localhost:3002/login
2. 点击 "Magic Link" 链接（在密码输入框下方）
3. 输入邮箱: `test-magic-${Date.now()}@example.com`
4. 点击 "Send Magic Link" 按钮
5. 查看 Inbucket (http://127.0.0.1:54324) 或真实邮箱
6. **点击邮件中的链接**

**预期结果（修复后）**:

- ✅ 点击邮件链接后跳转到 `http://localhost:3002/` (首页)
- ✅ 终端显示日志:
  ```
  [AUTH] Callback invoked: { hasCode: true, type: 'magiclink', hasTokenHash: true, url: '...' }
  [AUTH] Code exchange successful
  [AUTH] Initializing profile for user: <uuid>
  [AUTH] Redirecting to homepage
  ```
- ❌ **不应该**: 跳转到 `/account/reset-password` (这是旧 bug)

**检查点**:

- [ ] 成功跳转到首页
- [ ] 终端日志显示 `type: 'magiclink'` 或 `type: null`
- [ ] 终端日志显示 `Redirecting to homepage`
- [ ] **未出现 "Recovery flow detected"**

---

### 场景 4: 密码重置（Reset Password）⚠️ 关键测试

**步骤**:

1. 访问 http://localhost:3002/login
2. 点击 "Forgot Password" 链接
3. 输入邮箱: 已存在的账号邮箱
4. 点击 "Send Reset Link" 按钮
5. 查看邮箱
6. **点击邮件中的重置链接**

**预期结果**:

- ✅ 点击邮件链接后跳转到 `/account/reset-password`
- ✅ Reset-password 页面显示 spinner + "Please wait while we redirect you..."
- ✅ 自动跳转到 `/account/change-password?type=recovery`
- ✅ 终端显示日志:
  ```
  [AUTH] Callback invoked: { hasCode: false, type: 'recovery', hasTokenHash: true, url: '...' }
  [AUTH] Recovery flow detected, preserving hash
  ```
- ✅ Change-password 页面允许设置新密码

**检查点**:

- [ ] 正确跳转到 change-password 页面
- [ ] 终端日志显示 `Recovery flow detected`
- [ ] 能够成功设置新密码

---

## 🔍 调试方法

### 1. 查看终端日志

所有 `[AUTH]` 前缀的日志：

```bash
cd D:\Projects\qiltrack-ai-g2
# 终端应该已经在运行 npm run dev
# 查看输出中的 [AUTH] 日志
```

### 2. 浏览器 DevTools

**Console 标签页**:

- 查看是否有 JavaScript 错误
- 查看 Supabase 相关错误

**Network 标签页**:

- 筛选 `callback` - 查看 `/api/auth/callback` 请求
- 查看响应状态码（302 重定向 或 200 HTML）
- 查看 Response 内容

**Application → Cookies**:

- 检查是否有 `sb-<project>-auth-token` cookie
- 确认 cookie 值存在且有效

### 3. Supabase 邮件链接格式

**魔术链接应该是**:

```
http://localhost:3002/api/auth/callback?token_hash=xxx&type=magiclink&...
```

**密码重置链接应该是**:

```
http://localhost:3002/api/auth/callback?token_hash=xxx&type=recovery&...
或
http://localhost:3002/account/reset-password?token_hash=xxx&...
```

---

## ⚠️ 已知问题和解决方案

### 问题 1: "登录暂不可用" / "链接已失效"

**可能原因**:

1. Supabase RPC 函数 `fn_initialize_profile` 不存在
2. Supabase 邮件模板配置错误
3. Session cookie 未设置

**解决方案**:

- 查看终端日志中的 `Failed to initialize profile` 错误
- 检查 Supabase Dashboard → SQL Editor → RPC 函数
- 验证环境变量 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 问题 2: 魔术链接跳转到 reset-password

**原因**: 旧版本的 recovery 检测逻辑（已修复）
**验证**: 终端不应显示 `Recovery flow detected` 当使用魔术链接时

### 问题 3: 密码重置不工作

**可能原因**: `type=recovery` 参数缺失或 token_hash 格式错误
**解决方案**: 检查邮件链接 URL，确认包含 `type=recovery&token_hash=xxx`

---

## 📊 测试结果记录

| 场景     | 状态      | 终端日志 | 备注 |
| -------- | --------- | -------- | ---- |
| 密码注册 | ⬜ 待测试 |          |      |
| 密码登录 | ⬜ 待测试 |          |      |
| 魔术链接 | ⬜ 待测试 | 🔑 关键  |      |
| 密码重置 | ⬜ 待测试 | 🔑 关键  |      |

**状态图例**:

- ⬜ 待测试
- ✅ 通过
- ❌ 失败
- ⚠️ 部分通过

---

## 下一步

如果测试失败，请提供：

1. 失败的场景编号
2. 终端 `[AUTH]` 日志输出
3. 浏览器 Console 错误（如有）
4. Network 请求的 URL 和响应

如果测试通过，可以合并 PR #73 并关闭密码重置任务。
