-- Migration: Align schema with code expectations and Architecture Snapshot (Stage 2)
-- Purpose: Fix field names and add missing columns to match API/test requirements for Hosted deployment

-- 1. Add 'mode' column to report_runs if it doesn't exist
ALTER TABLE public.report_runs
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'production';

-- 2. Rename and restructure report_documents to match code expectations
-- Drop and recreate to align with current code: report_run_id, document_type, storage_path
DROP TABLE IF EXISTS public.report_documents CASCADE;

CREATE TABLE public.report_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_run_id UUID NOT NULL REFERENCES public.report_runs(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'markdown', 'docx', etc.
  storage_path TEXT NOT NULL,  -- 'user_id/report_run_id.md' format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add metadata column to report_credit_events for audit data
ALTER TABLE public.report_credit_events
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delta INT;

-- For backward compatibility, populate delta from credits_amount if needed
UPDATE public.report_credit_events
SET delta = credits_amount
WHERE delta IS NULL;

-- 4. Drop and recreate v_user_quota to include user_id and correct field name
DROP MATERIALIZED VIEW IF EXISTS public.v_user_quota;

CREATE MATERIALIZED VIEW public.v_user_quota AS
SELECT
  p.id AS user_id,
  p.email,
  p.plan,
  p.quota_limit,
  p.reports_used,
  COALESCE(p.quota_limit + SUM(COALESCE(ce.credits_amount, 0)), p.quota_limit) AS remaining_credits
FROM public.profiles p
LEFT JOIN public.report_credit_events ce ON p.id = ce.user_id
GROUP BY p.id, p.email, p.plan, p.quota_limit, p.reports_used;

-- 5. Update fn_consume_report_credit to return remaining_credits instead of remaining
DROP FUNCTION IF EXISTS public.fn_consume_report_credit(UUID, TEXT, JSONB);

CREATE OR REPLACE FUNCTION fn_consume_report_credit(
  p_user_id UUID,
  p_symbol TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, remaining_credits INT) AS $$
DECLARE
  v_credits_available INT;
BEGIN
  SELECT credits_available INTO v_credits_available
  FROM public.report_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_credits_available IS NULL OR v_credits_available <= 0 THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_credits_available, 0);
    RETURN;
  END IF;

  UPDATE public.report_credits
  SET credits_used = credits_used + 1,
      credits_available = credits_available - 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;

  INSERT INTO public.report_credit_events (user_id, event_type, credits_amount, reason, metadata, delta)
  VALUES (p_user_id, 'consumed', -1, COALESCE(p_symbol, 'Report generation'), p_metadata, -1);

  RETURN QUERY SELECT TRUE, v_credits_available - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create indexes for report_documents
CREATE INDEX IF NOT EXISTS idx_report_documents_report_run_id ON public.report_documents(report_run_id);
CREATE INDEX IF NOT EXISTS idx_report_documents_created_at ON public.report_documents(created_at);

-- 7. Create indexes for credit events
CREATE INDEX IF NOT EXISTS idx_report_credit_events_user_id ON public.report_credit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_report_credit_events_created_at ON public.report_credit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_report_credit_events_event_type ON public.report_credit_events(event_type);

-- 8. Recreate RLS policies for report_documents (table was recreated)
ALTER TABLE public.report_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own report documents" ON public.report_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.report_runs
      WHERE id = report_documents.report_run_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage report documents" ON public.report_documents
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete report documents" ON public.report_documents
  FOR DELETE WITH CHECK (auth.role() = 'service_role');
