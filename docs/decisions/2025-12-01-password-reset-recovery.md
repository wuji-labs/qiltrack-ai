# 密码找回恢复链路快照（Login → Reset → Change）

## 问题背景
- 用户点击 Supabase 密码重置邮件后，浏览器先显示“Redirecting to reset password...”，随后落到 `/account/reset-password` 并提示“登录暂不可用”，无法继续设置新密码。
- 当前恢复页仅解析 query `code`/`token` 与 hash `code`/`access_token`/`refresh_token`，遗漏 Supabase 链接常见的 `token_hash`；缺参或交换失败时一律用 `auth.error.generic`，导致误导。

## 设计目标
- 前端完整解析 Supabase recovery 链接（code/token_hash/hash access_token/refresh_token），成功写入 session 并重定向到 `/account/change-password?type=recovery`。
- 过期/缺参等异常时提示“链接已失效/请重新发送邮件”，避免“登录暂不可用”误导；保留返回登录入口。
- 兼容既有登录/魔法链接/注册流程，不破坏其他回调逻辑。

## 技术约束
- 仅调整 Next.js App Router 前端/边缘逻辑，不改后端 schema；继续使用 Supabase JS v2 + auth-helpers。
- 复用既有 i18n key，不新增文案；SSR 环境需避开直接访问 `window`。
- 保持 `/api/auth/callback?type=recovery` 保留 hash 的转发方式，避免服务端 302 丢失 fragment。

## 文案 key
- `auth.resetPassword.{title,subtitle,description,emailSent,backToSignin,redirecting,linkExpired}`
- 错误回退：`auth.error.generic`

## 测试要求
- 手动：触发重置邮件 → 点击邮件链接 → 自动跳转 `/account/change-password?type=recovery` → 成功设置新密码。
- 过期或缺参链接应显示“链接已失效/请重新发送邮件”，并可返回登录。
- 无 token 时可回到登录页；仍能正常完成普通登录/魔法链接/注册流程。
