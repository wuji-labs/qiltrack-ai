# 报告生成系统 v2 - 使用指南

## 概览

报告生成系统 v2 是对原有系统的全面重构,主要改进:

- ✅ **类型安全**: 使用 Supabase 生成的类型,移除所有 `any`
- ✅ **可靠的后台任务**: 使用 Inngest 替代 BullMQ
- ✅ **监控和追踪**: 集成 Vercel Analytics
- ✅ **灰度发布**: Feature Flag 控制,秒级回滚

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

新增依赖:
- `inngest@^3.46.0` - 后台任务处理
- `@vercel/analytics` - 监控追踪

移除依赖:
- `bullmq` - 已被 Inngest 替代
- `ioredis` - 不再需要

---

### 2. 环境变量配置

在 `.env.local` 添加:

```bash
# Feature Flags
NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM=false  # 灰度发布控制

# Inngest (从 https://app.inngest.com 获取)
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key

# 现有的环境变量保持不变
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

---

### 3. 数据库 Migration

```bash
# 方式1: 使用 Supabase CLI (推荐)
supabase db push

# 方式2: 手动执行 SQL
# 运行 supabase/migrations/20251203000010_fix_report_posts_schema.sql
```

**Migration 内容**:
- 添加 `report_run_id` (UUID, unique)
- 添加 `user_id` (UUID, 外键到 profiles)
- 添加 `tone` (TEXT, 约束为 baseline/buffett/musk/muddy)
- 创建索引和 RLS 策略

---

### 4. 生成类型

```bash
# 从数据库生成 TypeScript 类型
npm run db:types
```

这会更新 `types/database.ts`,确保类型同步。

---

## 使用新系统

### 启用 Feature Flag

```bash
# 开发环境: 修改 .env.local
NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM=true

# 生产环境: 使用脚本
./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM true
```

### 代码示例

#### 使用 ReportPersistence v2

```typescript
import { ReportPersistence } from '@/lib/core/reports/persistence.v2';

const persistence = new ReportPersistence();

// 保存报告 (类型安全)
const savedReport = await persistence.saveReport(
  {
    content: '报告内容...',
    symbol: 'AAPL',
    title: 'Apple Inc. 投资分析报告',
    language: 'zh-Hans',
    tone: 'baseline',
    marketData: { /* ... */ },
  },
  userId,           // string | null
  reportRunId       // string (UUID)
);

// 检查可复用报告
const reusable = await persistence.checkReusableReport(
  'AAPL',
  'zh-Hans',
  'baseline',
  userId
);
```

#### 使用 ReportGenerator v2

```typescript
import { ReportGeneratorV2 } from '@/lib/core/reports/generator.v2';

const generator = new ReportGeneratorV2();

const report = await generator.generate({
  symbol: 'AAPL',
  language: 'zh-Hans',
  tone: 'baseline',
  userId: 'user-123',
});

// report.content - 报告内容
// report.marketData - 市场数据
// report.metadata - 元数据 (包含 reportRunId)
```

#### Feature Flag 控制

```typescript
import { featureFlags } from '@/lib/feature-flags';
import { ReportPersistence } from '@/lib/core/reports/persistence';      // v1
import { ReportPersistence as ReportPersistenceV2 } from '@/lib/core/reports/persistence.v2'; // v2

// 在 API route 中
if (featureFlags.useNewReportSystem()) {
  // 使用新系统
  const persistence = new ReportPersistenceV2();
  // ...
} else {
  // 使用旧系统
  const persistence = new ReportPersistence();
  // ...
}
```

---

## Inngest 后台任务

### 触发 Embeddings 生成

```typescript
import { inngest } from '@/lib/inngest/client';

// 报告生成完成后,触发 embeddings
await inngest.send({
  name: 'report/generated',
  data: {
    reportRunId: 'uuid-here',
    content: 'report content...',
    language: 'zh-Hans',
    tone: 'baseline',
  },
});
```

### 监控任务状态

访问 Inngest Dashboard: https://app.inngest.com

可以查看:
- 任务执行历史
- 失败任务和错误详情
- 重试状态
- 性能指标

---

## 监控和追踪

### 追踪报告生成

```typescript
import { trackReportGeneration, trackReportError } from '@/lib/monitoring/metrics';

