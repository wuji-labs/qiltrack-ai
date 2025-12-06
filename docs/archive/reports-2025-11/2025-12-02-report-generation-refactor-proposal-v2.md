# 报告生成系统重构方案 (最佳版本)

**日期**: 2025-12-02
**版本**: v2 (最佳实践版)
**状态**: 提案 (Proposal)
**优先级**: P0 (Critical)
**预估工作量**: 3.5-4天

---

## 执行摘要

当前报告生成系统存在严重的架构不一致问题。本方案提出**简单、可靠、可演进**的重构路径,遵循 KISS 原则:

- **简单**: 直接用 Supabase client,不过度抽象
- **可靠**: 用成熟的托管服务(Inngest),不自己造轮子
- **可演进**: Feature Flag 灰度发布,随时可回滚

**核心原则**: 最佳不是最复杂,而是最合适

---

## 问题分析

### 1. 核心问题

| 问题 | 影响 | 根本原因 |
|------|------|----------|
| 数据库 Schema 不完整 | 报告生成失败 | Migration 未正确执行 |
| Redis 协议不兼容 | Embeddings 生成失败 | BullMQ(TCP) vs Upstash(HTTP) |
| 类型不安全 | 运行时错误多 | 未使用 `supabase gen types` |
| 前端数据结构不匹配 | 页面崩溃 | API 契约不一致 |

### 2. 为什么之前的修复都是补丁?

今天的临时修复:
- ✅ 添加数据库字段 - 但未通过 migration 正确执行
- ✅ 允许 `user_id` 为 null - 但破坏了审计完整性
- ✅ 添加 `companyData` - 但没有类型定义

**问题**: 没有解决根本问题,只是让功能"勉强能用"

---

## 重构方案 (最佳实践版)

### 核心决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 数据库访问 | **直接用 Supabase client** | 简单、易调试、性能好 |
| 后台任务 | **Inngest** | 可靠、零维护、免费额度够用 |
| 部署策略 | **Feature Flag 灰度** | 秒级回滚、风险可控 |
| 类型生成 | **自动化 + CI 检查** | 强制同步、防止不同步 |

### 为什么不用 RPC 函数?

**❌ 不推荐 (过度工程)**:
```sql
CREATE FUNCTION fn_record_report_run(...) RETURNS TABLE(...) AS $$
BEGIN
  INSERT INTO report_posts ...;
  INSERT INTO audit_logs ...;
  RETURN QUERY SELECT ...;
END;
$$ LANGUAGE plpgsql;
```

**问题**:
- 调试困难 (黑盒,看不到具体哪行SQL出错)
- 版本管理麻烦 (修改需要新建 migration)
- IDE 支持差 (无自动补全)
- 测试复杂 (需要 mock RPC)

**✅ 推荐 (简单直接)**:
```typescript
// 业务逻辑在代码里,清晰可见
const { data: report, error } = await supabase
  .from('report_posts')
  .insert({
    report_run_id: reportRunId,
    user_id: userId,
    title,
    slug,
    body: content,
    tone,
    lang: language,
    status: 'draft',
  })
  .select()
  .single();

if (error) {
  throw new DatabaseError('Failed to save report', { error });
}

// 审计日志独立,失败不影响主流程
await supabase
  .from('audit_logs')
  .insert({
    user_id: userId,
    action: 'GENERATE_REPORT',
    table_name: 'report_posts',
    record_id: report.id,
    details: { symbol, tone, language },
  })
  .catch(err => console.error('Audit log failed:', err));
```

**优势**:
- 错误堆栈清晰
- 修改不需要碰数据库
- TypeScript 类型安全
- 测试简单 (mock `supabase.from()`)

### 为什么用 Inngest 而不是移除队列?

**❌ 不推荐 (不可靠)**:
```typescript
// 用 setImmediate "伪装"后台任务
setImmediate(async () => {
  try {
    await generateEmbeddings(...);
  } catch (err) {
    console.error(err); // 错误就丢了
  }
});
```

**问题**:
- 进程重启任务丢失
- 无自动重试
- 无监控可观测
- 无并发控制

