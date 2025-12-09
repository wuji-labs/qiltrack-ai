# Google Identity Services 配置指南

本项目已全面升级到 Google Identity Services，提供更好的用户体验和品牌专业度。

## 功能说明

### 两种 Google 登录方式（统一技术方案）

#### 1. Google One Tap（自动弹出）
- 自动在网页上显示 Google 账号选择器
- 未登录用户访问网站时自动弹出
- 用户可以一键选择 Google 账号登录
- 支持静默登录（如果之前已授权）

#### 2. Google 登录按钮（手动点击）
- 用户主动点击"使用 Google 登录"按钮
- 弹窗选择账号（不跳转页面）
- 登录完成后留在当前页面

### 核心优势

| 对比项 | 旧方案（Supabase OAuth） | 新方案（Google Identity Services） |
|--------|------------------------|--------------------------------|
| **用户看到的域名** | ❌ inmtounwqcjwsxkfnsfd.supabase.co | ✅ qiltrack.com |
| **是否跳转** | ❌ 跳转到 Google 授权页面 | ✅ 弹窗，不跳转 |
| **品牌专业度** | ❌ 显示第三方域名 | ✅ 只显示你的品牌 |
| **用户体验** | ❌ 需要等待跳转 | ✅ 即时响应 |
| **Supabase 统计** | ✅ 可以统计 | ✅ 可以统计 |

## 配置步骤

### 重要说明

**Google OAuth Client ID 的真正来源是 Google Cloud Console**。如果你已经在 Supabase 中配置过 Google OAuth，可以直接从 Supabase Dashboard 查看；如果还没配置，需要先从 Google Cloud Console 创建。

### 方法一：从 Google Cloud Console 创建（首次配置）

这是获取 Client ID 的**唯一真实来源**。完整流程如下：

#### 步骤 1：在 Google Cloud Console 创建 OAuth 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目（或创建新项目）
3. 进入 **APIs & Services** > **Credentials**
4. 点击 **Create Credentials** > **OAuth 2.0 Client ID**
5. 选择应用类型：**Web application**
6. 配置授权的 JavaScript 来源和重定向 URI（见下方配置）
7. 创建后，你会获得：
   - **Client ID** (例如: `xxx.apps.googleusercontent.com`)
   - **Client Secret** (例如: `GOCSPX-xxx`)

#### 步骤 2：在 Supabase Dashboard 配置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Authentication** > **Providers**
4. 找到 **Google** 提供商并启用
5. 输入上一步获得的 **Client ID** 和 **Client Secret**
6. 保存配置

#### 步骤 3：在应用中使用

在 `.env.local` 中配置（使用步骤 1 获得的 Client ID）：

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=你的Client_ID.apps.googleusercontent.com
```

### 方法二：从 Supabase Dashboard 查看（已配置过）

如果你已经完成过上述配置，可以直接从 Supabase 查看：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Authentication** > **Providers** > **Google**
4. 复制显示的 **Client ID**
5. 在 `.env.local` 中配置

## 重要配置

### 授权的 JavaScript 来源

在 Google Cloud Console 的 OAuth 客户端设置中，确保添加了你的网站域名：

**开发环境：**
```
http://localhost:3000
http://localhost:3001
http://192.168.8.40:3000
```

**生产环境：**
```
https://your-domain.com
https://www.your-domain.com
```

### 授权的重定向 URI

确保添加了 Supabase 的回调 URL：

```
https://your-project.supabase.co/auth/v1/callback
```

## 测试

配置完成后：

1. 重启开发服务器：`npm run dev`
2. 打开浏览器访问网站（未登录状态）
3. 应该会自动弹出 Google 账号选择器

### 常见问题

**Q: Google One Tap 没有显示？**
A: 检查以下几点：
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 是否正确配置
- 浏览器控制台是否有错误信息
- 确保没有已登录（One Tap 只对未登录用户显示）
- 检查授权的 JavaScript 来源是否包含当前域名

**Q: 点击登录后没有反应？**
A: 检查：
- Supabase Google OAuth 是否正确配置
- 授权的重定向 URI 是否正确
- 浏览器控制台的错误信息

**Q: 如何禁用 Google One Tap？**
A: 删除或注释掉 `.env.local` 中的 `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 即可。

## 代码位置

- 组件：`app/components/GoogleOneTap.tsx`
- 集成：`app/providers.tsx`
- 环境变量：`.env.local`

## 参考文档

- [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview)
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
