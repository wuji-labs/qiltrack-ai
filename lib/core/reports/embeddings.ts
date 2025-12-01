/* eslint-disable @typescript-eslint/no-explicit-any */
import { LLMService } from "@/lib/services/llm";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/i18n-config";

/**
 * Embeddings Manager handles report chunking and embedding generation
 */
export class EmbeddingsManager {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  /**
   * Generate and store embeddings for a report (background task)
   *
   * @param reportRunId - Report run ID
   * @param report - Report content
   * @param language - Report language
   * @param tone - Report tone
   */
  async generateEmbeddings(
    reportRunId: string,
    report: string,
    language: Language,
    tone: string
  ): Promise<void> {
    try {
      // Chunk the report
      const chunks = this.chunkReport(report);

      // Generate embeddings for each chunk
      const rows = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
          const embedding = await this.llmService.generateEmbedding(chunk);
          rows.push({
            report_run_id: reportRunId,
            chunk_index: i,
            embedding,
            lang: language,
            tone,
          });
        } catch (err) {
          console.warn(`Embedding chunk ${i} failed:`, err);
        }
      }

      if (rows.length === 0) {
        return;
      }

      // Save to database
      const serviceClient = createServiceRoleClient();
      await serviceClient
        .from("reports_embeddings" as any)
        .upsert(rows, { onConflict: "report_run_id,chunk_index" });
    } catch (err) {
      console.warn("Embedding generation failed:", err);
    }
  }

  /**
   * Chunk report into smaller pieces for embedding
   *
   * @param markdown - Report content in markdown
   * @param maxChars - Maximum characters per chunk
   * @param overlap - Overlap between chunks
   * @returns Array of text chunks
   */
  private chunkReport(
    markdown: string,
    maxChars: number = 3500,
    overlap: number = 400
  ): string[] {
    const paragraphs = markdown
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    let current = "";

    for (const para of paragraphs) {
      if ((current + "\n\n" + para).length > maxChars) {
        if (current) {
          chunks.push(current.trim());
          const tail = current.slice(-overlap);
          current = tail + "\n\n" + para;
        } else {
          chunks.push(para);
          current = "";
        }
      } else {
        current = current ? `${current}\n\n${para}` : para;
      }
    }

    if (current) {
      chunks.push(current.trim());
    }

    return chunks;
  }
}