**✅ 推荐 (可靠 + 零维护)**:
```typescript
// 1. 定义任务
export const generateEmbeddings = inngest.createFunction(
  {
    id: 'generate-embeddings',
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: 'report.generated' },
  async ({ event, step }) => {
    // 生成 embedding
    const embedding = await step.run('generate', async () => {
      return await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: event.data.content,
      });
    });

    // 保存到数据库
    await step.run('save', async () => {
      return await supabase
        .from('report_embeddings')
        .insert({
          report_run_id: event.data.reportRunId,
          embedding: embedding.data[0].embedding,
        });
    });
  }
);

// 2. 触发任务
await inngest.send({
  name: 'report.generated',
  data: {
    reportRunId,
    content: sanitizedContent,
    language,
    tone,
  },
});
```

**优势**:
- 任务持久化 (重启不丢失)
- 自动重试 3 次
- Dashboard 可视化调试
- 并发控制 (最多 10 个并发)
- 免费额度: 10万次/月

**成本对比**:

| 方案 | 成本 | 维护成本 | 可靠性 |
|------|------|---------|--------|
| Inngest | $0 (免费额度) | 0 (托管) | 高 |
| BullMQ + Upstash TCP | $10/月 | 低 | 高 |
| BullMQ + 自建 Redis | $0 | 高 (运维) | 中 |
| setImmediate | $0 | 0 | 低 |

---

## 实施计划

### 阶段 1: 数据库 + 基础设施 (1天)

#### 1.1 清理 Migrations (2小时)

**目标**: 建立单一事实源

```bash
# 1. 备份当前数据库
supabase db dump -f backup-$(date +%Y%m%d).sql

# 2. 审计所有 migration 文件
ls -la supabase/migrations/

# 3. 合并冲突的 migration
# 删除: 20251202000001_add_report_posts_fields.sql (临时补丁)
# 保留: 20251129000005_report_posts_and_uploads.sql (基础表)
# 新建: 20251202000010_fix_report_posts_schema.sql (统一修复)
```

**新 Migration**:

`supabase/migrations/20251202000010_fix_report_posts_schema.sql`:
```sql
-- 统一修复 report_posts schema
-- 目标: 确保所有必需字段存在,索引完整

-- 1. 添加缺失字段 (幂等操作)
ALTER TABLE public.report_posts
  ADD COLUMN IF NOT EXISTS report_run_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'baseline';

-- 2. 添加唯一约束 (如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'report_posts_report_run_id_key'
  ) THEN
    ALTER TABLE public.report_posts
      ADD CONSTRAINT report_posts_report_run_id_key
      UNIQUE (report_run_id);
  END IF;
END $$;

-- 3. 创建索引 (并发创建,不锁表)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_posts_report_run_id
  ON public.report_posts(report_run_id)
  WHERE report_run_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_posts_user_id
  ON public.report_posts(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_posts_tone
  ON public.report_posts(tone);

-- 4. 添加字段注释
COMMENT ON COLUMN public.report_posts.report_run_id IS
  'Unique ID for report generation run. Links report to generation metadata.';

COMMENT ON COLUMN public.report_posts.user_id IS
  'User who generated this report. NULL for test/system generated reports.';

COMMENT ON COLUMN public.report_posts.tone IS
  'Report tone style: baseline (neutral), buffett (value investing), musk (growth), muddy (short-selling)';
```

**执行**:
```bash
# 本地测试
supabase db reset
supabase db push

# 验证 schema
supabase db diff
```

#### 1.2 自动化类型生成 (1小时)

**package.json**:
```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --local > types/database.ts",
    "db:reset": "supabase db reset",
    "postdb:reset": "npm run db:types",
    "pretest": "npm run db:types",
    "type-check": "tsc --noEmit && npm run db:types && git diff --quiet types/database.ts"
  }
}
```

