# Snapshot：Cloudflare Turnstile（2025-12-07）

## 背景

- 当前登录/注册/魔法链接/重置密码都直接调用 Supabase，虽然有 Upstash 速率限制，但缺少机器人校验，存在邮箱轰炸与暴力登录风险。
- 需在 Vercel 生产环境接入 Cloudflare Turnstile，覆盖上述表单，保证服务端校验与回退策略，不影响现有 Google OAuth。

## 设计目标

1. 在密码登录、注册、魔法链接、重置密码提交前必须通过 Turnstile 校验，否则阻断。
2. 服务端 `/api/auth/verify-turnstile` 使用 Turnstile Secret Key 验证 token，失败返回明确错误码，前端可提示重试。
3. 缺失配置时自动降级为允许通过（保持开发环境可用），但 UI 不显示验证组件。
4. 尽量复用现有 Supabase auth hook，不改动 OAuth 流程；校验失败或 token 过期时可重新渲染组件获取新 token。
5. 遵循现有 Tailwind v4/React 19 代码风格，i18n 覆盖多语言。

## 技术约束

- Next.js 16 App Router，相关 API 路由可放 Edge/runtime 默认；可用 fetch 直连 `https://challenges.cloudflare.com/turnstile/v0/siteverify`。
- 环境变量：`NEXT_PUBLIC_TURNSTILE_SITE_KEY`（前端渲染），`TURNSTILE_SECRET_KEY`（服务端验证）；示例需更新 `.env.local.example`。
- 现有 auth 速率限制 `checkAuthRateLimit` 需保留，Turnstile 校验应优先于发送邮件或密码登录调用。
- UI 组件置于 `app/components/Turnstile.tsx`，共用 `isTurnstileEnabled()` 判断；避免阻塞 SSR。

## 文案 key

| key                         | zh-Hans           | en                                   | 说明            |
| --------------------------- | ----------------- | ------------------------------------ | ------------- |
| `auth.error.turnstile`      | 请先完成验证。    | Please complete verification.         | 缺少 token 提示 |
| `auth.error.turnstileFail`  | 验证未通过，请重试。 | Verification failed. Please retry.    | 校验失败重试    |

（需同步至 `lib/i18n.tsx` 多语言）

## 工作拆分

- 更新环境示例：`.env.local.example` 增加 Turnstile Site/Secret Key。
- 新增 Turnstile 客户端组件与共享 `isTurnstileEnabled()`。
- 新建 `/api/auth/verify-turnstile` 服务端验证路由。
- 改造 `useSupabaseAuth`：在邮件/密码登录、注册、魔法链接、重置密码前调用 Turnstile 校验；新增错误码。
- 登录页集成组件，所有表单提交携带 token；处理过期/失败的重渲染。
- i18n 文案落库。
- 验证 lint/test，手动检查表单交互（含缺省 env 的降级）。

## 测试要求

- `npm run lint`，`npm test`。
- 开启 Turnstile 配置后手动验证：密码登录、注册、魔法链接、重置密码均需先通过验证；验证失败或过期可重新获取。
- 移除/留空 Turnstile 配置时，表单可正常提交且不会加载组件（降级路径）。***
