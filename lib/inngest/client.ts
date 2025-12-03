import { Inngest } from 'inngest';

/**
 * Inngest client for Investor AI
 * Used for background job processing (embeddings, notifications, etc.)
 */
export const inngest = new Inngest({
  id: 'investor-ai',
  name: 'Investor AI',
});
