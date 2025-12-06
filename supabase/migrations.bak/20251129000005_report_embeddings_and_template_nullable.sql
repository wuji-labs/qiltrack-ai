-- Migration: Allow nullable template_id on report_runs and add reports_embeddings for vector reuse
-- Purpose: Unblock report generation when template is absent and persist embeddings for similar-report retrieval
-- Notes: ivfflat index requires ANALYZE after deploy; adjust vector dimension if embedding model changes

-- 1) Ensure pgvector is available for embeddings
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2) Relax template_id and make FK nullable-safe
ALTER TABLE public.report_runs
  ALTER COLUMN template_id DROP NOT NULL;

ALTER TABLE public.report_runs
  DROP CONSTRAINT IF EXISTS report_runs_template_id_fkey;

ALTER TABLE public.report_runs
  ADD CONSTRAINT report_runs_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES public.report_templates(id) ON DELETE SET NULL;

-- 3) Create embeddings table
CREATE TABLE IF NOT EXISTS public.reports_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_run_id UUID NOT NULL REFERENCES public.report_runs(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  lang TEXT,
  tone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_run_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_reports_embeddings_run_id ON public.reports_embeddings(report_run_id);
-- ivfflat prefers cosine distance for text embeddings; tune lists as needed
CREATE INDEX IF NOT EXISTS idx_reports_embeddings_embedding ON public.reports_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Reminder: run ANALYZE after deploying ivfflat index to make it usable
ANALYZE public.reports_embeddings;

-- 4) RLS for embeddings table
ALTER TABLE public.reports_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage report embeddings" ON public.reports_embeddings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can read their own report embeddings" ON public.reports_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.report_runs rr
      WHERE rr.id = report_run_id
      AND rr.user_id = auth.uid()
    )
  );
