# 认证系统 UX 重构实施清单

# Auth UX Redesign Implementation Checklist

**文档版本**: v1.0
**创建日期**: 2025-11-30
**负责人**: G2 Team
**预估工时**: 8-11 小时

---

## 🎯 目标 Objectives

解决用户反馈的核心问题：

1. OAuth 用户尝试修改密码时遇到困惑
2. 系统未区分不同认证方式（OAuth/Magic Link/Password）
3. 登录页流程繁琐，不符合主流大厂风格
4. 缺少智能引导和状态透明化

---

## 📋 Phase 1: 认证方法识别与展示 (P0 - 必须完成)

**预估时间**: 3-4 小时
**依赖**: Supabase RPC 函数

### ✅ Checklist

#### 1.1 数据库层

- [ ] **创建迁移文件**
      路径: `supabase/migrations/20251130_add_auth_helpers.sql`

  ```sql
  CREATE OR REPLACE FUNCTION fn_user_has_password()
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    RETURN EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = auth.uid()
        AND encrypted_password IS NOT NULL
    );
  END;
  $$;
  ```

- [ ] **执行迁移**

  ```bash
  cd /d/Projects/investor-ai
  npx supabase migration up
  ```

- [ ] **验证函数**
      在 Supabase Studio 执行:
  ```sql
  SELECT fn_user_has_password();
  ```

#### 1.2 Hooks 层

- [ ] **增强 `useSupabaseAuth.ts`**
      路径: `D:\Projects\investor-ai-g2\hooks\useSupabaseAuth.ts`

  **新增类型**:

  ```typescript
  type AuthMethod = "password" | "oauth" | "magic_link" | "unknown";

  interface AuthProviderInfo {
    provider: string;
    connected_at: string;
  }
  ```

- [ ] **添加状态管理**

  ```typescript
  const [authMethod, setAuthMethod] = useState<AuthMethod>("unknown");
  const [oauthProviders, setOauthProviders] = useState<AuthProviderInfo[]>([]);
  ```

- [ ] **实现 `getAuthMethod` 函数**
      逻辑:
  1. 调用 `supabase.auth.getUserIdentities()` 获取 OAuth 身份
  2. 如果有 identities → 提取 provider 信息
  3. 调用 `supabase.rpc("fn_user_has_password")` 检查密码
  4. 返回 authMethod: "oauth" / "magic_link" / "password"

- [ ] **添加 useEffect 监听**

  ```typescript
  useEffect(() => {
    if (user) {
      getAuthMethod().then(setAuthMethod);
    }
  }, [user, getAuthMethod]);
  ```

- [ ] **更新 return 对象**
  ```typescript
  return {
    // 现有字段...
    authMethod,
    oauthProviders,
    getAuthMethod,
  };
  ```

#### 1.3 UI 层 - 账号页改造

- [ ] **修改 `app/account/page.tsx`**
      路径: `D:\Projects\investor-ai-g2\app\account\page.tsx`

- [ ] **导入 authMethod 和 oauthProviders**

  ```typescript
  const { isAuthenticated, user, authMethod, oauthProviders, getReportCredits, signOut } =
    useSupabaseAuth();
  ```

- [ ] **在 Line 192 之前插入新区块**
      位置: 在 "Notifications" 区块之前

  ```typescript
  {/* Authentication Methods 区块 */}
  <div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 p-4 space-y-3">
    <p className="text-sm text-subtle">{t("account.page.authMethodsLabel")}</p>

    {/* OAuth Provider */}
    {authMethod === "oauth" && oauthProviders.length > 0 && (
      <div className="space-y-2">
        {oauthProviders.map(provider => (
          <div key={provider.provider} className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
            <Image src={`/providers/${provider.provider}.svg`} alt={provider.provider} width={20} height={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-100">
                {t(`account.page.provider.${provider.provider}`)}
              </p>
              <p className="text-xs text-emerald-200/70">{t("account.page.provider.connected")}</p>
            </div>
            <span className="text-xs text-emerald-300 font-semibold">{t("account.page.provider.active")}</span>
          </div>
        ))}

        <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2">
          <p className="text-sm text-slate-300">{t("account.page.oauth.passwordNotRequired")}</p>
          <p className="text-xs text-slate-400 mt-1">{t("account.page.oauth.passwordHint")}</p>
        </div>
      </div>
    )}

    {/* Magic Link */}
    {authMethod === "magic_link" && (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
        <p className="text-sm font-medium text-amber-100">{t("account.page.magicLink.title")}</p>
        <p className="text-xs text-amber-200/70 mt-1">{t("account.page.magicLink.description")}</p>
      </div>
    )}
  </div>
  ```