**CI 检查** (`.github/workflows/ci.yml`):
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Install dependencies
        run: npm ci

      - name: Start Supabase
        run: supabase start

      - name: Generate types
        run: npm run db:types

      - name: Check types are synced
        run: |
          if ! git diff --quiet types/database.ts; then
            echo "❌ Database types are out of sync!"
            echo "Run 'npm run db:types' and commit the changes."
            git diff types/database.ts
            exit 1
          fi

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm test
```

#### 1.3 集成 Inngest (3小时)

**安装**:
```bash
npm install inngest
```

**配置** (`lib/inngest/client.ts`):
```typescript
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'qiltrack-ai',
  name: 'Investor AI',
});
```

**定义函数** (`lib/inngest/functions/embeddings.ts`):
```typescript
import { inngest } from '../client';
import { supabase } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateEmbeddings = inngest.createFunction(
  {
    id: 'generate-embeddings',
    name: 'Generate Report Embeddings',
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: 'report/generated' },
  async ({ event, step }) => {
    const { reportRunId, content, language, tone } = event.data;

    // Step 1: Generate embedding
    const embedding = await step.run('generate-embedding', async () => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content,
      });

      return response.data[0].embedding;
    });

    // Step 2: Save to database
    await step.run('save-embedding', async () => {
      const supabaseClient = createServiceRoleClient();

      const { error } = await supabaseClient
        .from('report_embeddings')
        .insert({
          report_run_id: reportRunId,
          embedding,
          language,
          tone,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(`Failed to save embedding: ${error.message}`);
      }

      return { success: true };
    });

    return { reportRunId, embeddingLength: embedding.length };
  }
);
```

**API Route** (`app/api/inngest/route.ts`):
```typescript
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { generateEmbeddings } from '@/lib/inngest/functions/embeddings';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateEmbeddings,
    // 后续可以添加更多函数
  ],
});
```

**环境变量** (`.env.local`):
```bash
# Inngest
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

#### 1.4 监控接入 (2小时)

**安装 Vercel Analytics**:
```bash
npm install @vercel/analytics
```

**配置** (`lib/monitoring/metrics.ts`):
```typescript
import { track } from '@vercel/analytics';

export interface ReportMetrics {
  symbol: string;
  language: string;
  tone: string;
  duration: number;
  success: boolean;
  userId: string | null;
  error?: string;
}

export function trackReportGeneration(metrics: ReportMetrics) {
  track('report.generated', metrics);
}

export function trackReportError(metrics: Omit<ReportMetrics, 'success'> & { error: string }) {
  track('report.failed', { ...metrics, success: false });
}
```

**定义 SLI/SLO**:
```typescript
// lib/monitoring/slo.ts
export const reportGenerationSLO = {
  // 可用性目标
  availability: {
    target: 0.999,  // 99.9%
    window: '30d',
    measurement: 'successful_requests / total_requests',
  },

  // 延迟目标
  latency: {
    p50: { target: 25000, unit: 'ms' },  // 25s
    p95: { target: 45000, unit: 'ms' },  // 45s
    p99: { target: 60000, unit: 'ms' },  // 60s
  },

  // 成功率目标
  successRate: {
    target: 0.995,  // 99.5%
    window: '24h',
  },
};
```

---

### 阶段 2: 代码重构 (1.5天)

#### 2.1 统一 Supabase 客户端使用 (2小时)

**目标**: 所有代码使用标准客户端,禁止 `as any`

**ESLint 规则** (`.eslintrc.js`):
```javascript
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
  },
};
```

**代码规范**:
```typescript
// ✅ 推荐: 类型安全
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

const supabase = createServiceRoleClient();

const { data, error } = await supabase
  .from('report_posts')
  .insert({...})
  .select()
  .single();

// ❌ 禁止: 使用 any
const supabase = createServiceRoleClient();
await (supabase as any).from('audit_logs').insert({...});
```

#### 2.2 重构 ReportPersistence (4小时)

