import { describe, expect, it, beforeEach, afterEach, jest } from "@jest/globals";
import {
  getCachedResponse,
  setCachedResponse,
  invalidateCache,
  getCacheStats,
  generateCacheKey,
  CacheLayer,
} from "@/lib/cache/llm-cache";

// Mock Redis and Supabase clients
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
};

const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
};

describe("LLM Cache System", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("generateCacheKey", () => {
    it("should generate consistent keys for same input", () => {
      const params = {
        model: "gpt-4",
        prompt: "Analyze this stock",
        temperature: 0.7,
      };

      const key1 = generateCacheKey(params);
      const key2 = generateCacheKey(params);

      expect(key1).toBe(key2);
    });

    it("should generate different keys for different inputs", () => {
      const params1 = {
        model: "gpt-4",
        prompt: "Analyze AAPL",
        temperature: 0.7,
      };

      const params2 = {
        model: "gpt-4",
        prompt: "Analyze TSLA",
        temperature: 0.7,
      };

      const key1 = generateCacheKey(params1);
      const key2 = generateCacheKey(params2);

      expect(key1).not.toBe(key2);
    });

    it("should include all relevant parameters", () => {
      const params = {
        model: "gpt-4",
        prompt: "Test prompt",
        temperature: 0.5,
        maxTokens: 100,
      };

      const key = generateCacheKey(params);

      expect(key).toBeDefined();
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
    });

    it("should be case-sensitive for prompts", () => {
      const params1 = { model: "gpt-4", prompt: "AAPL analysis" };
      const params2 = { model: "gpt-4", prompt: "aapl analysis" };

      const key1 = generateCacheKey(params1);
      const key2 = generateCacheKey(params2);

      expect(key1).not.toBe(key2);
    });

    it("should handle parameter order independence", () => {
      const params1 = {
        model: "gpt-4",
        prompt: "Test",
        temperature: 0.7,
      };

      const params2 = {
        temperature: 0.7,
        prompt: "Test",
        model: "gpt-4",
      };

      const key1 = generateCacheKey(params1);
      const key2 = generateCacheKey(params2);

      // Keys should be same regardless of parameter order
      expect(key1).toBe(key2);
    });

    it("should handle special characters in prompts", () => {
      const params = {
        model: "gpt-4",
        prompt: "Analyze $AAPL: What's the P/E ratio?",
      };

      const key = generateCacheKey(params);

      expect(key).toBeDefined();
      expect(typeof key).toBe("string");
    });

    it("should handle unicode characters", () => {
      const params = {
        model: "gpt-4",
        prompt: "分析股票市场趋势",
      };

      const key = generateCacheKey(params);

      expect(key).toBeDefined();
      expect(typeof key).toBe("string");
    });
  });

  describe("getCachedResponse - Hot Cache (Redis)", () => {
    it("should return cached response from Redis", async () => {
      const cacheKey = "test-key";
      const cachedData = {
        response: "Cached LLM response",
        timestamp: Date.now(),
        model: "gpt-4",
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await getCachedResponse(cacheKey, mockRedis);

      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledWith(cacheKey);
    });

    it("should return null if not in Redis", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await getCachedResponse("non-existent-key", mockRedis);

      expect(result).toBeNull();
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedis.get.mockRejectedValue(new Error("Redis connection failed"));

      const result = await getCachedResponse("test-key", mockRedis);

      expect(result).toBeNull();
    });

    it("should handle invalid JSON", async () => {
      mockRedis.get.mockResolvedValue("invalid json{");

      const result = await getCachedResponse("test-key", mockRedis);

      expect(result).toBeNull();
    });

    it("should increment hit counter on cache hit", async () => {
      const cachedData = { response: "test" };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));
      mockRedis.incr.mockResolvedValue(1);

      await getCachedResponse("test-key", mockRedis);

      expect(mockRedis.incr).toHaveBeenCalledWith("cache:hits");
    });
  });

  describe("getCachedResponse - Warm Cache (PostgreSQL)", () => {
    it("should fallback to PostgreSQL if not in Redis", async () => {
      const cacheKey = "test-key";
      const dbCachedData = {
        response: "DB cached response",
        timestamp: Date.now(),
      };

      mockRedis.get.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: dbCachedData,
              error: null,
            }),
          }),
        }),
      });

      const result = await getCachedResponse(cacheKey, mockRedis, mockSupabase);

      expect(result).toEqual(dbCachedData);
    });

    it("should promote warm cache to hot cache", async () => {
      const cacheKey = "test-key";
      const dbCachedData = {
        response: "DB response",
        timestamp: Date.now(),
      };

      mockRedis.get.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: dbCachedData,
              error: null,
            }),
          }),
        }),
      });

      await getCachedResponse(cacheKey, mockRedis, mockSupabase);

      // Should set in Redis after fetching from DB
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it("should return null if not in either cache", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error("Not found"),
            }),
          }),
        }),
      });

      const result = await getCachedResponse("test-key", mockRedis, mockSupabase);

      expect(result).toBeNull();
    });
  });

  describe("setCachedResponse", () => {
    it("should cache response in Redis (hot cache)", async () => {
      const cacheKey = "test-key";
      const response = "LLM response";
      const ttl = 3600; // 1 hour

      mockRedis.setex.mockResolvedValue("OK");

      await setCachedResponse(cacheKey, response, ttl, CacheLayer.HOT, mockRedis);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        cacheKey,
        ttl,
        expect.any(String)
      );
    });

    it("should cache response in PostgreSQL (warm cache)", async () => {
      const cacheKey = "test-key";
      const response = "LLM response";

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      await setCachedResponse(
        cacheKey,
        response,
        86400,
        CacheLayer.WARM,
        mockRedis,
        mockSupabase
      );

      expect(mockSupabase.from).toHaveBeenCalledWith("llm_cache");
    });

    it("should cache in both layers when specified", async () => {
      const cacheKey = "test-key";
      const response = "LLM response";

      mockRedis.setex.mockResolvedValue("OK");
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      await setCachedResponse(
        cacheKey,
        response,
        3600,
        CacheLayer.BOTH,
        mockRedis,
        mockSupabase
      );

      expect(mockRedis.setex).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    it("should handle Redis write errors gracefully", async () => {
      mockRedis.setex.mockRejectedValue(new Error("Redis write failed"));

      await expect(
        setCachedResponse("test-key", "response", 3600, CacheLayer.HOT, mockRedis)
      ).resolves.not.toThrow();
    });

    it("should include metadata in cached entry", async () => {
      const cacheKey = "test-key";
      const response = "LLM response";
      const metadata = {
        model: "gpt-4",
        tokens: 150,
        cost: 0.003,
      };

      mockRedis.setex.mockResolvedValue("OK");

      await setCachedResponse(
        cacheKey,
        response,
        3600,
        CacheLayer.HOT,
        mockRedis,
        undefined,
        metadata
      );

      const setCachedData = JSON.parse(mockRedis.setex.mock.calls[0][2]);
      expect(setCachedData).toMatchObject({
        response,
        ...metadata,
      });
    });
  });

  describe("invalidateCache", () => {
    it("should delete key from Redis", async () => {
      const cacheKey = "test-key";
      mockRedis.del.mockResolvedValue(1);

      await invalidateCache(cacheKey, mockRedis);

      expect(mockRedis.del).toHaveBeenCalledWith(cacheKey);
    });

    it("should delete key from PostgreSQL", async () => {
      const cacheKey = "test-key";

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        }),
      });

      await invalidateCache(cacheKey, mockRedis, mockSupabase);

      expect(mockSupabase.from).toHaveBeenCalledWith("llm_cache");
    });

    it("should invalidate pattern-based keys", async () => {
      const pattern = "user:123:*";

      mockRedis.keys.mockResolvedValue(["user:123:req1", "user:123:req2"]);
      mockRedis.del.mockResolvedValue(2);

      await invalidateCache(pattern, mockRedis, undefined, true);

      expect(mockRedis.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedis.del).toHaveBeenCalledWith(["user:123:req1", "user:123:req2"]);
    });

    it("should handle invalidation errors gracefully", async () => {
      mockRedis.del.mockRejectedValue(new Error("Delete failed"));

      await expect(
        invalidateCache("test-key", mockRedis)
      ).resolves.not.toThrow();
    });
  });

  describe("getCacheStats", () => {
    it("should return cache statistics", async () => {
      mockRedis.get.mockImplementation((key) => {
        if (key === "cache:hits") return Promise.resolve("1000");
        if (key === "cache:misses") return Promise.resolve("200");
        return Promise.resolve(null);
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [
          { cache_key: "key1", hit_count: 50 },
          { cache_key: "key2", hit_count: 30 },
        ],
        error: null,
      });

      const stats = await getCacheStats(mockRedis, mockSupabase);

      expect(stats).toMatchObject({
        totalHits: 1000,
        totalMisses: 200,
        hitRate: expect.any(Number),
      });

      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.hitRate).toBeLessThanOrEqual(1);
    });

    it("should calculate hit rate correctly", async () => {
      mockRedis.get.mockImplementation((key) => {
        if (key === "cache:hits") return Promise.resolve("800");
        if (key === "cache:misses") return Promise.resolve("200");
        return Promise.resolve(null);
      });

      const stats = await getCacheStats(mockRedis);

      expect(stats.hitRate).toBe(0.8); // 800 / (800 + 200)
    });

    it("should estimate cost savings", async () => {
      mockRedis.get.mockImplementation((key) => {
        if (key === "cache:hits") return Promise.resolve("1000");
        if (key === "cache:misses") return Promise.resolve("100");
        return Promise.resolve(null);
      });

      const stats = await getCacheStats(mockRedis, undefined, {
        avgCostPerRequest: 0.01,
      });

      expect(stats.estimatedSavingsUSD).toBe(10); // 1000 hits * $0.01
    });

    it("should return top cached keys", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { cache_key: "popular-key-1", hit_count: 500 },
          { cache_key: "popular-key-2", hit_count: 300 },
          { cache_key: "popular-key-3", hit_count: 200 },
        ],
        error: null,
      });

      const stats = await getCacheStats(mockRedis, mockSupabase);

      expect(stats.topKeys).toBeDefined();
      expect(stats.topKeys.length).toBeGreaterThan(0);
      expect(stats.topKeys[0]).toMatchObject({
        key: "popular-key-1",
        hits: 500,
      });
    });

    it("should handle missing statistics gracefully", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const stats = await getCacheStats(mockRedis, mockSupabase);

      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe("Integration scenarios", () => {
    it("should complete full cache lifecycle", async () => {
      const params = {
        model: "gpt-4",
        prompt: "Analyze AAPL stock",
        temperature: 0.7,
      };

      // 1. Generate cache key
      const cacheKey = generateCacheKey(params);
      expect(cacheKey).toBeDefined();

      // 2. Check cache (miss)
      mockRedis.get.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error("Not found"),
            }),
          }),
        }),
      });

      const cachedResponse = await getCachedResponse(
        cacheKey,
        mockRedis,
        mockSupabase
      );
      expect(cachedResponse).toBeNull();

      // 3. Generate LLM response (simulated)
      const llmResponse = "Apple Inc. shows strong fundamentals...";

      // 4. Cache the response
      mockRedis.setex.mockResolvedValue("OK");
      await setCachedResponse(
        cacheKey,
        llmResponse,
        3600,
        CacheLayer.HOT,
        mockRedis
      );

      expect(mockRedis.setex).toHaveBeenCalled();

      // 5. Subsequent request (cache hit)
      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          response: llmResponse,
          timestamp: Date.now(),
        })
      );

      const secondResponse = await getCachedResponse(cacheKey, mockRedis);
      expect(secondResponse?.response).toBe(llmResponse);
    });

    it("should handle cache eviction and refresh", async () => {
      const cacheKey = "test-key";

      // 1. Initial cache set
      mockRedis.setex.mockResolvedValue("OK");
      await setCachedResponse(
        cacheKey,
        "Old response",
        3600,
        CacheLayer.HOT,
        mockRedis
      );

      // 2. Invalidate cache
      mockRedis.del.mockResolvedValue(1);
      await invalidateCache(cacheKey, mockRedis);

      expect(mockRedis.del).toHaveBeenCalledWith(cacheKey);

      // 3. Set new cache
      await setCachedResponse(
        cacheKey,
        "New response",
        3600,
        CacheLayer.HOT,
        mockRedis
      );

      expect(mockRedis.setex).toHaveBeenCalledTimes(2);
    });

    it("should demonstrate cost savings calculation", async () => {
      // Simulate 1000 requests with 80% hit rate
      mockRedis.get.mockImplementation((key) => {
        if (key === "cache:hits") return Promise.resolve("800");
        if (key === "cache:misses") return Promise.resolve("200");
        return Promise.resolve(null);
      });

      const stats = await getCacheStats(mockRedis, undefined, {
        avgCostPerRequest: 0.01, // $0.01 per LLM request
      });

      expect(stats.hitRate).toBe(0.8);
      expect(stats.estimatedSavingsUSD).toBe(8); // 800 * $0.01
    });
  });

  describe("Performance and reliability", () => {
    it("should handle high concurrency", async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        getCachedResponse(`key-${i}`, mockRedis)
      );

      mockRedis.get.mockResolvedValue(null);

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it("should handle large responses", async () => {
      const largeResponse = "A".repeat(1000000); // 1MB response
      const cacheKey = "large-key";

      mockRedis.setex.mockResolvedValue("OK");

      await expect(
        setCachedResponse(cacheKey, largeResponse, 3600, CacheLayer.HOT, mockRedis)
      ).resolves.not.toThrow();
    });

    it("should implement TTL correctly", async () => {
      const cacheKey = "test-key";
      const ttl = 300; // 5 minutes

      mockRedis.setex.mockResolvedValue("OK");

      await setCachedResponse(
        cacheKey,
        "response",
        ttl,
        CacheLayer.HOT,
        mockRedis
      );

      expect(mockRedis.setex).toHaveBeenCalledWith(
        cacheKey,
        ttl,
        expect.any(String)
      );
    });

    it("should handle connection failures gracefully", async () => {
      mockRedis.get.mockRejectedValue(new Error("Connection timeout"));

      const result = await getCachedResponse("test-key", mockRedis);

      expect(result).toBeNull();
    });
  });
});