- [ ] **添加 Image 导入**
  ```typescript
  import Image from "next/image";
  ```

#### 1.4 国际化文本

- [ ] **修改 `lib/i18n-config.ts`**

  **中文翻译**:

  ```typescript
  "account.page.authMethodsLabel": "登录方式",
  "account.page.provider.google": "Google 账号",
  "account.page.provider.connected": "已连接",
  "account.page.provider.active": "当前",
  "account.page.oauth.passwordNotRequired": "您通过 Google 登录，无需设置密码",
  "account.page.oauth.passwordHint": "如需使用密码登录，请添加密码作为备用登录方式",
  "account.page.magicLink.title": "邮箱魔法链接",
  "account.page.magicLink.description": "您当前使用邮箱魔法链接登录（无需密码）",
  ```

  **英文翻译**:

  ```typescript
  "account.page.authMethodsLabel": "Authentication Methods",
  "account.page.provider.google": "Google Account",
  "account.page.provider.connected": "Connected",
  "account.page.provider.active": "Active",
  "account.page.oauth.passwordNotRequired": "You sign in with Google, no password required",
  "account.page.oauth.passwordHint": "Add a password as backup sign-in method if needed",
  "account.page.magicLink.title": "Email Magic Link",
  "account.page.magicLink.description": "You currently use email magic links (no password required)",
  ```

#### 1.5 测试验证

- [ ] **启动开发服务器**

  ```bash
  cd /d/Projects/investor-ai && npm run dev
  ```

- [ ] **测试 OAuth 用户**
  1. 访问 http://localhost:3000/login
  2. 使用 Google 登录
  3. 进入 /account 页面
  4. 验证显示: "Google Account" + "Connected" + "Active"
  5. 验证显示: "You sign in with Google, no password required"

- [ ] **测试 Magic Link 用户**
  1. 注册新账号使用 Magic Link
  2. 进入 /account 页面
  3. 验证显示: "Email Magic Link" + 说明文字

- [ ] **控制台检查**
  - 无 TypeScript 错误
  - 无 React 警告
  - authMethod 正确输出到 console

---

## 📋 Phase 2: 简化登录流程 (P1 - 强烈建议)

**预估时间**: 2-3 小时
**依赖**: Phase 1 完成（可选）

### ✅ Checklist

#### 2.1 备份当前登录页

- [ ] **创建备份**
  ```bash
  cp D:/Projects/investor-ai-g2/app/(auth)/login/page.tsx D:/Projects/investor-ai-g2/app/(auth)/login/page.tsx.backup
  ```

#### 2.2 重构登录页

- [ ] **修改 `app/(auth)/login/page.tsx`**

  **主要改动**:
  1. 去除左右 Grid 布局（Line 111）
  2. 改为居中 flex 布局
  3. 减小卡片尺寸: `max-w-5xl` → `max-w-md`
  4. 去除左侧英雄区（Line 112-130）
  5. 保留: Logo + Title (居中)

- [ ] **Magic Link 折叠交互**

  ```typescript
  const [showMagicLinkForm, setShowMagicLinkForm] = useState(false);
  ```

  **折叠状态**:

  ```tsx
  <button
    type="button"
    onClick={() => setShowMagicLinkForm(true)}
    className="w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm"
  >
    {t("auth.email.useEmail")}
  </button>
  ```

  **展开状态**:

  ```tsx
  <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
    <input type="email" ... />
    <div className="flex gap-2">
      <button type="button" onClick={() => setShowMagicLinkForm(false)}>
        {t("auth.email.cancel")}
      </button>
      <button type="submit">{t("auth.email.send")}</button>
    </div>
  </form>
  ```