// 成功
trackReportGeneration({
  symbol: 'AAPL',
  language: 'zh-Hans',
  tone: 'baseline',
  duration: 23500,
  success: true,
  userId: 'user-123',
  useNewSystem: true,
});

// 失败
trackReportError({
  symbol: 'AAPL',
  language: 'zh-Hans',
  tone: 'baseline',
  duration: 5000,
  userId: 'user-123',
  error: 'API rate limit exceeded',
  useNewSystem: true,
});
```

### 实时监控

```bash
# 运行监控脚本
./scripts/monitor-metrics.sh
```

---

## 灰度发布

### 发布流程

参考 `docs/GRADUAL_ROLLOUT_GUIDE.md`,核心步骤:

1. **第1天**: 部署新代码 (Feature Flag OFF)
2. **第2天**: 启用 10% 灰度
3. **第3-7天**: 监控观察
4. **第8天**: 决策 (全量或回滚)

### 快速回滚

```bash
# 关闭新系统
./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM false

# 等待部署完成 (~2分钟)
```

---

## 常见问题

### Q: 新旧系统可以同时运行吗?

A: 可以!这就是 Feature Flag 的作用。默认情况下使用旧系统,通过环境变量切换到新系统。

### Q: 如何测试新系统?

A:
```bash
# 开发环境
export NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM=true
npm run dev

# 或者直接修改 .env.local
```

### Q: Inngest 任务失败了怎么办?

A: Inngest 会自动重试3次。如果仍然失败:
1. 查看 Inngest Dashboard 的错误详情
2. 修复问题后,手动重试任务
3. 或者在下次报告生成时会重新触发

### Q: 如何验证 Migration 是否成功?

A:
```sql
-- 检查字段是否存在
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'report_posts'
  AND column_name IN ('report_run_id', 'user_id', 'tone');

-- 检查索引
SELECT indexname
FROM pg_indexes
WHERE tablename = 'report_posts';
```

---

## 开发指南

### 添加新的 Inngest 函数

1. 在 `lib/inngest/functions/` 创建新文件:

```typescript
import { inngest } from '../client';

export const myNewFunction = inngest.createFunction(
  {
    id: 'my-new-function',
    name: 'My New Function',
    retries: 3,
  },
  { event: 'my/event' },
  async ({ event, step }) => {
    // 实现逻辑
  }
);
```

2. 在 `app/api/inngest/route.ts` 注册:

```typescript
import { myNewFunction } from '@/lib/inngest/functions/my-new-function';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateEmbeddings,
    myNewFunction,  // 添加这里
  ],
});
```

### 添加新的监控指标

在 `lib/monitoring/metrics.ts` 添加:

```typescript
export function trackCustomMetric(data: CustomMetricData) {
  track('custom.metric', data);
}
```

---

## 性能优化建议

### 1. 使用缓存

报告和市场数据已经自动缓存,无需额外处理。

### 2. 批量处理 Embeddings

如果需要生成大量报告,可以批量触发:

```typescript
await inngest.send([
  { name: 'report/generated', data: report1 },
  { name: 'report/generated', data: report2 },
  { name: 'report/generated', data: report3 },
]);
```

### 3. 监控 Inngest 免费额度

- 限制: 10万次/月
- 查看用量: Inngest Dashboard > Usage

---

## 故障排查

### 类型错误

```bash
# 重新生成类型
npm run db:types

# 重启 TypeScript 服务器 (VSCode)
Cmd/Ctrl + Shift + P > TypeScript: Restart TS Server
```

### Inngest 连接失败

检查环境变量:
```bash
echo $INNGEST_EVENT_KEY
echo $INNGEST_SIGNING_KEY
```

### 数据库连接问题

```bash
# 检查 Supabase 状态
supabase status

# 重启本地 Supabase
supabase stop
supabase start
```

---

## 下一步

1. **阅读完整方案**: `docs/reports/2025-12-02-report-generation-refactor-proposal-v2.md`
2. **灰度发布指南**: `docs/GRADUAL_ROLLOUT_GUIDE.md`
3. **重构总结**: `docs/REFACTOR_SUMMARY.md`

---

**维护者**: Development Team
**最后更新**: 2025-12-03
**版本**: v2.0
