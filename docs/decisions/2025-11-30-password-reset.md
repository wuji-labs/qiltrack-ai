# Password Reset Recovery Flow Fix

## 背景 / Problem
- 用户点击 Supabase 密码重置邮件后落到登录页并显示“登录暂不可用”，无法继续设置新密码。
- 原因：邮件链接中恢复 token 放在 URL hash（`#access_token` 等），后端回调 `/api/auth/callback` 无法读取 fragment，导致 code 交换失败并重定向到错误页面。

## 目标 / Goals
- 在客户端正确解析 Supabase recovery 链接的 hash/code，完成 session 注入并跳转到修改密码页。
- 兼容现有登录/魔术链接流程，不破坏其他回调逻辑。
- 显示明确的状态/错误提示，避免“暂不可用”的误导。

## 约束 / Constraints
- 保持 Next.js App Router + Supabase JS v2 现有模式；仅前端调整，不修改后端 schema。
- 复用现有文案 key（`auth.error.generic` 等），不新增复杂 i18n。
- 页面需在客户端安全读取 `window.location.hash`，避免 SSR 访问 window。

## 文案 Key / Copy
- 状态文案复用：`auth.resetPassword.description`、`auth.resetPassword.title`、`auth.error.generic`。
- 按钮/链接：`auth.resetPassword.backToSignin`。

## 测试要求 / Testing
- 手动验证：触发忘记密码 → 点击邮件链接 → 观察自动跳转到 `/account/change-password?type=recovery` 并成功设置新密码。
- 回归验证：魔术链接登录仍可完成会话；无 code/hash 时显示错误提示并可返回登录页。
