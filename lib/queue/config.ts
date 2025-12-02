import { QueueOptions } from 'bullmq';

/**
 * Queue configuration for BullMQ with Upstash Redis
 *
 * Uses Redis connection settings from environment variables
 */

// Parse Upstash Redis REST URL to extract host
const getRedisHost = (): string => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  if (!url) {
    // Return mock value for testing
    if (process.env.NODE_ENV === 'test') {
      return 'localhost';
    }
    throw new Error('UPSTASH_REDIS_REST_URL is not set');
  }
  return url.replace('https://', '').replace('http://', '');
};

// Redis connection config for BullMQ
export const connection = {
  host: getRedisHost(),
  port: process.env.NODE_ENV === 'test' ? 6379 : 443,
  password: process.env.UPSTASH_REDIS_REST_TOKEN || 'test-token',
  tls:
    process.env.NODE_ENV === 'test'
      ? undefined
      : {
          rejectUnauthorized: false,
        },
};

/**
 * Queue names
 */
export const QUEUE_NAMES = {
  EMBEDDINGS: 'embeddings-generation',
} as const;

/**
 * Default queue options
 */
export const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential', // Exponential backoff
      delay: 5000, // Start with 5 seconds
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};
