# 登录体验重构 Snapshot (2025-11-30)

## 背景 / 问题
- 现有 `/login` 混合多家 OAuth（Google/Microsoft/Apple）与邮箱入口，按钮有禁用态、文案泛化，品牌质感和信任度不足，且未来只保留 Google + Supabase 邮箱 OTP。
- 错误与成功提示（URL `?error`、魔法链接发送）不区分场景，缺少速率限制/风控反馈；用户不知道邮箱链路是由 Supabase 托管，也不了解本地模式要去 Inbucket。
- 视觉层级单一（灰底卡片），未突出主 CTA，移动端缺乏明确的层次与留白，不能支撑“顶级水准”的第一印象。

## 设计目标
1. 登录手段收敛：仅保留 Google OAuth 与 Supabase 邮箱 OTP（魔法链接），界面和代码同时去掉其他 IdP。
2. 体验优先：首屏突出 Google CTA，邮箱入口作为平权的二级 CTA，完整状态流（加载、成功、失败、冷却）。
3. 可信背书：显式展示 “Supabase Auth 托管 / 数据加密” 安全徽标与隐私链接，减少用户疑虑。
4. 本地/生产双模式提示：自动根据 `NEXT_PUBLIC_SUPABASE_URL` 判断是否本地 stack，给出 Inbucket 指引；Hosted 模式给出 10 分钟有效期等说明。
5. 可测试与可维护：`useSupabaseAuth` 只暴露 `google` + `email` 分支，i18n key 明确，新增 UI 状态可在 Vitest 中覆盖。

## 技术约束
- 技术栈：Next.js App Router + React 19；登录页仍为 Client Component，保留 Suspense fallback。
- Auth SDK：仅使用 `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })` 与 `signInWithOtp({ email, options })`；删除其他 provider 配置/常量。
- 复制已有约束：沿用 `useLanguage` i18n，按钮/提示使用 Tailwind v4 class，颜色 token 用 `@theme inline` 默认调色板；遵守 ESLint 规则。
- 环境提示：通过 `isLocalSupabase`（参考 `docs/decisions/2025-11-27-supabase-local-auth.md`）判断 Inbucket 提示；Hosted 不展示调试链接。
- 回调路径：沿用 `/api/auth/callback` 与 `callbackUrl` 支持，避免破坏既有路由跳转。

## 方案概览
- **信息架构**
  - 头部：品牌徽标 + “Supabase Secure Login” 徽章。
  - 主 CTA：Google 登录（大按钮，左侧图标，右侧说明“推荐，2 秒完成”）。
  - 辅 CTA：邮箱登录区域折叠/展开式，输入框 + 发送按钮，说明 OTP 有效期与邮箱检查指引。
  - 状态区：成功（绿色）/错误（琥珀/红色）提醒，带重试/切换建议。
  - 辅助：隐私/条款链接、客服邮箱/反馈链接。
- **交互与状态**
  - Google：点击后置 pending 态（spinner/文本），阻止二次点击；失败弹出错误提示。
  - 邮箱：输入校验（空/非法格式），发送时禁用按钮，成功后按钮文案切换为 “已发送 · 60s 内有效”，并在本地模式提示 “打开 Inbucket”。
  - 全局错误：当 URL 存在 `?error=` 时，映射为通用错误提示；额外捕获 Supabase 返回的 `status === 429` 展示冷却文案。
- **视觉方向**
  - 背景：深色粒子/渐变 + 模糊玻璃卡片；Google CTA 使用亮色描边 + 投影，邮箱区采用柔和边框。
  - 布局：桌面端卡片居中，顶部留余白；移动端全宽，CTA 顺序保持 Google → 邮箱。
- **实现要点**
  - 重写 `providerButtons` 为单一 `google` 常量；删除 Apple/Microsoft 相关 icon 与文案。
  - 将邮箱流状态拆分为 `idle/loading/sent/error/cooldown`，cooldown 可根据 Supabase 错误码（429/4xx）设置 60s 禁用。
  - 引入 `AuthInfoBanner` 子组件：根据本地/Hosted 渲染不同提示与链接（Inbucket / “10 分钟内查收”）。
  - 若当前已有 session，则 SSR 前置重定向到 `/account`（Claude 可评估是否在 `app/(auth)/login/page.tsx` 内通过 `useEffect` + `useSupabaseAuth` 早退）。

## 文案 key（补充/替换）
- `auth.hero.title`: `登录 Investor AI`
- `auth.hero.subtitle`: `使用 Google 或邮箱一次性验证码快速进入。`
- `auth.provider.google`: `使用 Google 登录`
- `auth.provider.google.hint`: `推荐 · 2 秒完成`
- `auth.email.title`: `使用邮箱继续`
- `auth.email.placeholder`: `name@example.com`
- `auth.email.send`: `发送登录链接`
- `auth.email.sent`: `已发送，60 秒内检查邮箱`
- `auth.email.localHint`: `本地模式：请在 Inbucket 查看邮件`
- `auth.email.hostedHint`: `邮件 10 分钟内有效，请在收件箱查收`
- `auth.error.generic`: `登录暂时不可用，请稍后重试。`
- `auth.error.cooldown`: `请求过于频繁，请稍后再试。`
- `auth.badge.supabase`: `Supabase Auth 托管 · 数据加密`

## 测试 / 验收
1. **Unit**：为 `useSupabaseAuth` 新增用例，覆盖 `signInWithProvider("google")` 与 `signInWithEmail` 错误/成功分支；模拟 429 返回触发 cooldown。
2. **Component**：在 Vitest + Testing Library 为 `/login` 渲染测试：Google 按钮仅一个；邮箱发送后展示成功提示；`?error=foo` 时出现通用错误。
3. **Manual**：
   - 本地 Supabase：`npx supabase start` + `npm run dev`，输入邮箱→Inbucket 收到邮件，点击链接后 session 存在。
   - Hosted/Mock：点击 Google 按钮触发 OAuth 跳转，取消后返回错误提示但页面仍可重试。
4. **Lint**：`npm run lint` 必须通过。

## 交付拆解（给 Claude）
1. 清理 `app/(auth)/login/page.tsx` 仅保留 Google + 邮箱流，改造 UI 结构与状态。
2. 更新 `useSupabaseAuth`，删除非 Google provider 分支；邮箱发送增加错误码处理并返回状态码供 UI 使用。
3. 补充 `lib/i18n.tsx` 文案 key，删除 Apple/Microsoft 相关条目；若涉及 icon 清理，移除未使用静态资源。
4. 新增/更新 Vitest 覆盖（hook + page），确保邮箱/Google 状态可测试；更新 CAVR 验证步骤。
5. 手动验收并在报告中记录截图/命令；保持 README/ENV 无需变更，如有 Inbucket 链接调整则同步相关文档。
