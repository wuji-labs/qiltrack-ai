import { embeddingsWorker } from './embeddings-worker';

/**
 * Start all queue workers
 */
export async function startWorkers() {
  console.info('[Workers] Starting all workers...');

  // Worker is already started on import
  console.info('[Workers] Embeddings worker started');

  // Graceful shutdown
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

// Start workers if this file is run directly
if (require.main === module) {
  startWorkers().catch((err) => {
    console.error('[Workers] Failed to start workers:', err);
    process.exit(1);
  });
}