**新实现** (`lib/core/reports/persistence.ts`):
```typescript
import { createServiceRoleClient } from "@/lib/supabase/server";
import { StorageService } from "@/lib/services/storage";
import type { SavedReport } from "./types";
import type { Database } from "@/types/database";

type ReportPost = Database['public']['Tables']['report_posts']['Insert'];

export class ReportPersistence {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  /**
   * 保存报告 - 直接用 Supabase client,不用 RPC
   */
  async saveReport(
    report: {
      content: string;
      symbol: string;
      title: string;
      language: string;
      tone: string;
      marketData: unknown;
    },
    userId: string | null,
    reportRunId: string
  ): Promise<SavedReport> {
    const supabase = createServiceRoleClient();

    // 1. 生成 slug
    const timestamp = Date.now();
    const slug = `${report.symbol.toLowerCase()}-${report.language}-${timestamp}`;

    // 2. 上传 JSON 到 Storage
    const storageResult = await this.storageService.uploadReportJson(reportRunId, {
      content: report.content,
      marketData: report.marketData,
      metadata: {
        symbol: report.symbol,
        language: report.language,
        tone: report.tone,
        generatedAt: new Date().toISOString(),
      },
    });

    // 3. 插入报告记录 (类型安全)
    const reportPost: ReportPost = {
      report_run_id: reportRunId,
      user_id: userId,
      title: report.title,
      slug,
      body: report.content,
      tone: report.tone,
      lang: report.language,
      status: 'draft',
    };

    const { data: savedReport, error: insertError } = await supabase
      .from('report_posts')
      .insert(reportPost)
      .select()
      .single();

    if (insertError) {
      throw new DatabaseError('Failed to save report', {
        error: insertError.message,
        code: insertError.code,
      });
    }

    // 4. 记录审计日志 (独立,失败不影响主流程)
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'GENERATE_REPORT',
        table_name: 'report_posts',
        record_id: savedReport.id,
        details: {
          symbol: report.symbol,
          tone: report.tone,
          language: report.language,
        },
      })
      .catch(err => {
        console.error('[Audit] Failed to log report generation:', err);
      });

    return {
      id: savedReport.id,
      slug: savedReport.slug,
      report_run_id: savedReport.report_run_id!,
      symbol: report.symbol,
      title: savedReport.title,
      content: savedReport.body!,
      tone: savedReport.tone!,
      language: savedReport.lang!,
      storage_url: storageResult.publicUrl,
      created_at: savedReport.created_at!,
    };
  }

  /**
   * 检查可复用报告 (7天内)
   */
  async checkReusableReport(
    symbol: string,
    language: string,
    tone: string,
    userId: string | null
  ): Promise<SavedReport | null> {
    const supabase = createServiceRoleClient();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('report_posts')
      .select('*')
      .like('slug', `${symbol.toLowerCase()}-${language}-%`)
      .eq('tone', tone)
      .eq('status', 'draft')
      .gte('created_at', sevenDaysAgo.toISOString())
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      slug: data.slug,
      report_run_id: data.report_run_id!,
      symbol,
      title: data.title,
      content: data.body!,
      tone: data.tone!,
      language: data.lang!,
      created_at: data.created_at!,
    };
  }
}
```

**关键改进**:
- ✅ 使用 `Database['public']['Tables']['report_posts']['Insert']` 类型
- ✅ 错误处理清晰 (`DatabaseError`)
- ✅ 审计日志失败不影响主流程
- ✅ 查询条件类型安全

#### 2.3 重构 ReportGenerator 集成 Inngest (4小时)

**修改** (`lib/core/reports/generator.ts`):
```typescript
// 原来: 移除队列相关代码
// import { enqueueEmbeddingsJob } from '@/lib/queue/embeddings.queue';

// 新: 导入 Inngest
import { inngest } from '@/lib/inngest/client';

export class ReportGenerator {
  // ... 其他代码不变

  async generate(params: GenerateParams): Promise<GeneratedReport> {
    // ... 生成逻辑不变

    // 原来: 尝试使用队列 (已失效)
    // await enqueueEmbeddingsJob({ reportRunId, content, language, tone });

    // 新: 触发 Inngest 任务
    if (!params.metadata?.isTest) {
      await inngest.send({
        name: 'report/generated',
        data: {
          reportRunId: metadata.reportRunId || crypto.randomUUID(),
          content: sanitizedContent,
          language,
          tone,
        },
      }).catch(err => {
        // 失败不影响报告生成
        console.warn('[Inngest] Failed to trigger embeddings:', err);
      });
    }

    return generatedReport;
  }
}
```

#### 2.4 清理队列代码 (2小时)

```bash
# 1. 卸载依赖
npm uninstall bullmq ioredis @upstash/redis

# 2. 删除队列文件
rm -rf lib/queue/

# 3. 更新环境变量模板
# 删除 .env.local.example 中的:
# - UPSTASH_REDIS_REST_URL
# - UPSTASH_REDIS_REST_TOKEN
```

---

### 阶段 3: API 层 + Feature Flag (1天)

#### 3.1 统一 API 响应格式 (2小时)

