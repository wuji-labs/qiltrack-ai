-- Migration: Report Hub Refresh - Add fields for report reuse, featuring, and admin management
-- Date: 2025-12-01
-- Purpose: Support report reuse logic, featured reports, and admin management features

-- Add new columns to report_runs table
ALTER TABLE public.report_runs
  ADD COLUMN IF NOT EXISTS hash TEXT,
  ADD COLUMN IF NOT EXISTS reused_from_run_id UUID REFERENCES public.report_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'production',
  ADD COLUMN IF NOT EXISTS pdf_path TEXT,
  ADD COLUMN IF NOT EXISTS content_md TEXT,
  ADD COLUMN IF NOT EXISTS content_html TEXT,
  ADD COLUMN IF NOT EXISTS meta JSONB;

-- Add column to indicate if report is a production or test run (if not exists)
-- mode is used for distinguishing test vs production runs

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_report_runs_hash ON public.report_runs(hash);
CREATE INDEX IF NOT EXISTS idx_report_runs_symbol ON public.report_runs(symbol);
CREATE INDEX IF NOT EXISTS idx_report_runs_is_featured ON public.report_runs(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_report_runs_reused_from ON public.report_runs(reused_from_run_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_symbol_lang_created ON public.report_runs(symbol, lang, created_at DESC);

-- Create a composite index for fast reuse lookups (symbol + lang + mode + recent)
CREATE INDEX IF NOT EXISTS idx_report_runs_reuse_lookup ON public.report_runs(symbol, lang, mode, created_at DESC) WHERE status = 'completed';

-- Update RLS policies for report_runs to support admin access
-- Drop existing policies if they conflict (optional, for idempotency)
DROP POLICY IF EXISTS "Admins can view all report runs" ON public.report_runs;
DROP POLICY IF EXISTS "Admins can update report runs" ON public.report_runs;

-- Create admin policies
CREATE POLICY "Admins can view all report runs" ON public.report_runs
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (plan = 'admin' OR email LIKE '%@investor.ai')
    )
  );

CREATE POLICY "Admins can update report runs" ON public.report_runs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (plan = 'admin' OR email LIKE '%@investor.ai')
    )
  );

-- Function to compute content hash (for reuse detection)
CREATE OR REPLACE FUNCTION fn_compute_report_hash(p_symbol TEXT, p_lang TEXT, p_mode TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(p_symbol || ':' || COALESCE(p_lang, 'en') || ':' || COALESCE(p_mode, 'baseline'), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find reusable report within 7 days
CREATE OR REPLACE FUNCTION fn_find_reusable_report(
  p_symbol TEXT,
  p_lang TEXT DEFAULT 'en',
  p_mode TEXT DEFAULT 'production'
)
RETURNS TABLE(
  run_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  symbol TEXT,
  lang TEXT,
  mode TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    report_runs.created_at,
    report_runs.symbol,
    COALESCE(report_runs.lang, 'en'),
    COALESCE(report_runs.mode, 'production')
  FROM public.report_runs
  WHERE report_runs.symbol = p_symbol
    AND COALESCE(report_runs.lang, 'en') = p_lang
    AND report_runs.status = 'completed'
    AND report_runs.created_at >= NOW() - INTERVAL '7 days'
  ORDER BY report_runs.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular symbols by generation count (last 30 days)
CREATE OR REPLACE FUNCTION fn_get_popular_symbols(
  p_range_days INT DEFAULT 30,
  p_limit INT DEFAULT 20
)
RETURNS TABLE(
  symbol TEXT,
  generation_count BIGINT,
  latest_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    report_runs.symbol,
    COUNT(*) AS generation_count,
    MAX(report_runs.created_at) AS latest_created_at
  FROM public.report_runs
  WHERE report_runs.symbol IS NOT NULL
    AND report_runs.status = 'completed'
    AND report_runs.created_at >= NOW() - (p_range_days || ' days')::INTERVAL
  GROUP BY report_runs.symbol
  ORDER BY generation_count DESC, latest_created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on new columns
COMMENT ON COLUMN public.report_runs.hash IS 'Content hash for detecting duplicate requests (symbol+lang+mode)';
COMMENT ON COLUMN public.report_runs.reused_from_run_id IS 'Links to the original report if this is a reused report';
COMMENT ON COLUMN public.report_runs.is_featured IS 'Indicates if this report is featured/public on the report hub';
COMMENT ON COLUMN public.report_runs.pdf_path IS 'Storage path for PDF export';
COMMENT ON COLUMN public.report_runs.content_md IS 'Markdown content of the report';
COMMENT ON COLUMN public.report_runs.content_html IS 'HTML content of the report (optional)';
COMMENT ON COLUMN public.report_runs.meta IS 'Additional metadata (tone, prompt, etc.)';
