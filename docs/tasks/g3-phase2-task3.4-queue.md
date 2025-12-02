# G3 Phase 2 - Task 3.4: 异步嵌入生成队列化

## 目标

将当前**伪异步**的嵌入生成改造为真正的**后台队列处理**，提升系统可靠性与可扩展性。

## 当前问题分析

### 现状 (lib/core/reports/embeddings.ts:24-64)

```typescript
async generateEmbeddings(...): Promise<void> {
  try {
    const chunks = this.chunkReport(report);
    const rows = [];

    // 同步串行处理所有chunks
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await this.llmService.generateEmbedding(chunk);
      rows.push({...});
    }

    await serviceClient.from("reports_embeddings").upsert(rows);
  } catch (err) {
    console.warn("Embedding generation failed:", err);
  }
}
```

### 问题

1. **伪异步**: 虽然不阻塞API响应，但仍在请求上下文执行
2. **无重试机制**: 失败只打印warn，数据丢失
3. **无可观测性**: 无法监控队列状态、失败率
4. **资源浪费**: 长时间占用Serverless函数实例
5. **串行处理**: 多个chunk顺序处理，效率低

## 解决方案：BullMQ + Upstash Redis

### 架构设计

```
┌─────────────────────────────────────────────────────┐
│ app/api/report/route.ts (报告生成)                  │
│ ├─ 生成报告                                         │
│ ├─ 保存到数据库                                     │
│ └─ 入队嵌入任务 → generateEmbeddingsQueue.add()    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Upstash Redis (任务队列)                            │
│ ├─ embeddings:waiting [reportId1, reportId2, ...]  │
│ ├─ embeddings:active  [reportId3]                  │
│ └─ embeddings:failed  [reportId4]                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ lib/queue/workers/embeddings-worker.ts              │
│ ├─ 监听队列                                         │
│ ├─ 处理任务 (调用 EmbeddingsManager)               │
│ ├─ 重试失败任务 (最多3次)                          │
│ └─ 记录日志到 Langfuse                             │
└─────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. 队列配置 (lib/queue/config.ts)

```typescript
import { Queue, Worker, QueueOptions } from 'bullmq';
import { Redis } from '@upstash/redis';

// Upstash Redis连接配置
const connection = {
  host: process.env.UPSTASH_REDIS_REST_URL!.replace('https://', ''),
  port: 443,
  password: process.env.UPSTASH_REDIS_REST_TOKEN!,
  tls: { rejectUnauthorized: false }
};

export const QUEUE_NAMES = {
  EMBEDDINGS: 'embeddings-generation',
} as const;

export const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,                  // 最多重试3次
    backoff: {
      type: 'exponential',        // 指数退避
      delay: 5000,                // 初始延迟5秒
    },
    removeOnComplete: {
      age: 24 * 3600,             // 保留成功任务24小时
      count: 1000,                // 最多保留1000个
    },
    removeOnFail: {
      age: 7 * 24 * 3600,         // 保留失败任务7天
    },
  },
};
```

#### 2. 队列实例 (lib/queue/embeddings.queue.ts)

```typescript
import { Queue } from 'bullmq';
import { QUEUE_NAMES, defaultQueueOptions } from './config';

export interface EmbeddingsJobData {
  reportRunId: string;
  reportContent: string;
  language: string;
  tone: string;
  userId?: string;
}

export const embeddingsQueue = new Queue<EmbeddingsJobData>(
  QUEUE_NAMES.EMBEDDINGS,
  defaultQueueOptions
);

/**
 * 添加嵌入生成任务到队列
 */
export async function enqueueEmbeddingsJob(data: EmbeddingsJobData) {
  const job = await embeddingsQueue.add('generate-embeddings', data, {
    jobId: `emb-${data.reportRunId}`,  // 去重：相同reportId只处理一次
    priority: data.userId ? 1 : 5,     // 有用户的任务优先级更高
  });

  console.info(
    `[Queue] Enqueued embeddings job ${job.id} for report ${data.reportRunId}`
  );

  return job;
}
```

#### 3. Worker实现 (lib/queue/workers/embeddings-worker.ts)

```typescript
import { Worker, Job } from 'bullmq';
import { EmbeddingsManager } from '@/lib/core/reports/embeddings';
import { getLangfuseClient } from '@/lib/observability/langfuse';
import { QUEUE_NAMES, defaultQueueOptions } from '../config';
import type { EmbeddingsJobData } from '../embeddings.queue';

const embeddingsManager = new EmbeddingsManager();

/**
 * 嵌入生成Worker
 */
