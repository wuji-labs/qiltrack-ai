import { Queue } from 'bullmq';
import { QUEUE_NAMES, defaultQueueOptions } from './config';
import type { Language } from '@/lib/i18n-config';

/**
 * Job data for embeddings generation
 */
export interface EmbeddingsJobData {
  reportRunId: string;
  reportContent: string;
  language: Language;
  tone: string;
  userId?: string;
}

/**
 * Embeddings generation queue instance
 */
export const embeddingsQueue = new Queue<EmbeddingsJobData>(
  QUEUE_NAMES.EMBEDDINGS,
  defaultQueueOptions
);

/**
 * Add embeddings generation job to queue
 *
 * @param data - Job data
 * @returns Promise<Job>
 */
export async function enqueueEmbeddingsJob(data: EmbeddingsJobData) {
  const job = await embeddingsQueue.add('generate-embeddings', data, {
    jobId: `emb-${data.reportRunId}`, // Deduplicate by reportRunId
    priority: data.userId ? 1 : 5, // Higher priority for user-initiated jobs
  });

  console.info(
    `[Queue] Enqueued embeddings job ${job.id} for report ${data.reportRunId}`
  );

  return job;
}