- [ ] **突出 Google 登录**
      保持现有样式，确保视觉突出:
  ```tsx
  className =
    "w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-white text-slate-900 px-4 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow";
  ```

#### 2.3 国际化文本

- [ ] **添加新文本**

  ```typescript
  // 中文
  "auth.email.useEmail": "使用邮箱登录",
  "auth.email.cancel": "取消",

  // English
  "auth.email.useEmail": "Use email instead",
  "auth.email.cancel": "Cancel",
  ```

#### 2.4 测试验证

- [ ] **视觉检查**
  1. 登录页居中显示
  2. 卡片尺寸适中（不超过 448px 宽度）
  3. Magic Link 默认折叠
  4. Google 按钮视觉突出

- [ ] **交互测试**
  1. 点击"Use email instead" → 展开邮箱表单
  2. 点击"Cancel" → 收起邮箱表单
  3. Google 登录流程正常
  4. Magic Link 发送流程正常

- [ ] **响应式测试**
  1. 手机端 (375px 宽度) - 正常显示
  2. 平板端 (768px) - 正常显示
  3. 桌面端 (1920px) - 居中显示

---

## 📋 Phase 3: 密码管理功能 (P2 - 可选)

**预估时间**: 3-4 小时
**依赖**: Phase 1 完成

### ✅ Checklist

#### 3.1 创建密码修改页面

- [ ] **新建文件**
      路径: `D:\Projects\investor-ai-g2\app\account\change-password\page.tsx`

- [ ] **实现 OAuth 用户拦截**

  ```typescript
  if (authMethod === "oauth") {
    return (
      <div className="...">
        <p>{t("account.password.oauthUserBlocked.title")}</p>
        <p>{t("account.password.oauthUserBlocked.description")}</p>
        <button onClick={() => router.push("/account")}>
          {t("account.page.returnToAccount")}
        </button>
      </div>
    );
  }
  ```

- [ ] **实现密码修改表单**
      字段:
  - Current Password (currentPassword)
  - New Password (newPassword)
  - Confirm Password (confirmPassword)

- [ ] **添加验证逻辑**
  - 密码长度 >= 8
  - newPassword === confirmPassword
  - 调用 `supabase.auth.updateUser({ password: newPassword })`

#### 3.2 国际化文本

- [ ] **添加密码页面文本**

  ```typescript
  // 中文
  "account.password.oauthUserBlocked.title": "OAuth 用户无需密码",
  "account.password.oauthUserBlocked.description": "您通过 Google 登录，无需设置密码。如需添加密码作为备用方式，请访问账号设置。",
  "account.page.returnToAccount": "返回账号页",
  "account.password.changeTitle": "修改密码",
  "account.password.current": "当前密码",
  "account.password.new": "新密码",
  "account.password.confirm": "确认密码",
  "account.password.mismatch": "两次输入的密码不一致",
  "account.password.tooShort": "密码长度至少 8 位",
  "account.password.changed": "密码修改成功",
  "account.password.error": "修改失败，请稍后重试",

  // English
  "account.password.oauthUserBlocked.title": "Password Not Required",
  "account.password.oauthUserBlocked.description": "You sign in with Google OAuth. Password management is not available for OAuth accounts.",
  "account.page.returnToAccount": "Return to Account",
  "account.password.changeTitle": "Change Password",
  "account.password.current": "Current Password",
  "account.password.new": "New Password",
  "account.password.confirm": "Confirm Password",
  "account.password.mismatch": "Passwords do not match",
  "account.password.tooShort": "Password must be at least 8 characters",
  "account.password.changed": "Password changed successfully",
  "account.password.error": "Failed to change password",
  ```

#### 3.3 测试验证

- [ ] **OAuth 用户拦截**
  1. 使用 Google 登录
  2. 访问 /account/change-password
  3. 验证显示拦截页面（非表单）

- [ ] **密码用户正常流程**
  1. 使用密码登录的用户
  2. 访问 /account/change-password
  3. 填写表单 → 提交成功

- [ ] **错误处理**
  - 密码不匹配 → 显示错误
  - 密码太短 → 显示错误
  - 网络错误 → 显示错误

---

## 🧪 完整测试清单 Full Testing Checklist

### 回归测试