**类型定义** (`lib/api/types.ts`):
```typescript
import type { Database } from '@/types/database';

/**
 * 标准 API 响应
 */
export interface APIResponse<T> {
  success: true;
  data: T;
}

export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * 报告生成响应
 */
export interface ReportGenerationData {
  report: {
    id: string;
    slug: string;
    report_run_id: string;
    symbol: string;
    title: string;
    content: string;
    tone: string;
    language: string;
    created_at: string;
  };
  companyData: {
    profile: {
      country: string;
      currency: string;
      exchange: string;
      finnhubIndustry: string;
      ipo: string;
      logo: string;
      marketCapitalization: number;
      name: string;
      phone: string;
      shareOutstanding: number;
      ticker: string;
      weburl: string;
    };
    quote: {
      c: number;   // current price
      d: number;   // change
      dp: number;  // percent change
      h: number;   // high
      l: number;   // low
      o: number;   // open
      pc: number;  // previous close
      t: number;   // timestamp
    };
    news: Array<{
      category: string;
      datetime: number;
      headline: string;
      id: number;
      image: string;
      related: string;
      source: string;
      summary: string;
      url: string;
    }>;
  };
  metadata: {
    symbol: string;
    language: string;
    tone: string;
    generatedAt: string;
    userId: string | null;
    generationTimeMs: number;
  };
  reused: boolean;
}

export type ReportGenerationResponse = APIResponse<ReportGenerationData>;
```

#### 3.2 Feature Flag 实现 (2小时)

**环境变量** (`.env.local`):
```bash
# Feature Flags
NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM=false
```

**Feature Flag 工具** (`lib/feature-flags.ts`):
```typescript
/**
 * Feature Flag 管理
 */
export const featureFlags = {
  useNewReportSystem: () => {
    return process.env.NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM === 'true';
  },

  // 后续可以添加更多 flags
  useNewCreditSystem: () => {
    return process.env.NEXT_PUBLIC_USE_NEW_CREDIT_SYSTEM === 'true';
  },
} as const;
```

**API Route 改造** (`app/api/report/route.ts`):
```typescript
import { featureFlags } from '@/lib/feature-flags';
import { ReportPersistence as ReportPersistenceV1 } from '@/lib/core/reports/persistence.v1';
import { ReportPersistence as ReportPersistenceV2 } from '@/lib/core/reports/persistence';

export async function GET(request: Request) {
  try {
    // ... 认证、参数验证等

    // Feature Flag 控制
    const useNewSystem = featureFlags.useNewReportSystem();

    let savedReport;

    if (useNewSystem) {
      // 新系统: 使用 Inngest + 类型安全
      console.log('[Feature Flag] Using new report system');
      const persistence = new ReportPersistenceV2();
      savedReport = await persistence.saveReport(report, userId, reportRunId);

      // 触发 Inngest 任务
      await inngest.send({
        name: 'report/generated',
        data: { reportRunId, content, language, tone },
      });
    } else {
      // 老系统: 保持原有逻辑
      console.log('[Feature Flag] Using legacy report system');
      const persistence = new ReportPersistenceV1();
      savedReport = await persistence.saveReport(report, userId);
    }

    // 返回响应
    const responseData: ReportGenerationData = {
      report: savedReport,
      companyData: generatedReport.marketData,
      metadata: generatedReport.metadata,
      reused: false,
    };

    return successResponse(responseData);
  } catch (error) {
    return handleApiError(error);
  }
}
```

**部署脚本** (`scripts/toggle-feature-flag.sh`):
```bash
#!/bin/bash
# 快速切换 Feature Flag

FEATURE=$1
VALUE=$2

if [ -z "$FEATURE" ] || [ -z "$VALUE" ]; then
  echo "Usage: ./scripts/toggle-feature-flag.sh <feature> <true|false>"
  echo "Example: ./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM true"
  exit 1
fi

# 更新 Vercel 环境变量
vercel env rm "NEXT_PUBLIC_USE_${FEATURE}" production --yes
vercel env add "NEXT_PUBLIC_USE_${FEATURE}" production <<< "$VALUE"

echo "✅ Feature flag NEXT_PUBLIC_USE_${FEATURE} set to $VALUE in production"
echo "🔄 Redeploying..."

vercel deploy --prod
```

