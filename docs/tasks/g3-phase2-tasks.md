# G3 Phase 2 任务清单

## 任务 3.3: 报告复用逻辑优化
**优先级**: P1
**预计**: 4小时

### 目标
- 引入Redis缓存检查
- 优化`checkReusableReport()`
- 添加缓存命中率追踪

### 文件
- `lib/core/reports/generator.ts`
- `lib/cache/redis.ts` (新建)

---

## 任务 3.4: 异步嵌入生成队列化
**优先级**: P1
**预计**: 6小时

### 目标
- 集成BullMQ队列
- 创建`embeddingWorker`
- 失败重试机制
- 进度追踪

### 文件
- `lib/workers/embedding-worker.ts` (新建)
- `lib/core/reports/embeddings.ts`

---

## 任务 3.5: LLM故障转移增强
**优先级**: P2
**预计**: 3小时

### 目标
- Helicone → OpenRouter切换
- 指数退避重试
- 熔断器模式

### 文件
- `lib/services/llm.ts`

---

## 任务 3.6: 性能测试
**优先级**: P2
**预计**: 4小时

### 目标
- 报告生成性能测试
- 积分操作性能测试
- 并发测试

### 文件
- `__tests__/performance/` (新建)
