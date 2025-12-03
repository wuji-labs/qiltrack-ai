import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { generateEmbeddings } from '@/lib/inngest/functions/embeddings';

/**
 * Inngest API route handler
 * Serves all registered Inngest functions
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateEmbeddings,
    // Add more functions here as needed
  ],
});
