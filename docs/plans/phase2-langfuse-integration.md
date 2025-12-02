# Phase 2 - Langfuse 监控与可观测性集成方案

> **任务 ID**: G4-4.4
> **优先级**: P2
> **预计时间**: 4-6 小时
> **负责人**: G4 Claude
> **创建日期**: 2025-12-02
> **状态**: 📋 前期调研

---

## 📋 目录

1. [当前状态分析](#当前状态分析)
2. [技术方案设计](#技术方案设计)
3. [实施步骤](#实施步骤)
4. [成本与性能分析](#成本与性能分析)
5. [测试验证](#测试验证)
6. [部署清单](#部署清单)

---

## 当前状态分析

### ✅ 已完成部分

1. **基础集成** (`lib/observability/langfuse.ts`)
   - ✅ Langfuse SDK 已安装 (`langfuse: ^2.0.0`)
   - ✅ 客户端初始化代码已就绪
   - ✅ 支持环境变量配置:
     - `LANGFUSE_PUBLIC_KEY`
     - `LANGFUSE_SECRET_KEY`
     - `LANGFUSE_HOST`

2. **LLM 服务追踪** (`lib/services/llm.ts`)
   - ✅ `generateReport()` 已集成 Trace
   - ✅ Helicone/OpenRouter 双提供商均有 Span 追踪
   - ✅ 错误事件记录（`helicone-failed`, `openrouter-failed`）

3. **报告生成追踪** (`lib/core/reports/generator.ts`)
   - ✅ 顶层 `report.generate` Trace
   - ✅ 市场数据获取 Span (`fetch-market-data`)
   - ✅ LLM 生成 Span (`llm-generation`)
   - ✅ 传递 `userId`, `symbol`, `language`, `tone` 等元数据

### ❌ 缺失部分

#### 1. Token 使用量统计
**问题**:
- 当前未记录 token 使用量（`prompt_tokens`, `completion_tokens`, `total_tokens`）
- 无法分析成本和优化 prompt

**影响**:
- 无法追踪 LLM 成本
- 无法优化 token 使用效率

---

#### 2. 性能告警阈值
**问题**:
- 未设置性能 SLO（Service Level Objective）
- 无自动告警机制

**影响**:
- 报告生成变慢时无法及时发现
- 缺少性能回归检测

---

#### 3. 用户行为追踪
**问题**:
- 未追踪用户操作流程（从输入 → 积分检查 → 生成 → 查看）
- 缺少用户体验指标

**影响**:
- 无法分析用户行为瓶颈
- 难以优化用户体验

---

#### 4. 数据库查询追踪
**问题**:
- Supabase 查询未集成 Langfuse
- 无法分析数据库性能

**影响**:
- 慢查询无法定位
- 数据库瓶颈难以发现

---

#### 5. 可观测性仪表盘文档
**问题**:
- 无指导文档说明如何查看 Langfuse Dashboard
- 团队成员不知道如何使用

**影响**:
- Langfuse 数据无人查看
- 监控价值未发挥

---

## 技术方案设计

### 方案 1: 增强 LLM 追踪（Token 统计）

#### 目标
在 LLM 调用时记录 token 使用量和成本

#### 实现

**1. 修改 `lib/services/llm.ts`**

在 `callHelicone()` 和 `callOpenRouter()` 中提取 token 信息：

```typescript
// lib/services/llm.ts (修改部分)

private async callHelicone(
  systemPrompt: string,
  userPrompt: string,
  options?: LLMGenerationOptions & { span?: any }
): Promise<{ content: string; usage: TokenUsage }> {
  // ... 现有代码 ...

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  const usage = data?.usage; // 提取 usage

  if (!content) {
    throw new Error("Invalid response from Helicone");
  }

  // 记录 token 使用量到 Span
  if (options?.span && usage) {
    options.span.update({
      metadata: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        estimated_cost_usd: this.calculateCost(usage, this.heliconeConfig!.model),
      },
    });
  }

  return { content, usage };
}

// 成本计算辅助函数
private calculateCost(usage: TokenUsage, model: string): number {
  // GPT-4o-mini 定价 (2025-12)
  const pricing = {
    "gpt-4o-mini": {
      prompt: 0.00015 / 1000,      // $0.15 / 1M tokens
      completion: 0.0006 / 1000,   // $0.60 / 1M tokens
    },
    // 其他模型定价...
  };

  const modelPricing = pricing[model] || pricing["gpt-4o-mini"];
  return (
    usage.prompt_tokens * modelPricing.prompt +
    usage.completion_tokens * modelPricing.completion
  );
}
```

**2. 更新 `generateReport()` 方法**

```typescript
async generateReport(
  systemPrompt: string,
  userPrompt: string,
  options?: LLMGenerationOptions
): Promise<string> {
  const langfuse = getLangfuseClient();
  const trace = langfuse?.trace({
    name: "llm.generate-report",
    metadata: options?.metadata || {},
  });

  // Try Helicone first
  if (this.heliconeConfig) {
    try {
      const span = trace?.span({
        name: "llm.helicone",
        input: {
          systemPromptLength: systemPrompt.length,
          userPromptLength: userPrompt.length
        },
      });

      const { content, usage } = await this.callHelicone(
        systemPrompt,
        userPrompt,
        { ...options, span }
      );

      span?.end({
        output: {
          contentLength: content.length,
          tokens: usage,
        },
      });

      return content;
    } catch (error) {
      // ... 错误处理
    }
  }

  // 同样的逻辑应用到 OpenRouter
  // ...
}
```

**验收标准**:
- [ ] Langfuse Dashboard 显示 `prompt_tokens`, `completion_tokens`
- [ ] 显示每次调用的预估成本（USD）
- [ ] 可以按时间段聚合 token 使用量

---

### 方案 2: 数据库查询追踪

#### 目标
追踪 Supabase 查询性能，识别慢查询

#### 实现

**1. 创建 Supabase 客户端包装器**

```typescript
// lib/supabase/instrumented-client.ts
import { createClient } from '@supabase/supabase-js';
import { getLangfuseClient } from '@/lib/observability/langfuse';

export function createInstrumentedClient(userId?: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const langfuse = getLangfuseClient();

  // 创建代理，拦截所有 .from() 调用
  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'from') {
        return (table: string) => {
          const builder = target.from(table);

          // 包装查询执行
          return new Proxy(builder, {
            get(builderTarget, builderProp) {
              if (builderProp === 'select' || builderProp === 'insert' ||
                  builderProp === 'update' || builderProp === 'delete') {
                return (...args: any[]) => {
                  const span = langfuse?.span({
                    name: `db.${String(builderProp)}`,
                    input: { table, args },
                  });

                  const startTime = Date.now();
                  const result = builderTarget[builderProp](...args);

                  // 包装 promise
                  if (result && typeof result.then === 'function') {
                    return result.then((data: any) => {
                      const duration = Date.now() - startTime;
                      span?.end({
                        output: {
                          rowCount: data?.data?.length || 0,
                          durationMs: duration,
                        },
                      });
                      return data;
                    }).catch((error: any) => {
                      span?.end({
                        metadata: { error: String(error) },
                      });
                      throw error;
                    });
                  }

                  return result;
                };
              }

              return builderTarget[builderProp];
            },
          });
        };
      }

      return target[prop];
    },
  });
}
```

**2. 替换所有 Supabase Client 使用**

```typescript
// 修改前
import { createServerClient } from '@/lib/supabase/server';
const supabase = createServerClient();

// 修改后
import { createInstrumentedClient } from '@/lib/supabase/instrumented-client';
const supabase = createInstrumentedClient(userId);
```

**验收标准**:
- [ ] 所有数据库查询在 Langfuse Dashboard 可见
- [ ] 显示查询耗时（ms）
- [ ] 显示返回行数
- [ ] 可以按表名和操作类型过滤

---

### 方案 3: 性能告警阈值

#### 目标
设置 SLO，自动检测性能回归

#### 实现

**1. 定义 SLO**

```typescript
// lib/observability/slo.ts

export const PERFORMANCE_SLO = {
  // 报告生成 P95 < 40 秒
  "report.generate": {
    p95: 40000,
    p99: 60000,
  },

  // LLM 调用 P95 < 30 秒
  "llm.generate-report": {
    p95: 30000,
    p99: 45000,
  },

  // 市场数据获取 P95 < 5 秒
  "fetch-market-data": {
    p95: 5000,
    p99: 8000,
  },

  // 数据库查询 P95 < 200ms
  "db.select": {
    p95: 200,
    p99: 500,
  },
};
```

**2. Langfuse Dashboard 配置**

在 Langfuse 控制台设置告警规则：

1. 进入 **Settings** → **Alerts**
2. 创建新告警:
   - **Name**: "Report Generation Slow (P95 > 40s)"
   - **Condition**: `trace.name == "report.generate" AND duration > 40000`
   - **Notification**: Slack/Email
   - **Frequency**: 每小时检查

3. 重复创建其他告警规则

**3. 自定义仪表盘**

在 Langfuse 创建自定义 Dashboard:

```json
{
  "name": "Investor AI Performance Dashboard",
  "widgets": [
    {
      "type": "timeseries",
      "title": "Report Generation Time (P95)",
      "metric": "trace.duration",
      "filter": "trace.name == 'report.generate'",
      "aggregation": "p95",
      "timeframe": "7d"
    },
    {
      "type": "pie",
      "title": "LLM Provider Usage",
      "metric": "span.name",
      "filter": "span.name IN ('llm.helicone', 'llm.openrouter')",
      "aggregation": "count"
    },
    {
      "type": "table",
      "title": "Top 10 Slowest Queries",
      "metric": "span.duration",
      "filter": "span.name LIKE 'db.%'",
      "aggregation": "max",
      "limit": 10
    },
    {
      "type": "number",
      "title": "Total LLM Cost (30d)",
      "metric": "span.metadata.estimated_cost_usd",
      "aggregation": "sum",
      "timeframe": "30d"
    }
  ]
}
```

**验收标准**:
- [ ] Langfuse 告警规则已配置
- [ ] 测试触发告警（模拟慢查询）
- [ ] 自定义 Dashboard 可访问
- [ ] 团队成员收到告警通知

---

### 方案 4: 用户行为追踪

#### 目标
追踪完整的用户操作流程，优化用户体验

#### 实现

**1. 在 API 层创建顶层 Trace**

```typescript
// app/api/report/route.ts
import { getLangfuseClient } from '@/lib/observability/langfuse';

export async function GET(request: Request) {
  const langfuse = getLangfuseClient();
  const trace = langfuse?.trace({
    name: "api.report.generate",
    userId: user.id,
    metadata: {
      symbol: params.symbol,
      language: params.language,
      tone: params.tone,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for'),
    },
  });

  try {
    // 1. 认证
    const authSpan = trace?.span({ name: "auth.verify" });
    const user = await getCurrentUser();
    authSpan?.end({ output: { userId: user.id } });

    // 2. 积分检查
    const creditsSpan = trace?.span({ name: "credits.check" });
    await creditManager.checkAndConsume(user.id, symbol);
    creditsSpan?.end({ output: { success: true } });

    // 3. 生成报告 (已有 trace)
    const report = await generateReport({ ... });

    // 4. 返回结果
    trace?.update({
      output: {
        success: true,
        reportId: report.id,
      },
    });

    return successResponse(report);
  } catch (error) {
    trace?.update({
      output: {
        success: false,
        error: String(error),
      },
    });
    throw error;
  }
}
```

**2. 前端追踪（可选）**

```typescript
// app/components/report-generator/index.tsx
import { useEffect } from 'react';

export function ReportGenerator() {
  useEffect(() => {
    // 发送页面访问事件到 Langfuse
    fetch('/api/analytics/pageview', {
      method: 'POST',
      body: JSON.stringify({
        page: 'report-generator',
        timestamp: new Date().toISOString(),
      }),
    });
  }, []);

  // ...
}
```

**验收标准**:
- [ ] 完整的用户操作链路可追踪
- [ ] 可以按用户 ID 过滤所有操作
- [ ] 可以分析用户转化漏斗（访问 → 生成 → 查看）

---

## 实施步骤

### Week 3 (4-6 小时)

#### Day 1-2: Token 统计与成本追踪 (2-3h)
- [ ] 修改 `lib/services/llm.ts` 提取 token usage
- [ ] 添加成本计算函数
- [ ] 测试 Helicone 和 OpenRouter
- [ ] 验证 Langfuse Dashboard 显示

#### Day 3: 数据库查询追踪 (2h)
- [ ] 创建 `lib/supabase/instrumented-client.ts`
- [ ] 替换关键路径的 Supabase Client
- [ ] 测试慢查询追踪
- [ ] 验证 Dashboard

#### Day 4: 性能告警与仪表盘 (1-2h)
- [ ] 在 Langfuse 配置告警规则
- [ ] 创建自定义 Dashboard
- [ ] 模拟告警触发
- [ ] 文档编写

#### Day 5: 用户行为追踪 (1h)
- [ ] 在 API 层添加顶层 Trace
- [ ] 测试完整链路追踪
- [ ] 优化元数据收集

---

## 成本与性能分析

### Langfuse 定价 (2025-12)

| 层级 | 价格 | 免费额度 | 适用场景 |
|------|------|---------|---------|
| **Hobby** | $0/月 | 50,000 traces/月 | 开发测试 |
| **Pro** | $59/月 | 1,000,000 traces/月 | 中小型生产 |
| **Enterprise** | 定制 | 无限 | 大规模生产 |

### 当前项目估算

假设每月生成 **10,000 份报告**:

- 每份报告 1 个 Trace（`report.generate`）
- 每个 Trace 包含 3 个 Span:
  - `fetch-market-data`
  - `llm-generation`
  - `db.select` (假设 5 次数据库查询)

**总 Trace 数** = 10,000
**总 Span 数** = 10,000 × (3 + 5) = 80,000

**结论**: **Hobby 计划足够**（免费额度 50,000 traces，当前仅 10,000）

### 性能开销

| 操作 | 开销 | 影响 |
|------|------|------|
| 创建 Trace | ~1ms | 可忽略 |
| 创建 Span | ~0.5ms | 可忽略 |
| 发送数据到 Langfuse | 异步，不阻塞 | 无影响 |

**总开销** < 5ms per request（可忽略）

---

## 测试验证

### 测试清单

#### 1. Token 统计测试
```typescript
// __tests__/observability/llm-tracking.test.ts
describe('LLM Token Tracking', () => {
  it('should record token usage for Helicone', async () => {
    const llm = new LLMService({ helicone: mockConfig });
    const result = await llm.generateReport(systemPrompt, userPrompt);

    // 验证 Langfuse 记录了 token
    const traces = await langfuse.getTraces({ name: "llm.generate-report" });
    expect(traces[0].metadata.total_tokens).toBeGreaterThan(0);
    expect(traces[0].metadata.estimated_cost_usd).toBeGreaterThan(0);
  });
});
```

#### 2. 数据库追踪测试
```typescript
describe('Database Query Tracking', () => {
  it('should track Supabase queries', async () => {
    const client = createInstrumentedClient(userId);
    const { data } = await client
      .from('report_posts')
      .select('*')
      .limit(10);

    // 验证 Langfuse 记录了查询
    const spans = await langfuse.getSpans({ name: "db.select" });
    expect(spans[0].metadata.durationMs).toBeDefined();
  });
});
```

#### 3. 端到端测试
```bash
# 生成一份报告
curl -X GET "http://localhost:3000/api/report?symbol=AAPL&lang=zh-Hans&tone=baseline" \
  -H "Cookie: auth-token=..."

# 检查 Langfuse Dashboard
# 应该看到完整的 Trace:
# - api.report.generate (顶层)
#   - auth.verify
#   - credits.check
#   - report.generate
#     - fetch-market-data
#     - llm-generation
#       - llm.helicone (或 llm.openrouter)
#     - db.select (多次)
```

---

## 部署清单

### 环境变量

**必需**:
```bash
# .env.production
LANGFUSE_PUBLIC_KEY=pk-lf-xxx
LANGFUSE_SECRET_KEY=sk-lf-xxx
LANGFUSE_HOST=https://cloud.langfuse.com
```

**可选**:
```bash
# 采样率（1.0 = 100% 追踪）
LANGFUSE_SAMPLING_RATE=1.0

# 是否追踪数据库查询（生产环境建议开启）
ENABLE_DB_TRACING=true
```

### Vercel 部署配置

```json
// vercel.json
{
  "env": {
    "LANGFUSE_PUBLIC_KEY": "@langfuse-public-key",
    "LANGFUSE_SECRET_KEY": "@langfuse-secret-key",
    "LANGFUSE_HOST": "https://cloud.langfuse.com"
  }
}
```

### Langfuse 账号设置

1. **注册账号**: https://cloud.langfuse.com/signup
2. **创建项目**: "investor-ai-production"
3. **生成 API Keys**: 复制 Public Key 和 Secret Key
4. **配置告警**:
   - 添加 Slack Webhook 或 Email
   - 创建告警规则（参考方案 3）
5. **创建 Dashboard**:
   - 导入预定义模板（如果有）
   - 或手动创建自定义 Dashboard

---

## 可观测性仪表盘使用指南

### 日常监控

**每天早上 9:00**:
1. 打开 Langfuse Dashboard: https://cloud.langfuse.com/project/investor-ai-production
2. 查看 "Performance Dashboard"
3. 检查关键指标:
   - 报告生成 P95 时间 < 40s ✅
   - LLM 成本趋势
   - 数据库慢查询（> 500ms）
   - 错误率 < 1% ✅

### 异常排查

**当收到告警时**:
1. 点击告警邮件中的 Trace 链接
2. 查看完整的调用链路
3. 找到耗时最长的 Span
4. 分析 Input/Output/Metadata
5. 定位问题根因
6. 修复并验证

### 定期回顾

**每周五下午 4:00**:
1. 导出本周性能报告（Langfuse UI → Export CSV）
2. 分析:
   - Top 10 慢查询
   - LLM 成本趋势
   - 用户行为漏斗
3. 识别优化机会
4. 创建优化任务

---

## 相关文档

- [架构文档](../architecture/ARCHITECTURE.md) - 系统架构概览
- [Langfuse 官方文档](https://langfuse.com/docs) - SDK 使用指南
- [OpenAI Token 计费](https://openai.com/pricing) - 成本参考

---

## 附录：Langfuse SDK 常用 API

### 1. 创建 Trace

```typescript
const trace = langfuse.trace({
  name: "operation-name",
  userId: "user-123",
  metadata: { key: "value" },
});
```

### 2. 创建 Span

```typescript
const span = trace.span({
  name: "span-name",
  input: { param: "value" },
});

// 操作完成后
span.end({
  output: { result: "success" },
  metadata: { duration: 123 },
});
```

### 3. 记录事件

```typescript
trace.event({
  name: "custom-event",
  metadata: { details: "..." },
});
```

### 4. 更新 Trace

```typescript
trace.update({
  output: { finalResult: "..." },
  metadata: { totalDuration: 5000 },
});
```

### 5. 刷新（确保数据发送）

```typescript
await langfuse.flushAsync();
```

---

**文档状态**: 📋 前期调研完成，等待 Phase 2 启动

**下一步**: 等待 HQ 确认 Langfuse 账号和 API Keys

---

*最后更新: 2025-12-02*