export const embeddingsWorker = new Worker<EmbeddingsJobData>(
  QUEUE_NAMES.EMBEDDINGS,
  async (job: Job<EmbeddingsJobData>) => {
    const { reportRunId, reportContent, language, tone, userId } = job.data;

    console.info(
      `[Worker] Processing embeddings job ${job.id} for report ${reportRunId} (attempt ${job.attemptsMade + 1})`
    );

    const langfuse = getLangfuseClient();
    const trace = langfuse?.trace({
      name: 'embeddings.generate',
      userId,
      metadata: {
        reportRunId,
        language,
        tone,
        jobId: job.id,
        attempt: job.attemptsMade + 1,
      },
    });

    const startTime = Date.now();

    try {
      await embeddingsManager.generateEmbeddings(
        reportRunId,
        reportContent,
        language as any,
        tone
      );

      const duration = Date.now() - startTime;

      trace?.update({
        output: { success: true, durationMs: duration },
      });

      console.info(
        `[Worker] Completed embeddings job ${job.id} in ${duration}ms`
      );

      // 更新进度
      await job.updateProgress(100);

      return { success: true, durationMs: duration };
    } catch (error) {
      const duration = Date.now() - startTime;

      trace?.update({
        output: {
          success: false,
          error: String(error),
          durationMs: duration,
        },
      });

      console.error(
        `[Worker] Failed embeddings job ${job.id} after ${duration}ms:`,
        error
      );

      throw error; // 触发重试
    }
  },
  {
    ...defaultQueueOptions,
    concurrency: 5, // 并发处理5个任务
  }
);

// 监听Worker事件
embeddingsWorker.on('completed', (job) => {
  console.info(`[Worker] Job ${job.id} completed successfully`);
});

embeddingsWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

embeddingsWorker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});
```

#### 4. Worker启动入口 (lib/queue/workers/start-workers.ts)

```typescript
import { embeddingsWorker } from './embeddings-worker';

/**
 * 启动所有队列Worker
 */
export async function startWorkers() {
  console.info('[Workers] Starting all workers...');

  // Worker已在import时自动启动
  console.info('[Workers] Embeddings worker started');

  // 优雅关闭
  process.on('SIGINT', async () => {
    console.info('[Workers] Shutting down gracefully...');
    await embeddingsWorker.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.info('[Workers] Shutting down gracefully...');
    await embeddingsWorker.close();
    process.exit(0);
  });
}

// 仅在直接运行此文件时启动
if (require.main === module) {
  startWorkers().catch((err) => {
    console.error('[Workers] Failed to start workers:', err);
    process.exit(1);
  });
}
```

#### 5. 集成到报告生成流程 (lib/core/reports/generator.ts)

```typescript
import { enqueueEmbeddingsJob } from '@/lib/queue/embeddings.queue';

