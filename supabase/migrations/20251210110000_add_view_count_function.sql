-- ============================================================================
-- Add view count increment function
-- ============================================================================
-- This migration adds a PostgreSQL function to atomically increment view count
-- Created: 2025-12-09
-- ============================================================================

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_report_view_count(p_slug TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  UPDATE public.report_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE slug = p_slug
  RETURNING view_count INTO v_new_count;

  RETURN v_new_count;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.increment_report_view_count(TEXT) TO authenticated, anon;

-- Comment
COMMENT ON FUNCTION public.increment_report_view_count(TEXT) IS
'Atomically increments the view_count for a report post by slug. Returns the new view count.';
