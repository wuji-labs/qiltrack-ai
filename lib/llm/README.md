# LLM Response Caching System

## Overview

Multi-layer caching strategy to reduce LLM API costs by **60-80%** through intelligent response caching.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LLM Request Flow                        │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Generate Cache │
                    │       Key       │
                    │  (SHA-256 hash) │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Check Redis    │◄── Layer 1: Hot Cache
                    │  (Hot Cache)    │    TTL: 7 days
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
               Cache Hit          Cache Miss
                    │                 │
                    │                 ▼
                    │        ┌─────────────────┐
                    │        │  Call LLM API   │
                    │        │ (Helicone/OR)   │
                    │        └────────┬────────┘
                    │                 │
                    │                 ▼
                    │        ┌─────────────────┐
                    │        │  Calculate Cost │
                    │        │  Store in Redis │
                    │        └────────┬────────┘
                    │                 │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Return Response │
                    │   + Metadata    │
                    └─────────────────┘
```

## Cache Layers

### 1. Hot Cache (Redis)
- **Storage**: Upstash Redis
- **TTL**: 7 days
- **Performance**: Sub-millisecond response times
- **Use Case**: Recently generated reports (same parameters)

### 2. Warm Cache (PostgreSQL)
- **Storage**: Existing `reports` table
- **TTL**: 7 days (user-specific), 1 day (cross-user)
- **Performance**: ~50-100ms response times
- **Use Case**: Report reuse across users (already implemented in `app/api/report/route.ts`)

### 3. Smart Cache (Embedding Similarity)
- **Storage**: PostgreSQL with pgvector
- **Similarity Threshold**: 95%
- **Performance**: ~100-200ms (HNSW index)
- **Use Case**: Similar but not identical queries (future enhancement)

## Cache Key Generation

Cache keys are deterministically generated using SHA-256 hash of normalized parameters:

```typescript
generateCacheKey({
  model: "openai/gpt-5.1",
  prompt: "System prompt + User prompt",
  temperature: 0.7,
  maxTokens: 16384,
  metadata: { symbol: "AAPL", language: "en", tone: "baseline" }
})
// Returns: "llm:openai/gpt-5.1:a3f4b2c1d5e6f7a8"
```

**Key Normalization:**
- Prompts are trimmed (whitespace removed)
- Temperature rounded to 2 decimals (0.699999 → 0.70)
- Consistent JSON serialization (keys sorted alphabetically)

## Cost Calculation

Pricing is based on OpenRouter's current rates (per 1M tokens):

| Model | Prompt Cost | Completion Cost |
|-------|-------------|-----------------|
| GPT-4 | $30 | $60 |
| GPT-4 Turbo | $10 | $30 |
| GPT-3.5 Turbo | $0.50 | $1.50 |
| Claude 3 Opus | $15 | $75 |
| Claude 3 Sonnet | $3 | $15 |
| Claude 3 Haiku | $0.25 | $1.25 |

**Example Cost Savings:**

```typescript
// Without caching (10 identical requests):
10 requests × $0.15 = $1.50

// With caching (1 miss + 9 hits):
1 request × $0.15 + 9 hits × $0.00 = $0.15

// Savings: 90% ($1.35 saved)
```

## Usage

### Automatic Integration

All LLM requests through `LLMService.generateReport()` are automatically cached:

```typescript
const llmService = new LLMService();

// First request - cache miss
const report1 = await llmService.generateReport(systemPrompt, userPrompt, {
  temperature: 0.7,
  maxTokens: 16384,
  metadata: { symbol: "AAPL", language: "en", tone: "baseline" }
});
// Logs: [LLM_CACHE_MISS] Fresh LLM request cost: $0.1523, key: llm:gpt-5.1:a3f4b2c1

// Second identical request - cache hit
const report2 = await llmService.generateReport(systemPrompt, userPrompt, {
  temperature: 0.7,
  maxTokens: 16384,
  metadata: { symbol: "AAPL", language: "en", tone: "baseline" }
});
// Logs: [LLM_CACHE_HIT] Saved $0.0000 by using cached response for key: llm:gpt-5.1:a3f4b2c1
```

### Manual Cache Management

```typescript
import { getCachedResponse, setCachedResponse, clearCache, getCacheStatistics } from '@/lib/llm/cache';

// Get cache statistics
const stats = await getCacheStatistics();
console.log(stats);
// {
//   totalHits: 1234,
//   totalMisses: 0,
//   hitRate: 1.0,
//   estimatedSavingsUSD: 123.45,
//   topKeys: [
//     { key: "llm:gpt-5.1:a3f4b2c1", hits: 567 },
//     { key: "llm:gpt-5.1:b4c5d6e7", hits: 234 }
//   ]
// }