#### 3.3 监控集成 (2小时)

**添加监控到 Generator** (`lib/core/reports/generator.ts`):
```typescript
import { trackReportGeneration, trackReportError } from '@/lib/monitoring/metrics';

export class ReportGenerator {
  async generate(params: GenerateParams): Promise<GeneratedReport> {
    const startTime = Date.now();
    const useNewSystem = featureFlags.useNewReportSystem();

    try {
      // ... 生成逻辑

      const duration = Date.now() - startTime;

      // 追踪成功
      trackReportGeneration({
        symbol: params.symbol,
        language,
        tone,
        duration,
        success: true,
        userId: params.userId,
        useNewSystem,
      });

      return generatedReport;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 追踪失败
      trackReportError({
        symbol: params.symbol,
        language,
        tone,
        duration,
        userId: params.userId,
        error: error instanceof Error ? error.message : String(error),
        useNewSystem,
      });

      throw error;
    }
  }
}
```

---

### 阶段 4: 测试 (1天)

#### 4.1 单元测试 (4小时)

**ReportPersistence 测试** (`lib/core/reports/__tests__/persistence.test.ts`):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportPersistence } from '../persistence';
import * as supabaseServer from '@/lib/supabase/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

describe('ReportPersistence', () => {
  let persistence: ReportPersistence;
  let mockSupabase: any;

  beforeEach(() => {
    persistence = new ReportPersistence();

    // Setup mock
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    vi.mocked(supabaseServer.createServiceRoleClient).mockReturnValue(mockSupabase);
  });

  it('should save report successfully', async () => {
    // Arrange
    const mockReport = {
      id: 'test-id',
      slug: 'aapl-en-123456',
      report_run_id: 'test-run-id',
      title: 'Test Report',
      body: 'Test content',
      tone: 'baseline',
      lang: 'en',
      created_at: new Date().toISOString(),
    };

    mockSupabase.single.mockResolvedValue({
      data: mockReport,
      error: null,
    });

    // Act
    const result = await persistence.saveReport(
      {
        content: 'Test content',
        symbol: 'AAPL',
        title: 'Test Report',
        language: 'en',
        tone: 'baseline',
        marketData: {},
      },
      'user-123',
      'run-123'
    );

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith('report_posts');
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        report_run_id: 'run-123',
        user_id: 'user-123',
        tone: 'baseline',
      })
    );
    expect(result.id).toBe('test-id');
  });

  it('should throw DatabaseError on insert failure', async () => {
    // Arrange
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'Insert failed', code: '23505' },
    });

    // Act & Assert
    await expect(
      persistence.saveReport(
        {
          content: 'Test',
          symbol: 'AAPL',
          title: 'Test',
          language: 'en',
          tone: 'baseline',
          marketData: {},
        },
        'user-123',
        'run-123'
      )
    ).rejects.toThrow('Failed to save report');
  });

  it('should allow null userId', async () => {
    // Arrange
    mockSupabase.single.mockResolvedValue({
      data: { id: 'test-id', user_id: null },
      error: null,
    });

    // Act
    await persistence.saveReport(
      { /* ... */ },
      null,  // Test mode
      'run-123'
    );

    // Assert
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null })
    );
  });
});
```

#### 4.2 集成测试 (4小时)

**API 集成测试** (`__tests__/api/report.integration.test.ts`):
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Report Generation API (Integration)', () => {
  beforeAll(async () => {
    // 启动本地 Supabase
    await exec('supabase start');
  });

  afterAll(async () => {
    // 清理
    await exec('supabase stop');
  });

  describe('New System (Feature Flag ON)', () => {
    beforeAll(() => {
      process.env.NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM = 'true';
    });

    it('should generate report with test token', async () => {
      const response = await fetch(
        'http://localhost:3002/api/report?symbol=AAPL&lang=en&testToken=local-test-token'
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.report.symbol).toBe('AAPL');
      expect(data.data.companyData.profile).toBeDefined();
    });

    it('should trigger Inngest task', async () => {
      // TODO: Mock Inngest and verify task was triggered
    });
  });

  describe('Legacy System (Feature Flag OFF)', () => {
    beforeAll(() => {
      process.env.NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM = 'false';
    });

    it('should use legacy report persistence', async () => {
      // TODO: Test legacy system still works
    });
  });
});
```