- [ ] **登录流程**
  - [ ] Google OAuth 登录成功
  - [ ] Magic Link 登录成功
  - [ ] 登录后重定向到 /account

- [ ] **账号页面**
  - [ ] OAuth 用户显示正确的认证方法
  - [ ] Magic Link 用户显示正确的认证方法
  - [ ] 积分显示正常
  - [ ] 语言切换正常
  - [ ] 退出登录正常

- [ ] **权限控制**
  - [ ] 未登录访问 /account → 重定向到 /login
  - [ ] OAuth 用户访问 /account/change-password → 显示拦截页

### 浏览器兼容性

- [ ] Chrome (最新版)
- [ ] Firefox (最新版)
- [ ] Safari (如有 Mac)
- [ ] Edge (最新版)

### 设备测试

- [ ] 桌面端 (1920x1080)
- [ ] 平板端 (768x1024)
- [ ] 手机端 (375x667)

---

## 📊 验收标准 Acceptance Criteria

### Phase 1

- [x] 数据库 RPC 函数正常工作
- [x] useSupabaseAuth Hook 返回正确的 authMethod
- [x] 账号页显示"Authentication Methods"区块
- [x] OAuth 用户看到 Google 徽章
- [x] Magic Link 用户看到说明文字
- [x] 所有翻译文本正确显示

### Phase 2

- [x] 登录页改为居中单卡片布局
- [x] 卡片尺寸从 max-w-5xl 减少到 max-w-md
- [x] Magic Link 表单默认折叠
- [x] Google 登录按钮视觉突出
- [x] 交互流畅，无错误

### Phase 3 (可选)

- [x] OAuth 用户无法访问密码修改页
- [x] 显示友好的拦截页面
- [x] 密码用户可以正常修改密码
- [x] 错误处理完善

---

## 🚀 部署前检查 Pre-Deployment Checklist

- [ ] **代码质量**

  ```bash
  npm run lint
  # 无错误
  ```

- [ ] **类型检查**

  ```bash
  npm run type-check
  # 无 TypeScript 错误
  ```

- [ ] **构建测试**

  ```bash
  npm run build
  # 构建成功
  ```

- [ ] **迁移执行**

  ```bash
  npx supabase migration up
  # 迁移成功
  ```

- [ ] **文档更新**
  - [ ] CAVR 报告已创建
  - [ ] workstreams.md 已更新
  - [ ] 技术文档已归档

---

## 📝 完成后操作 Post-Completion Actions

1. **创建 Pull Request**

   ```bash
   git checkout -b feature/auth-ux-redesign-g2
   git add .
   git commit -m "feat: redesign auth UX - Phase 1+2 完成"
   git push -u origin feature/auth-ux-redesign-g2
   ```

2. **填写 PR 描述**
   参考模板:

   ```markdown
   ## Summary

   重构认证系统 UX，解决 OAuth 用户密码困惑、登录页复杂等问题

   ## Changes

   - Phase 1: 认证方法识别与展示
   - Phase 2: 简化登录流程

   ## Testing

   - [x] 手动测试通过
   - [x] Lint 通过
   - [x] 类型检查通过

   ## Screenshots

   [附上截图]
   ```

3. **更新 workstreams.md**
   将任务移动到"已完成"区块

4. **通知 HQ**
   "Auth UX 重构完成，PR 已提交，请审查"

---

## ⚠️ 回滚方案 Rollback Plan

如果出现问题，按以下步骤回滚：

1. **代码回滚**

   ```bash
   git checkout main
   git branch -D feature/auth-ux-redesign-g2
   ```

2. **数据库回滚**
   删除 RPC 函数:

   ```sql
   DROP FUNCTION IF EXISTS fn_user_has_password();
   ```

3. **清理缓存**
   ```bash
   rm -rf .next
   npm run dev
   ```

---

## 📚 参考文档

- [认证 UX 重构提案](./2025-11-30-auth-ux-redesign-proposal.md)
- [Before/After 对比](../design/auth-ux-before-after-comparison.md)
- [Supabase Auth API](https://supabase.com/docs/reference/javascript/auth-api)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**最后更新**: 2025-11-30
**维护者**: G2 Team
