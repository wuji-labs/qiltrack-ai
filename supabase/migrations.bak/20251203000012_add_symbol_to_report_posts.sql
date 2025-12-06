-- Migration: Add symbol column to report_posts for report generation reuse checks
-- Safety: Uses IF NOT EXISTS and CONCURRENTLY where applicable

-- 1) Add symbol column
ALTER TABLE public.report_posts
  ADD COLUMN IF NOT EXISTS symbol TEXT;

-- 2) Backfill symbol from slug prefix if missing
UPDATE public.report_posts
SET symbol = UPPER(SPLIT_PART(slug, '-', 1))
WHERE symbol IS NULL
  AND slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_report_posts_symbol
  ON public.report_posts(symbol)
  WHERE symbol IS NOT NULL;

COMMENT ON COLUMN public.report_posts.symbol IS 'Ticker symbol for generated report (e.g., AAPL)';
