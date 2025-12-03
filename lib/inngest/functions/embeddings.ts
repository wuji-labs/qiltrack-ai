import { inngest } from '../client';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { EmbeddingsManager } from '@/lib/core/reports/embeddings';
import type { Language } from '@/lib/i18n-config';

/**
 * Background function to generate report embeddings
 * Triggered after a report is successfully generated
 */
export const generateEmbeddings = inngest.createFunction(
  {
    id: 'generate-embeddings',
    name: 'Generate Report Embeddings',
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: 'report/generated' },
  async ({ event, step }) => {
    const { reportRunId, content, language, tone } = event.data;

    // Step 1: Generate embeddings
    const embeddings = await step.run('generate-embeddings', async () => {
      const manager = new EmbeddingsManager();
      await manager.generateEmbeddings(
        reportRunId,
        content,
        language as Language,
        tone
      );

      return { success: true, reportRunId };
    });

    // Step 2: Update report status (optional)
    await step.run('update-report-status', async () => {
      const supabase = createServiceRoleClient();

      const { error } = await supabase
        .from('report_posts')
        .update({ updated_at: new Date().toISOString() })
        .eq('report_run_id', reportRunId);

      if (error) {
        console.error('Failed to update report status:', error);
      }

      return { success: !error };
    });

    return embeddings;
  }
);