// Clear specific cache pattern
await clearCache("llm:gpt-5.1:*"); // Clear all GPT-5.1 caches
await clearCache(); // Clear all LLM caches
```

## Admin API Endpoints

### GET /api/admin/cache/stats

Returns cache performance metrics:

```json
{
  "success": true,
  "data": {
    "totalHits": 1234,
    "totalMisses": 0,
    "hitRate": 1.0,
    "estimatedSavingsUSD": 123.45,
    "topKeys": [
      { "key": "llm:gpt-5.1:a3f4b2c1", "hits": 567 },
      { "key": "llm:gpt-5.1:b4c5d6e7", "hits": 234 }
    ]
  }
}
```

### POST /api/admin/cache/invalidate

Invalidate cache by pattern:

```bash
curl -X POST https://your-domain.com/api/admin/cache/invalidate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "llm:gpt-5.1:*"}'
```

## Configuration

All cache settings can be configured in `lib/llm/cache.ts`:

```typescript
export const CACHE_CONFIG = {
  // Redis TTL (hot cache)
  HOT_CACHE_TTL: 60 * 60 * 24 * 7, // 7 days

  // PostgreSQL TTL (warm cache)
  WARM_CACHE_TTL: 60 * 60 * 24 * 7, // 7 days

  // Embedding similarity threshold
  SIMILARITY_THRESHOLD: 0.95, // 95% similar = cache hit

  // Cache key prefix
  KEY_PREFIX: "llm:",

  // Cache statistics TTL
  STATS_TTL: 60 * 60 * 24 * 30, // 30 days
};
```

## Environment Variables

```env
# Upstash Redis (required for hot cache)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Encryption key for sensitive cache data (optional)
ENCRYPTION_KEY=your_64_character_hex_encryption_key
```

## Performance Metrics

Expected improvements after caching implementation:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| LLM API Costs | $100/month | $20-40/month | **60-80% reduction** |
| Response Time (cache hit) | 60-150s | <10ms | **>99% faster** |
| Response Time (cache miss) | 60-150s | 60-150s | Same |
| Hit Rate (estimated) | N/A | 70-80% | N/A |

## Monitoring

### Log Messages

```bash
# Cache hit (saved cost)
[LLM_CACHE_HIT] Saved $0.1523 by using cached response for key: llm:gpt-5.1:a3f4b2c1

# Cache miss (incurred cost)
[LLM_CACHE_MISS] Fresh LLM request cost: $0.1523, key: llm:gpt-5.1:a3f4b2c1

# Cache set
[LLM_CACHE_SET] key: llm:gpt-5.1:a3f4b2c1, ttl: 604800s, size: 12345b

# Cache statistics
[LLM_CACHE_STATS] Total hits: 1234, Total misses: 0, Hit rate: 100.00%, Estimated savings: $123.45
```

### Langfuse Integration

Caching events are automatically tracked in Langfuse:

```typescript
// Cache hit event
trace.event({
  name: "llm-cache-hit",
  metadata: { cacheKey: "llm:gpt-5.1:a3f4b2c1", savedCostUSD: 0.1523 }
});

// Cache miss event
trace.event({
  name: "llm-cache-miss",
  metadata: { cacheKey: "llm:gpt-5.1:a3f4b2c1", costUSD: 0.1523 }
});
```

## Future Enhancements

1. **Semantic Similarity Caching**
   - Use embedding similarity to find similar queries
   - Return cached response for 95%+ similar prompts
   - Requires integration with existing pgvector embeddings

2. **Cache Warming**
   - Pre-generate reports for popular stocks
   - Automatic refresh before cache expiration
   - Scheduled batch processing

3. **Multi-Region Caching**
   - Deploy Redis in multiple regions
   - Reduced latency for global users
   - Automatic failover

4. **Cache Analytics Dashboard**
   - Real-time cache hit rate visualization
   - Cost savings over time
   - Top cached queries
   - Cache size and memory usage

## Troubleshooting

### Cache Not Working

1. **Check Redis Configuration**
   ```bash
   # Verify environment variables
   echo $UPSTASH_REDIS_REST_URL
   echo $UPSTASH_REDIS_REST_TOKEN
   ```

2. **Check Redis Connection**
   ```typescript
   import { getRedisClient } from '@/lib/llm/cache';
   const redis = getRedisClient();
   console.log(redis); // Should not be null
   ```

3. **Verify Cache Keys**
   ```bash
   # Use Redis CLI or Upstash Console
   KEYS llm:*
   ```

### Cache Hit Rate Too Low

1. **Check Parameter Consistency**
   - Ensure temperature is consistently rounded
   - Verify prompt normalization (trim whitespace)
   - Check metadata serialization

2. **Increase TTL**
   ```typescript
   // In lib/llm/cache.ts
   HOT_CACHE_TTL: 60 * 60 * 24 * 14, // 14 days instead of 7
   ```

3. **Monitor Cache Invalidation**
   - Check if admin is manually clearing cache
   - Verify TTL settings

## License

MIT
