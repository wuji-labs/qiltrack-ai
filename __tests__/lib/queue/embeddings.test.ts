import { embeddingsQueue, enqueueEmbeddingsJob } from '@/lib/queue/embeddings.queue';

describe('Embeddings Queue', () => {
  afterEach(async () => {
    // Clean up queue after each test
    await embeddingsQueue.obliterate({ force: true });
  });

  it('should enqueue embeddings job', async () => {
    const job = await enqueueEmbeddingsJob({
      reportRunId: 'test-report-123',
      reportContent: '# Test Report\n\nTest content',
      language: 'en',
      tone: 'baseline',
    });

    expect(job.id).toBe('emb-test-report-123');
    expect(job.data.reportRunId).toBe('test-report-123');
    expect(job.data.language).toBe('en');
    expect(job.data.tone).toBe('baseline');
  });

  it('should deduplicate jobs by reportRunId', async () => {
    const job1 = await enqueueEmbeddingsJob({
      reportRunId: 'test-report-123',
      reportContent: 'Test content 1',
      language: 'en',
      tone: 'baseline',
    });

    const job2 = await enqueueEmbeddingsJob({
      reportRunId: 'test-report-123',
      reportContent: 'Test content 2',
      language: 'zh-Hans',
      tone: 'buffett',
    });

    // Should be the same job (updated)
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

    // job2 should have higher priority (lower number)
    expect(job2.opts.priority).toBe(1);
    expect(job1.opts.priority).toBe(5);
  });

  it('should handle job data correctly', async () => {
    const jobData = {
      reportRunId: 'report-456',
      reportContent: '# Company Analysis\n\nDetailed content...',
      language: 'zh-Hans' as const,
      tone: 'musk',
      userId: 'user-789',
    };

    const job = await enqueueEmbeddingsJob(jobData);

    expect(job.data).toEqual(jobData);
  });

  it('should get waiting count', async () => {
    await enqueueEmbeddingsJob({
      reportRunId: 'test-1',
      reportContent: 'Test 1',
      language: 'en',
      tone: 'baseline',
    });

    await enqueueEmbeddingsJob({
      reportRunId: 'test-2',
      reportContent: 'Test 2',
      language: 'en',
      tone: 'baseline',
    });

    const waitingCount = await embeddingsQueue.getWaitingCount();
    expect(waitingCount).toBe(2);
  });
});
