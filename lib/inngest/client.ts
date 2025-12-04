import { Inngest } from 'inngest';

/**
 * Inngest client for Qiltrack AI
 * Used for background job processing (embeddings, notifications, etc.)
 */
export const inngest = new Inngest({
  id: 'qiltrack',
  name: 'Qiltrack AI',
});