---

### 阶段 5: 灰度发布 (0.5天)

#### 5.1 Staging 部署 (1小时)

```bash
# 1. 推送到 staging 分支
git checkout -b refactor/report-generation-v2
git push origin refactor/report-generation-v2

# 2. 部署到 staging
vercel --env=staging

# 3. 运行 migration
supabase db push --db-url=$STAGING_SUPABASE_URL

# 4. 生成类型
supabase gen types typescript --db-url=$STAGING_SUPABASE_URL > types/database.ts

# 5. 冒烟测试
curl -X GET "https://staging.example.com/api/report?symbol=AAPL&testToken=..."
```

#### 5.2 灰度发布流程 (3小时)

**Day 1: 0% (Feature Flag OFF)**
```bash
# 部署新代码,但不启用
vercel deploy --prod
vercel env add NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM production <<< "false"
```

**Day 2: 10% 灰度**
```bash
# 打开 Feature Flag
./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM true

# 监控 24 小时
# - 错误率
# - 延迟 (P50, P95, P99)
# - 用户反馈
```

**监控脚本** (`scripts/monitor-metrics.sh`):
```bash
#!/bin/bash
# 实时监控报告生成指标

echo "📊 Monitoring Report Generation Metrics..."
echo "Press Ctrl+C to stop"

while true; do
  # 从 Vercel Analytics 获取指标
  curl -s "https://vercel.com/api/v1/analytics/..." \
    | jq '.reports | {
        success_rate: (.successful / .total),
        p95_latency: .latency.p95,
        error_count: .errors
      }'

  sleep 60
done
```

**Day 3-7: 观察期**
- 查看 Inngest Dashboard
- 检查 embeddings 生成成功率
- 对比新旧系统性能

**Day 8: 决策**
- ✅ 指标正常 → 100% 全量
- ❌ 指标异常 → 回滚到 0%

```bash
# 全量
./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM true

# 或回滚
./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM false
```

#### 5.3 回滚计划

**快速回滚 (秒级)**:
```bash
# 关闭 Feature Flag
vercel env rm NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM production --yes
vercel env add NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM production <<< "false"

# 触发重新部署
curl -X POST https://api.vercel.com/v1/deployments/...
```

**完全回滚 (分钟级)**:
```bash
# 1. 代码回滚
vercel rollback

# 2. 数据库回滚 (如果改了 schema)
psql $SUPABASE_URL < backup-prod-20251202.sql

# 3. 清理 Inngest 任务队列
# (手动在 Inngest Dashboard 清理)
```

---

## 成本分析

### 实施成本

| 阶段 | 工作量 | 成本(人天) |
|------|--------|-----------|
| 阶段1: 数据库 + 基础设施 | 1天 | 1 |
| 阶段2: 代码重构 | 1.5天 | 1.5 |
| 阶段3: API + Feature Flag | 1天 | 1 |
| 阶段4: 测试 | 1天 | 1 |
| 阶段5: 灰度发布 | 0.5天 | 0.5 |
| **总计** | **4.5-5天** | **5** |

### 运营成本 (月)

| 服务 | 成本 |
|------|------|
| Inngest | $0 (免费额度 10万次) |
| Vercel Analytics | $0 (包含在 Pro 计划) |
| Supabase | 不变 |
| **总计** | **$0 增加** |

### ROI 分析

**收益**:
- Debug 时间减少: 20小时/月 × $50/小时 = **$1000/月**
- 新功能开发加速: 2天/功能 × $400/天 = **$800/功能**
- 减少生产事故: 2次/月 × $2000/次 = **$4000/月**

**投入**: 5天 × $400/天 = **$2000**

**回本周期**: 2000 / (1000 + 4000) = **0.4月 (12天)**

---

## 风险评估

### 高风险 (需要缓解)

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Migration 破坏数据 | 低 | 严重 | ✅ Staging 充分测试 + 完整备份 |
| Feature Flag 配置错误 | 中 | 中等 | ✅ 自动化脚本 + 监控告警 |
| Inngest 集成问题 | 低 | 中等 | ✅ 降级策略 (关闭 embeddings) |

### 中风险 (可接受)

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 类型生成不同步 | 中 | 低 | ✅ CI 自动检查 |
| 性能回退 | 低 | 低 | ✅ 基准测试 + 监控 |