export class ReportGenerator {
  async generate(params: GenerateReportParams): Promise<GeneratedReport> {
    // ... 现有逻辑

    const generatedReport: GeneratedReport = {
      content: sanitizedContent,
      marketData,
      metadata,
    };

    // 将嵌入生成入队（完全异步）
    await enqueueEmbeddingsJob({
      reportRunId: metadata.reportRunId || crypto.randomUUID(),
      reportContent: sanitizedContent,
      language: metadata.language,
      tone: metadata.tone,
      userId: params.userId,
    }).catch((err) => {
      // 入队失败不影响报告生成
      console.error('[ReportGenerator] Failed to enqueue embeddings job:', err);
    });

    console.info(
      `[ReportGenerator] Generated and cached report for ${params.symbol}, embeddings job enqueued`
    );

    return generatedReport;
  }
}
```

#### 6. 队列监控API (app/api/admin/queue/route.ts)

```typescript
import { NextResponse } from 'next/server';
import { embeddingsQueue } from '@/lib/queue/embeddings.queue';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取队列统计
    const [waiting, active, completed, failed] = await Promise.all([
      embeddingsQueue.getWaitingCount(),
      embeddingsQueue.getActiveCount(),
      embeddingsQueue.getCompletedCount(),
      embeddingsQueue.getFailedCount(),
    ]);

    // 获取最近的失败任务
    const failedJobs = await embeddingsQueue.getFailed(0, 10);

    return NextResponse.json({
      stats: { waiting, active, completed, failed },
      failedJobs: failedJobs.map((job) => ({
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
```

### 部署配置

#### 1. 环境变量

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

#### 2. Worker部署方式

**选项A: Vercel Cron Job** (推荐用于轻量任务)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-embeddings",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

```typescript
// app/api/cron/process-embeddings/route.ts
import { embeddingsWorker } from '@/lib/queue/workers/embeddings-worker';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 处理待处理任务（最多5个）
  const jobs = await embeddingsQueue.getJobs(['waiting'], 0, 4);

  for (const job of jobs) {
    await embeddingsWorker.run(job.id);
  }

  return Response.json({ processed: jobs.length });
}
```

**选项B: 独立长运行进程** (生产环境推荐)

```bash
# 使用 PM2 或 Docker 运行
npm run worker:start

# 或
pm2 start lib/queue/workers/start-workers.ts --name embeddings-worker
```

```json
// package.json
{
  "scripts": {
    "worker:start": "tsx lib/queue/workers/start-workers.ts",
    "worker:dev": "tsx watch lib/queue/workers/start-workers.ts"
  }
}
```

### 测试计划

#### 单元测试 (__tests__/lib/queue/embeddings.test.ts)

```typescript
import { embeddingsQueue, enqueueEmbeddingsJob } from '@/lib/queue/embeddings.queue';

describe('Embeddings Queue', () => {
  afterEach(async () => {
    await embeddingsQueue.obliterate({ force: true });
  });

  it('should enqueue embeddings job', async () => {
    const job = await enqueueEmbeddingsJob({
      reportRunId: 'test-report-123',
      reportContent: 'Test content',
      language: 'en',
      tone: 'baseline',
    });

    expect(job.id).toBe('emb-test-report-123');
    expect(job.data.reportRunId).toBe('test-report-123');
  });

  it('should deduplicate jobs by reportRunId', async () => {
    const job1 = await enqueueEmbeddingsJob({
      reportRunId: 'test-report-123',
      reportContent: 'Test content',
      language: 'en',
      tone: 'baseline',
    });

    const job2 = await enqueueEmbeddingsJob({
      reportRunId: 'test-report-123',
      reportContent: 'Different content',
      language: 'zh-Hans',
      tone: 'buffett',
    });

    // 应该是同一个job（被更新）
    expect(job1.id).toBe(job2.id);
  });

  it('should prioritize jobs with userId', async () => {
    const job1 = await enqueueEmbeddingsJob({
      reportRunId: 'test-1',
      reportContent: 'Test',
      language: 'en',
      tone: 'baseline',
    });

    const job2 = await enqueueEmbeddingsJob({
      reportRunId: 'test-2',
      reportContent: 'Test',
      language: 'en',
      tone: 'baseline',
      userId: 'user-123',
    });

    // job2优先级更高
    expect(job2.opts.priority).toBe(1);
    expect(job1.opts.priority).toBe(5);
  });
});
```

#### 集成测试 (__tests__/lib/queue/worker.integration.test.ts)

```typescript
import { embeddingsWorker } from '@/lib/queue/workers/embeddings-worker';
import { embeddingsQueue, enqueueEmbeddingsJob } from '@/lib/queue/embeddings.queue';

describe('Embeddings Worker Integration', () => {
  jest.setTimeout(30000); // 30秒超时

  afterEach(async () => {
    await embeddingsQueue.obliterate({ force: true });
  });

  it('should process embeddings job successfully', async () => {
    const job = await enqueueEmbeddingsJob({
      reportRunId: 'integration-test-1',
      reportContent: '# Test Report\n\nSome content for testing.',
      language: 'en',
      tone: 'baseline',
    });

    // 等待job完成
    await job.waitUntilFinished(embeddingsQueue.events);

    const completedJob = await embeddingsQueue.getJob(job.id!);
    expect(completedJob?.returnvalue.success).toBe(true);
  });

  it('should retry failed jobs', async () => {
    // Mock LLM service to fail
    jest.spyOn(global.console, 'error').mockImplementation(() => {});

    const job = await enqueueEmbeddingsJob({
      reportRunId: 'fail-test',
      reportContent: 'TRIGGER_FAILURE', // 特殊内容触发失败
      language: 'en',
      tone: 'baseline',
    });

    try {
      await job.waitUntilFinished(embeddingsQueue.events);
    } catch (err) {
      // 预期失败
    }

    const failedJob = await embeddingsQueue.getJob(job.id!);
    expect(failedJob?.attemptsMade).toBeGreaterThan(1); // 至少重试1次
  });
});
```

## 实施步骤

### 步骤1: 安装依赖

```bash
npm install bullmq ioredis
```

### 步骤2: 创建队列基础设施

1. `lib/queue/config.ts`
2. `lib/queue/embeddings.queue.ts`

### 步骤3: 实现Worker

1. `lib/queue/workers/embeddings-worker.ts`
2. `lib/queue/workers/start-workers.ts`

### 步骤4: 修改报告生成流程

修改 `lib/core/reports/generator.ts:186-202`，替换为入队逻辑

### 步骤5: 添加监控API

创建 `app/api/admin/queue/route.ts`

### 步骤6: 配置部署

选择Worker部署方式（Cron或独立进程）

### 步骤7: 测试

运行单元测试和集成测试

## 验收标准

- [ ] 报告生成后立即返回，不等待嵌入生成
- [ ] 嵌入任务成功入队到Redis
- [ ] Worker能自动处理队列任务
- [ ] 失败任务自动重试3次
- [ ] Admin可以查看队列统计
- [ ] 相同reportId的任务去重
- [ ] 测试覆盖率 >70%

## 性能提升预期

| 指标 | 当前 | 改造后 |
|------|------|--------|
| 报告生成响应时间 | 15-40s | 15-40s (无变化) |
| 嵌入生成阻塞时间 | 5-10s | 0s (完全异步) |
| Serverless函数占用时间 | 20-50s | 15-40s (-25%) |
| 嵌入生成成功率 | ~85% (无重试) | >95% (有重试) |
| 并发处理能力 | 1个/次 | 5个/次 (+400%) |

## 参考文档

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Upstash Redis](https://upstash.com/docs/redis)
- [ARCHITECTURE.md Phase 2 设计](../../architecture/ARCHITECTURE.md#phase-2-缓存与队列-week-3-4)
