# Investor AI 架构文档

> **最后更新**: 2025-12-10
> **架构版本**: v3.0 (G5集成 - 安全/性能/可观测性增强)

---

## 📋 目录

1. [架构概览](#架构概览)
2. [核心设计原则](#核心设计原则)
3. [三层架构详解](#三层架构详解)
4. [G5新增功能层](#g5新增功能层)
5. [核心模块](#核心模块)
6. [数据流](#数据流)
7. [API 设计](#api-设计)
8. [扩展性](#扩展性)

---

## 架构概览

Investor AI 采用标准的三层架构设计，清晰分离表现层、业务逻辑层和数据访问层：

```
┌─────────────────────────────────────────────────────────┐
│            表现层 (Presentation Layer)                   │
│  ┌──────────────────────┐  ┌──────────────────────────┐│
│  │  Next.js Pages       │  │   Admin Panel (Refine)   ││
│  │  - 用户界面          │  │   - 用户管理              ││
│  │  - 报告生成          │  │   - 积分管理              ││
│  │  - 报告展示          │  │   - 审计日志              ││
│  └──────────────────────┘  └──────────────────────────┘│
└───────────────────┬─────────────┬───────────────────────┘
                    │             │
┌───────────────────▼─────────────▼───────────────────────┐
│              API 层 (API Layer)                          │
│  ┌────────────────────────────────────────────────────┐│
│  │  Next.js API Routes                                ││
│  │  - /api/report        - /api/admin/*              ││
│  │  - /api/credits       - /api/search               ││
│  │  统一错误处理、认证、权限校验                        ││
│  └────────────────────────────────────────────────────┘│
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│          业务逻辑层 (Business Logic Layer)               │
│  ┌────────────────────────────────────────────────────┐│
│  │  lib/core/                                         ││
│  │  ┌──────────────────┐  ┌────────────────────────┐││
│  │  │ reports/         │  │ credits/               │││
│  │  │ - generator      │  │ - manager              │││
│  │  │ - sanitizer      │  │ - rewards              │││
│  │  │ - persistence    │  │ - transactions         │││
│  │  └──────────────────┘  └────────────────────────┘││
│  │  ┌──────────────────┐  ┌────────────────────────┐││
│  │  │ users/           │  │ admin/                 │││
│  │  │ - profile        │  │ - user-management      │││
│  │  │ - preferences    │  │ - audit                │││
│  │  └──────────────────┘  └────────────────────────┘││
│  └────────────────────────────────────────────────────┘│
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│          服务适配器层 (Service Adapter Layer)            │
│  ┌──────────────────────┐  ┌────────────────────────┐ │
│  │ lib/services/        │  │ 外部服务                │ │
│  │ - llm.ts             │──│ - Helicone/OpenRouter  │ │
│  │ - market-data.ts     │──│ - Finnhub API          │ │
│  │ - storage.ts         │──│ - Supabase Storage     │ │
│  └──────────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│                 数据层 (Data Layer)                      │
│  ┌──────────────────────┐  ┌────────────────────────┐ │
│  │ Supabase             │  │ 外部 API                │ │
│  │ - PostgreSQL         │  │ - Finnhub              │ │
│  │ - Auth               │  │ - LLM Providers        │ │
│  │ - Storage            │  │ - Langfuse             │ │
│  └──────────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 核心设计原则

### 1. 关注点分离 (Separation of Concerns)

- **表现层**: 仅负责 UI 渲染和用户交互
- **API 层**: 负责 HTTP 请求处理、认证、授权
- **业务逻辑层**: 包含核心业务规则和流程
- **服务适配器层**: 封装外部服务调用
- **数据层**: 数据存储和访问

### 2. 单一职责原则 (Single Responsibility)

每个模块只负责一件事：

- `ReportGenerator`: 仅负责报告生成流程编排
- `CreditManager`: 仅负责积分管理
- `LLMService`: 仅负责 LLM 调用
- `ContentSanitizer`: 仅负责内容净化

### 3. 依赖倒置 (Dependency Inversion)

- 高层模块不依赖低层模块，都依赖抽象
- 业务逻辑层不直接依赖具体的 LLM 提供商
- 通过依赖注入实现解耦

### 4. 可测试性 (Testability)

- 所有业务逻辑可独立测试
- 外部依赖可 mock
- 测试覆盖率目标: 80%+

### 5. 可扩展性 (Extensibility)

- 便于添加新功能
- 便于替换外部服务
- 便于未来微服务化

---

## 三层架构详解

### 表现层 (Presentation Layer)

#### 用户前端

- **技术栈**: Next.js 16.0.3 (App Router) + Tailwind CSS 4.0
- **职责**:
  - 渲染用户界面
  - 处理用户交互
  - 调用 API 获取数据
  - 展示错误和成功消息

#### Admin 后台

- **技术栈**: Refine 4.x + Next.js
- **职责**:
  - 用户管理 (CRUD)
  - 积分管理 (授予、查看)
  - 报告管理 (审核、删除)
  - 审计日志查看

### API 层 (API Layer)

#### 核心职责

- HTTP 请求处理
- 认证和授权
- 请求参数验证
- 错误处理
- 响应格式化

#### 主要端点

```typescript
GET / api / report; // 生成报告
GET / api / report / history; // 报告历史
GET / api / report / credits; // 查询积分
POST / api / admin / credits / grant; // 授予积分
GET / api / admin / users; // 用户列表
```

#### 统一错误处理

```typescript
// lib/api/error-handler.ts
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }
  // ... 处理其他错误
}
```

### 业务逻辑层 (Business Logic Layer)

#### lib/core/reports/

报告生成核心逻辑：

- **generator.ts**: 报告生成器
  - 编排整个生成流程
  - 调用 LLM、数据获取、内容净化
  - 性能追踪 (Langfuse)

- **content-sanitizer.ts**: 内容净化
  - 敏感词替换
  - 添加免责声明
  - 多语言支持

- **persistence.ts**: 报告持久化
  - 保存到数据库
  - 上传到 Storage
  - 检查报告复用

- **embeddings.ts**: 向量嵌入
  - 报告分块
  - 生成嵌入向量
  - 后台处理

#### lib/core/credits/

积分管理逻辑：

- **manager.ts**: 积分管理器
  - checkAndConsume(): 原子性扣除
  - getBalance(): 查询余额
  - grantCredits(): 管理员授予

- **rewards.ts**: 每日奖励
  - checkDailyRewardStatus(): 检查可领取
  - claimDailyReward(): 领取奖励
  - getStreakInfo(): 连续签到信息

### 服务适配器层 (Service Adapter Layer)

#### LLMService (lib/services/llm.ts)

```typescript
export class LLMService {
  async generateReport(
    systemPrompt: string,
    userPrompt: string,
    options?: LLMGenerationOptions
  ): Promise<string> {
    // 优先使用 Helicone
    try {
      return await this.callHelicone(...);
    } catch (error) {
      // 失败后回退到 OpenRouter
      return await this.callOpenRouter(...);
    }
  }
}
```

#### MarketDataService (lib/services/market-data.ts)

```typescript
export class MarketDataService {
  async fetchCompanyData(symbol: string): Promise<MarketData> {
    const [profile, quote, metrics, news] = await Promise.all([
      this.getProfile(symbol),
      this.getQuote(symbol),
      this.getMetrics(symbol),
      this.getNews(symbol),
    ]);
    return { symbol, profile, quote, metrics, news };
  }
}
```

---

## G5新增功能层

G5集成引入了三个跨层面的增强系统：**安全层**、**性能优化层** 和 **可观测性层**。

### 🔐 安全层 (Security Layer)

#### 1. MFA双因素认证

**位置**: `lib/security/mfa.ts`, `app/api/mfa/*`

```typescript
// MFA设备注册
await mfaManager.registerDevice(userId, {
  type: 'totp',
  secret: generateSecret(),
  deviceName: 'iPhone 15',
});

// 验证MFA代码
const isValid = await mfaManager.verifyCode(userId, code);
```

**数据库表**:
- `mfa_devices`: 存储用户MFA设备
- 支持TOTP(Google Authenticator)

#### 2. GDPR合规

**位置**: `app/api/gdpr/*`, `components/cookie-consent-banner.tsx`

**功能**:
- Cookie同意管理 (Essential, Analytics, Marketing)
- 数据导出 (JSON格式)
- 账号删除 (级联清理)
- 数据访问请求

**Cookie策略**:
```typescript
interface CookiePreferences {
  essential: boolean;  // 始终为true
  analytics: boolean;  // Vercel Analytics, Sentry
  marketing: boolean;  // 预留
}
```

#### 3. Rate Limiting

**位置**: `lib/api/rate-limit.ts`

**基于Upstash Redis的多层限流**:

```typescript
// 报告生成限流: 5次/分钟/用户
const result = await checkRateLimit(
  userId,
  reportGenerationRateLimit,
  { windowMs: 60000, maxRequests: 5 }
);

// 全局API限流: 20次/秒/IP
await checkRateLimit(ipAddress, globalRateLimit);
```

**内存降级**:
- Redis不可用时自动切换内存限流
- LRU淘汰策略防止内存耗尽

**限流器列表**:
- `reportGenerationRateLimit`: 5次/分钟
- `globalRateLimit`: 20次/秒
- `passwordChangeRateLimit`: 5次/小时
- `adminActionRateLimit`: 20次/小时
- `fileUploadRateLimit`: 10次/小时
- `searchRateLimit`: 30次/分钟
- `webhookRateLimit`: 100次/分钟

#### 4. CSP安全策略

**位置**: `lib/security/csp.ts`

```typescript
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' vercel.live;
  img-src 'self' data: https:;
  connect-src 'self' *.supabase.co *.helicone.ai;
```

#### 5. 输入验证

**位置**: `lib/api/validators.ts`

基于Zod的统一验证层:

```typescript
const reportRequestSchema = z.object({
  symbol: z.string().min(1).max(10),
  language: z.enum(['en', 'zh']),
  tone: z.enum(['baseline', 'conservative', 'aggressive']),
});
```

---

### ⚡ 性能优化层 (Performance Layer)

#### 1. LLM缓存系统

**位置**: `lib/llm/cache.ts`

**基于Upstash Redis的提示词缓存**:

```typescript
// 缓存key生成
const cacheKey = `llm:${hashPrompt(systemPrompt + userPrompt)}`;

// 缓存命中
if (cached) {
  return { content: cached, fromCache: true };
}

// 缓存miss,调用LLM并缓存
const result = await llm.generate(...);
await redis.setex(cacheKey, 3600, result);
```

**统计面板**: `app/admin/cache-stats`
- 命中率监控
- 缓存大小追踪
- 成本节省估算

#### 2. 数据库分区

**位置**: `supabase/migrations/20251210000004_add_table_partitioning.sql`

**按月分区audit_logs表**:

```sql
-- 创建分区表
CREATE TABLE audit_logs_2025_12 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- 自动创建分区函数
CREATE OR REPLACE FUNCTION fn_create_monthly_partition()
RETURNS void AS $$
BEGIN
  -- 自动创建下个月分区
END;
$$ LANGUAGE plpgsql;
```

**分区管理**: `app/api/admin/partitions`
- 自动分区创建
- 分区健康检查
- 历史数据清理

#### 3. 骨架屏加载

**位置**: `app/components/SkeletonLoader.tsx`

**流畅的加载体验**:
- `SkeletonCard`: 卡片骨架
- `SkeletonTable`: 表格骨架
- `SkeletonProfile`: 用户资料骨架
- `SkeletonChart`: 图表骨架

```typescript
<Suspense fallback={<SkeletonPage />}>
  <ReportList />
</Suspense>
```

---

### 📊 可观测性层 (Observability Layer)

#### 1. Webhook系统

**位置**: `app/api/webhooks/*`, `supabase/migrations/20251210000001_add_webhook_system.sql`

**功能**:
- 幂等性处理 (基于`idempotency_key`)
- 事件日志 (`webhook_events`表)
- 失败重试机制
- 签名验证

```typescript
// Stripe webhook处理
const event = await stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);

// 幂等性检查
const existing = await checkIdempotencyKey(event.id);
if (existing) return existing;

// 处理事件
await processWebhookEvent(event);
```

#### 2. 审计日志

**位置**: `audit_logs`表 (已分区)

**记录所有关键操作**:
```typescript
await auditLog({
  userId,
  action: 'CREDIT_GRANT',
  resourceType: 'credit',
  resourceId: creditId,
  changes: { before: 10, after: 20 },
});
```

**查询界面**: `app/admin/audit-logs`

#### 3. 缓存统计面板

**位置**: `app/admin/cache-stats`, `components/admin/cache-stats-view.tsx`

**实时监控**:
- 缓存命中率
- 请求总数
- 缓存大小
- 成本节省估算

#### 4. 分区管理工具

**位置**: `app/admin/partitions`, `components/admin/partition-manager.tsx`

**功能**:
- 分区健康监控
- 自动创建下个月分区
- 分区大小统计
- 历史分区清理

---

## 核心模块

### 报告生成流程

```typescript
// 1. API 层接收请求
GET /api/report?symbol=AAPL&lang=en&tone=baseline

// 2. 认证和权限检查
const user = await authenticate(request);

// 3. 检查积分
const creditManager = new CreditManager();
await creditManager.checkAndConsume(user.id, 1);

// 4. 生成报告
const generator = new ReportGenerator();
const report = await generator.generate({
  symbol: 'AAPL',
  language: 'en',
  tone: 'baseline',
  userId: user.id,
});

// 5. 保存报告
const persistence = new ReportPersistence();
const saved = await persistence.saveReport(report, user.id);

// 6. 后台生成嵌入
embeddingsManager.generateEmbeddings(saved.id, report.content);

// 7. 返回结果
return successResponse({ report: saved });
```

### 积分管理流程

```typescript
// 查询余额
const balance = await creditManager.getBalance(userId);
// => { credits_available: 30, credits_used: 5 }

// 扣除积分 (原子操作)
await creditManager.checkAndConsume(userId, 1);

// 管理员授予积分
await creditManager.grantCredits(
  adminId,
  targetUserId,
  amount: 10,
  reason: "补偿"
);
```

---

## 数据流

### 报告生成数据流

```
User Request
    ↓
API Route (auth + validation)
    ↓
CreditManager.checkAndConsume()
    ↓
ReportGenerator.generate()
    ├─→ MarketDataService.fetchCompanyData()
    ├─→ LLMService.generateReport()
    └─→ ContentSanitizer.sanitize()
    ↓
ReportPersistence.saveReport()
    ├─→ Supabase (database)
    └─→ StorageService.uploadReportJson()
    ↓
EmbeddingsManager.generateEmbeddings() [background]
    ↓
Response to User
```

### 积分授予数据流

```
Admin Request
    ↓
API Route (admin auth)
    ↓
CreditManager.grantCredits()
    ├─→ checkAdminPermission()
    ├─→ Update report_credits table
    ├─→ Insert into report_credit_events
    └─→ Insert into audit_logs
    ↓
Response to Admin
```

---

## API 设计

### 统一响应格式

#### 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "积分不足",
    "details": { ... }
  }
}
```

### 错误代码

| 错误代码                   | HTTP 状态码 | 说明         |
| -------------------------- | ----------- | ------------ |
| `UNAUTHORIZED`             | 401         | 未授权       |
| `FORBIDDEN`                | 403         | 权限不足     |
| `INSUFFICIENT_CREDITS`     | 403         | 积分不足     |
| `NOT_FOUND`                | 404         | 资源不存在   |
| `VALIDATION_ERROR`         | 400         | 参数验证失败 |
| `EXTERNAL_SERVICE_ERROR`   | 502         | 外部服务错误 |
| `REPORT_GENERATION_FAILED` | 500         | 报告生成失败 |

---

## 扩展性

### 微服务化准备

当前架构已为未来微服务化做好准备：

1. **报告生成服务**
   - `lib/core/reports/` → 独立服务
   - 通过 API Gateway 调用

2. **积分管理服务**
   - `lib/core/credits/` → 独立服务
   - 事件驱动架构

3. **Admin 服务**
   - `lib/core/admin/` → 独立后台
   - 独立部署和扩展

### 添加新功能

#### 示例: 添加报告分享功能

1. 创建业务逻辑 `lib/core/reports/sharing.ts`
2. 创建 API 端点 `app/api/report/share/route.ts`
3. 添加数据库表 `report_shares`
4. 更新前端组件

---

## 相关文档

- [重构总结](../../REFACTOR_SUMMARY.md)
- [重构计划](../decisions/2025-12-01-complete-refactor-plan.md)
- [SaaS 架构决策](../decisions/2025-12-01-saas-architecture-and-restructure.md)

---

**维护者**: Architecture Team
**反馈**: 请通过 GitHub Issues 提交反馈