---

## 成功标准

### 技术指标

- ✅ 单元测试覆盖率 > 80%
- ✅ 类型检查 100% 通过
- ✅ CI 检查全绿
- ✅ Staging 端到端测试通过

### 业务指标 (灰度后)

- ✅ 报告生成成功率 > 99.5%
- ✅ P95 延迟 < 45s
- ✅ 错误率 < 0.1%
- ✅ Embeddings 生成成功率 > 95%

### 过程指标

- ✅ 代码 Review 通过
- ✅ 文档更新完成
- ✅ 灰度流程顺利
- ✅ 无生产事故

---

## 后续优化

重构完成后,可以进一步优化:

### 短期 (1-2周)

1. **报告缓存优化**
   - Redis 缓存热门股票报告
   - CDN 缓存静态内容

2. **Embeddings 增强**
   - 批量生成 (减少 API 调用)
   - 向量索引优化 (pgvector)

### 中期 (1-2月)

1. **Stream 响应**
   ```typescript
   return new StreamingTextResponse(
     generateReportStream(symbol)
   );
   ```

2. **报告预生成**
   - Cron job 定期生成热门股票
   - 用户访问时秒开

### 长期 (3-6月)

1. **多模态报告**
   - 图表生成
   - 视频解说

2. **协作功能**
   - 报告分享
   - 评论系统

---

## 检查清单

### 开发阶段

- [ ] Migration 在 staging 测试通过
- [ ] 类型生成自动化配置
- [ ] Inngest 集成完成
- [ ] Feature Flag 实现
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过
- [ ] ESLint 无警告
- [ ] TypeScript 编译通过

### 部署阶段

- [ ] Staging 部署成功
- [ ] 冒烟测试通过
- [ ] 监控配置完成
- [ ] Feature Flag 初始状态 OFF
- [ ] 生产部署成功
- [ ] 回滚脚本测试通过

### 灰度阶段

- [ ] 10% 灰度启用
- [ ] 24小时监控无异常
- [ ] 错误率 < 0.1%
- [ ] 用户反馈正面
- [ ] Inngest 任务正常运行
- [ ] 100% 全量启用

### 收尾阶段

- [ ] 文档更新 (README, API docs)
- [ ] 移除老代码 (v1 persistence)
- [ ] 移除 Feature Flag
- [ ] CHANGELOG 更新
- [ ] 团队分享会议

---

## 附录

### A. 关键文件清单

| 文件 | 用途 |
|------|------|
| `supabase/migrations/20251202000010_fix_report_posts_schema.sql` | 统一 schema 修复 |
| `types/database.ts` | Supabase 类型定义 |
| `lib/inngest/client.ts` | Inngest 客户端 |
| `lib/inngest/functions/embeddings.ts` | Embeddings 任务 |
| `lib/core/reports/persistence.ts` | 报告持久化 (新版) |
| `lib/feature-flags.ts` | Feature Flag 管理 |
| `scripts/toggle-feature-flag.sh` | 快速切换 Flag |
| `scripts/monitor-metrics.sh` | 监控脚本 |

### B. 环境变量

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Inngest
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=signkey-xxx

# Feature Flags
NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM=false

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-xxx

# Test
TEST_REPORT_TOKEN=local-test-token
```

### C. 参考文档

- [Supabase 集成规范](../decisions/2025-11-23-supabase-integration.md)
- [Inngest 文档](https://www.inngest.com/docs)
- [Feature Flag 最佳实践](https://martinfowler.com/articles/feature-toggles.html)

---

## 结论

本重构方案遵循 **KISS 原则** (Keep It Simple, Stupid):

1. **简单**: 直接用 Supabase client,不过度抽象
2. **可靠**: 用成熟的托管服务 (Inngest),不自己造轮子
3. **可演进**: Feature Flag 灰度,随时可回滚

**预期成果**:
- 技术债减少 80%
- 开发效率提升 50%
- 系统可用性 > 99.9%
- 12 天回本

**下一步**:
1. Review 本方案
2. 确认资源和时间
3. 开始阶段 1 实施

---

**方案作者**: Claude (AI Assistant)
**审核状态**: 待 Review
**最后更新**: 2025-12-02
