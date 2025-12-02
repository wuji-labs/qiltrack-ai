import { embeddingsWorker } from '@/lib/queue/workers/embeddings-worker';
import { embeddingsQueue, enqueueEmbeddingsJob } from '@/lib/queue/embeddings.queue';
import { EmbeddingsManager } from '@/lib/core/reports/embeddings';

// Mock dependencies
jest.mock('@/lib/core/reports/embeddings');
jest.mock('@/lib/observability/langfuse');

describe('Embeddings Worker Integration', () => {
  jest.setTimeout(30000); // 30 seconds timeout

  afterEach(async () => {
    // Clean up
    await embeddingsQueue.obliterate({ force: true });
  });

  afterAll(async () => {
    // Close worker
    await embeddingsWorker.close();
  });

  it('should process embeddings job successfully', async () => {
    // Mock successful embedding generation
    const mockGenerateEmbeddings = jest.spyOn(
      EmbeddingsManager.prototype,
      'generateEmbeddings'
    );
    mockGenerateEmbeddings.mockResolvedValue(undefined);

    const job = await enqueueEmbeddingsJob({
      reportRunId: 'integration-test-1',
      reportContent: '# Test Report\n\nSome content for testing.',
      language: 'en',
      tone: 'baseline',
    });

    // Wait for job to complete
    const result = await job.waitUntilFinished(embeddingsQueue.events);

    expect(result.success).toBe(true);
    expect(result.durationMs).toBeGreaterThan(0);
    expect(mockGenerateEmbeddings).toHaveBeenCalledWith(
      'integration-test-1',
      '# Test Report\n\nSome content for testing.',
      'en',
      'baseline'
    );

    mockGenerateEmbeddings.mockRestore();
  });

  it('should handle job failure and retry', async () => {
    // Mock failed embedding generation
    const mockGenerateEmbeddings = jest.spyOn(
      EmbeddingsManager.prototype,
      'generateEmbeddings'
    );
    mockGenerateEmbeddings.mockRejectedValue(new Error('LLM service unavailable'));

    const job = await enqueueEmbeddingsJob({
      reportRunId: 'fail-test-1',
      reportContent: 'Test content',
      language: 'en',
      tone: 'baseline',
    });

    try {
      await job.waitUntilFinished(embeddingsQueue.events);
      fail('Job should have failed');
    } catch (err) {
      // Expected to fail
    }

    const failedJob = await embeddingsQueue.getJob(job.id!);

    // Should have attempted multiple times (with retries)
    expect(failedJob?.attemptsMade).toBeGreaterThan(1);
    expect(failedJob?.failedReason).toContain('LLM service unavailable');

    mockGenerateEmbeddings.mockRestore();
  });

  it('should process multiple jobs concurrently', async () => {
    // Mock successful embedding generation with delay
    const mockGenerateEmbeddings = jest.spyOn(
      EmbeddingsManager.prototype,
      'generateEmbeddings'
    );
    mockGenerateEmbeddings.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    const startTime = Date.now();

    // Enqueue 5 jobs
    const jobs = await Promise.all([
      enqueueEmbeddingsJob({
        reportRunId: 'concurrent-1',
        reportContent: 'Test 1',
        language: 'en',
        tone: 'baseline',
      }),
      enqueueEmbeddingsJob({
        reportRunId: 'concurrent-2',
        reportContent: 'Test 2',
        language: 'en',
        tone: 'baseline',
      }),
      enqueueEmbeddingsJob({
        reportRunId: 'concurrent-3',
        reportContent: 'Test 3',
        language: 'en',
        tone: 'baseline',
      }),
      enqueueEmbeddingsJob({
        reportRunId: 'concurrent-4',
        reportContent: 'Test 4',
        language: 'en',
        tone: 'baseline',
      }),
      enqueueEmbeddingsJob({
        reportRunId: 'concurrent-5',
        reportContent: 'Test 5',
        language: 'en',
        tone: 'baseline',
      }),
    ]);

    // Wait for all jobs to complete
    await Promise.all(
      jobs.map((job) => job.waitUntilFinished(embeddingsQueue.events))
    );

    const duration = Date.now() - startTime;

    // With concurrency=5, all 5 jobs should complete in ~1s (not 5s)
    expect(duration).toBeLessThan(2000);

    mockGenerateEmbeddings.mockRestore();
  });

  it('should update job progress', async () => {
    // Mock successful embedding generation
    const mockGenerateEmbeddings = jest.spyOn(
      EmbeddingsManager.prototype,
      'generateEmbeddings'
    );
    mockGenerateEmbeddings.mockResolvedValue(undefined);

    const job = await enqueueEmbeddingsJob({
      reportRunId: 'progress-test-1',
      reportContent: 'Test content',
      language: 'en',
      tone: 'baseline',
    });

    await job.waitUntilFinished(embeddingsQueue.events);

    const completedJob = await embeddingsQueue.getJob(job.id!);
    expect(completedJob?.progress).toBe(100);

    mockGenerateEmbeddings.mockRestore();
  });
});
