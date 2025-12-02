import { Worker, Job } from 'bullmq';
import { EmbeddingsManager } from '@/lib/core/reports/embeddings';
import { getLangfuseClient } from '@/lib/observability/langfuse';
import { QUEUE_NAMES, defaultQueueOptions } from '../config';
import type { EmbeddingsJobData } from '../embeddings.queue';

const embeddingsManager = new EmbeddingsManager();

/**
 * Embeddings generation worker
 *
 * Processes jobs from the embeddings queue
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
        language,
        tone
      );

      const duration = Date.now() - startTime;

      trace?.update({
        output: { success: true, durationMs: duration },
      });

      console.info(
        `[Worker] Completed embeddings job ${job.id} in ${duration}ms`
      );

      // Update job progress
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

      throw error; // Trigger retry
    }
  },
  {
    ...defaultQueueOptions,
    concurrency: 5, // Process 5 jobs concurrently
  }
);

// Listen to worker events
embeddingsWorker.on('completed', (job) => {
  console.info(`[Worker] Job ${job.id} completed successfully`);
});

embeddingsWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

embeddingsWorker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});
