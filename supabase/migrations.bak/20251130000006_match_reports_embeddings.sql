-- Migration: Similar reports via pgvector
-- Purpose: Provide RPC to fetch nearest report runs for a user using embeddings
-- Notes: Requires pgvector and existing reports_embeddings data; respects user scoping via parameter

CREATE OR REPLACE FUNCTION public.match_reports_embeddings(
  p_user_id UUID,
  p_query_run_id UUID,
  p_lang TEXT DEFAULT NULL,
  p_tone TEXT DEFAULT NULL,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  report_run_id UUID,
  symbol TEXT,
  created_at TIMESTAMPTZ,
  similarity DOUBLE PRECISION
) AS $$
WITH source AS (
  SELECT re.embedding
  FROM public.reports_embeddings re
  JOIN public.report_runs qr ON qr.id = re.report_run_id
  WHERE re.report_run_id = p_query_run_id
    AND qr.user_id = p_user_id
  ORDER BY re.chunk_index
  LIMIT 1
)
SELECT
  re.report_run_id,
  rr.symbol,
  rr.created_at,
  1 - (re.embedding <#> src.embedding) AS similarity
FROM public.reports_embeddings re
JOIN public.report_runs rr ON rr.id = re.report_run_id
CROSS JOIN source src
WHERE rr.user_id = p_user_id
  AND re.report_run_id <> p_query_run_id
  AND (p_lang IS NULL OR re.lang = p_lang)
  AND (p_tone IS NULL OR re.tone = p_tone)
ORDER BY re.embedding <#> src.embedding, rr.created_at DESC
LIMIT p_match_count;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION public.match_reports_embeddings IS 'Return similar report runs for a user using pgvector cosine distance';
