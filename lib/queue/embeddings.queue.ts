import { EmbeddingsManager } from "@/lib/core/reports/embeddings";
import type { Language } from "@/lib/i18n-config";

type JobData = {
  reportRunId: string;
  reportContent: string;
  language: Language;
  tone: string;
  userId?: string;
};

class FakeJob {
  id: string;
  data: JobData;
  opts: { priority: number };
  attemptsMade = 0;
  progress = 0;
  failedReason?: string;
  private resolver!: (value: any) => void;
  private rejecter!: (reason?: any) => void;
  private promise: Promise<any>;

  constructor(data: JobData, priority: number) {
    this.id = `emb-${data.reportRunId}`;
    this.data = data;
    this.opts = { priority };
    this.promise = new Promise((resolve, reject) => {
      this.resolver = resolve;
      this.rejecter = reject;
    });
  }

  async waitUntilFinished(_events?: unknown) {
    return this.promise;
  }

  async complete(result: any) {
    this.progress = 100;
    this.resolver(result);
  }

  fail(reason: any) {
    this.failedReason = String(reason);
    this.rejecter(reason);
  }
}

class FakeQueue {
  private jobs = new Map<string, FakeJob>();
  events = {};

  async obliterate(_opts: { force: boolean }) {
    this.jobs.clear();
  }

  async add(_name: string, data: JobData, opts: { jobId: string; priority: number }) {
    const job = new FakeJob(data, opts.priority);
    this.jobs.set(job.id, job);
    this.process(job);
    return job;
  }

  async getWaitingCount() {
    return this.jobs.size;
  }

  async getJob(id: string) {
    return this.jobs.get(id) ?? null;
  }

  private async process(job: FakeJob, attempt = 1): Promise<void> {
    const manager = new EmbeddingsManager();
    job.attemptsMade = attempt;
    const start = Date.now();
    try {
      await manager.generateEmbeddings(
        job.data.reportRunId,
        job.data.reportContent,
        job.data.language,
        job.data.tone
      );
      await job.complete({ success: true, durationMs: Date.now() - start });
    } catch (err) {
      if (attempt < 2) {
        return this.process(job, attempt + 1);
      }
      job.fail(err);
    }
  }
}

export const embeddingsQueue = new FakeQueue();

export async function enqueueEmbeddingsJob(data: JobData) {
  const priority = data.userId ? 1 : 5;
  return embeddingsQueue.add("embeddings", data, {
    jobId: `emb-${data.reportRunId}`,
    priority,
  });
}
