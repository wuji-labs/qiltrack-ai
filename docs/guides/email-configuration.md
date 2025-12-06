# Qiltrack AI 邮箱配置指南

本文档说明 Qiltrack AI 项目中的邮箱体系配置和使用规范。

## 邮箱列表

所有 `@qiltrack.com` 邮箱均通过 **Cloudflare Email Routing** 统一转发到 `qiltrack-ai@googlegroups.com`。

| 邮箱地址 | 用途 | 使用场景 |
|---------|------|---------|
| `no-reply@qiltrack.com` | 系统邮件 | 注册确认、密码重置、自动通知等不需要回复的邮件 |
| `support@qiltrack.com` | 客户支持 | 用户问题反馈、技术支持请求 |
| `contact@qiltrack.com` | 一般联系 | 商务合作、一般查询 |
| `legal@qiltrack.com` | 法律事务 | 合同审阅、法律咨询、合规事务、隐私政策咨询 |
| `info@qiltrack.com` | 信息查询 | 公司概况、新闻媒体联系 |
| `help@qiltrack.com` | 帮助支持 | 帮助中心、常见问题解答 |
| `sales@qiltrack.com` | 销售咨询 | 产品询问、企业订阅、商业合作 |
| `marketing@qiltrack.com` | 市场营销 | 营销活动、促销邮件、合作推广 |
| `team@qiltrack.com` | 团队内部 | 系统告警、内部通知、项目协作 |
| `feedback@qiltrack.com` | 用户反馈 | 产品建议、改进意见收集 |
| `careers@qiltrack.com` | 招聘相关 | 工作机会、人才招聘 |

## 技术架构

```
用户发送邮件
     ↓
@qiltrack.com (Cloudflare Email Routing)
     ↓
qiltrack-ai@googlegroups.com (Google Groups)
     ↓
团队成员收到通知
```

### Cloudflare 配置

- **DNS 记录**: MX 记录指向 Cloudflare 邮件服务器
- **路由规则**: 每个邮箱地址单独配置，统一转发到 Google Groups
- **状态**: 所有路由均已激活 ✅

### Google Groups 设置

- **群组地址**: `qiltrack-ai@googlegroups.com`
- **发帖权限**: 网络上的任何人（允许外部邮件）
- **成员**: 团队核心成员

## 代码中的邮箱使用

### 环境变量配置

```env
# .env.vercel
EMAIL_FROM="Qiltrack AI <no-reply@qiltrack.com>"
```

### 告警系统 (lib/observability/alerts.ts)

```typescript
// 系统告警发送地址
from: process.env.ALERT_EMAIL_FROM || 'no-reply@qiltrack.com'

// 告警接收地址
to: process.env.ALERT_EMAIL_TO?.split(',') || ['team@qiltrack.com']
```

### 监控系统 (lib/observability/uptime.ts)

```typescript
// 监控告警接收
recipients: ['team@qiltrack.com']
```

### 错误边界 (app/components/ErrorBoundary.tsx)

```tsx
// 用户遇到错误时的联系邮箱
<a href="mailto:support@qiltrack.com">联系技术支持</a>
```

### 法律页面 (app/legal/*)

```tsx
// 法律相关咨询
<a href="mailto:legal@qiltrack.com">legal@qiltrack.com</a>
```

## 使用规范

### 选择正确的邮箱

| 场景 | 推荐邮箱 |
|-----|---------|
| 发送系统自动邮件 | `no-reply@qiltrack.com` |
| 前端显示技术支持联系 | `support@qiltrack.com` |
| 前端显示法律/隐私相关 | `legal@qiltrack.com` |
| 前端显示一般联系 | `contact@qiltrack.com` |
| 后端系统告警通知 | `team@qiltrack.com` |
| 用户反馈收集入口 | `feedback@qiltrack.com` |

### 新增邮箱地址

如需添加新的邮箱地址：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择 `qiltrack.com` 域名
3. 进入 **电子邮件** → **电子邮件路由**
4. 点击 **创建地址**
5. 输入自定义地址，目标选择 `qiltrack-ai@googlegroups.com`
6. 更新本文档

## Supabase 邮件配置

Supabase Auth 使用的邮件配置需要在 Supabase Dashboard 中单独设置：

1. 进入 Supabase 项目 → **Authentication** → **Email Templates**
2. 配置发件人地址为 `no-reply@qiltrack.com`
3. 如需使用自定义 SMTP，在 **SMTP Settings** 中配置

### 本地开发

本地开发时，Supabase 使用 Inbucket 作为邮件测试服务器：
- 端口: 54324
- 邮件不会实际发送，可在 Web 界面查看

## 常见问题

### Q: 为什么所有邮件都转发到一个 Google Groups?

A: 目前团队规模较小，统一管理更高效。当业务量增大时，可以考虑：
- 为 support@ 创建单独的 Google Groups
- 使用专业客服系统（如 Zendesk）
- 按职能拆分不同的接收组

### Q: 邮件没有收到怎么办?

1. 检查 Google Groups 的垃圾邮件/待审批
2. 确认 Cloudflare 路由状态为"活动"
3. 检查 DNS MX 记录是否正确配置

### Q: 如何回复用户邮件?

目前通过 Google Groups 收到的邮件，需要用个人邮箱回复。建议：
1. 在 Gmail 中设置"发送为" qiltrack.com 邮箱（需要 SMTP 配置）
2. 或使用专业邮件服务（如 Google Workspace）

## 相关文件

- `lib/observability/alerts.ts` - 告警邮箱配置
- `lib/observability/uptime.ts` - 监控邮箱配置
- `app/components/ErrorBoundary.tsx` - 错误页联系邮箱
- `app/legal/*` - 法律页面联系邮箱
- `.env.vercel` - 环境变量配置

## 更新日志

- **2025-12-06**: 初始文档创建，配置 11 个业务邮箱（含 legal@）
