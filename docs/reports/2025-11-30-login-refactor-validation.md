# 登录体验重构实机验证（2025-11-30）

## Context
- 环境：本地 dev server `http://localhost:3001`，Supabase 本地（Inbucket 可访问 `127.0.0.1:54324`），浏览器 DevTools MCP 实操。
- 目标：验证 Snapshot 中登录流程（Google + 邮件 OTP）在本地环境的真实行为与提示。

## Actions
1) 进入 `/login`，检查 UI 文案与状态区块，确认仅保留 Google CTA 与邮箱表单。  
2) 提交无效邮箱 `bad-email`，观察错误提示。  
3) 提交有效邮箱 `user@example.com`，等待状态、检查按钮禁用与提示。  
4) 打开 Inbucket，确认最新邮件内容与 Magic Link 重定向 URL。  
5) 点击 Google CTA，观察 Supabase OAuth 跳转结果。

## Verification
- UI：页面展示 “Supabase Auth · Encrypted” 徽章、Google 大 CTA、邮箱表单与 Inbucket 本地提示，符合设计稿。  
- 邮箱校验：`bad-email` 立即显示 `Please enter a valid email...`，未触发请求。  
- 邮箱登录：`user@example.com` 返回成功提示 `Link sent. Check your inbox within 60s.`，按钮进入禁用状态。  
- Inbucket：`http://127.0.0.1:54324/` 收到主题 “Your Magic Link”，正文含登录链接 `http://127.0.0.1:54321/auth/v1/verify?...redirect_to=http://localhost:3001/api/auth/callback`，验证码 `497206`；证明本地 Supabase/邮件链路正常。  
- Google OAuth：点击后跳转 `http://127.0.0.1:54321/auth/v1/authorize?...provider=google...` 返回 JSON `Unsupported provider: provider is not enabled` (400)，说明本地 Supabase 未开启 Google provider。

## Risks / Follow-ups
- 本地 Google OAuth 未配置/启用：需要在 Supabase 控制台开启 Google provider 并填好 client id/secret，或在本地 `.env.local` 指向启用了 Google 的 Supabase 项目后重试。  
- Hosted 场景未在本轮验证；需在生产/预发环境再次走通 Google 与邮件链路，确认 10 分钟送达文案与实际一致。  
- 当前邮件链路依赖本地 Supabase；切换到远端项目时应重新验证回调路径 `/api/auth/callback` 是否在允许列表。
