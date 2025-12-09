-- ============================================================================
-- Add access_level column to report_posts for SEO strategy
-- ============================================================================
-- This migration adds access control for reports:
-- - timed-free: Public content for SEO, anyone can view
-- - pro: Premium content, requires Pro or Ultra plan
-- - ultra: Exclusive content, requires Ultra plan only
--
-- Created: 2025-12-09
-- Purpose: Enable tiered content strategy for SEO and monetization
-- ============================================================================

-- Add access_level column to report_posts
ALTER TABLE public.report_posts
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'timed-free';

-- Add check constraint for access_level (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'report_posts_access_level_check'
  ) THEN
    ALTER TABLE public.report_posts
    ADD CONSTRAINT report_posts_access_level_check
    CHECK (access_level IN ('timed-free', 'pro', 'ultra'));
  END IF;
END $$;

-- Create index for efficient filtering by access level
CREATE INDEX IF NOT EXISTS idx_report_posts_access_level ON public.report_posts(access_level);

-- Add SEO-related fields for better indexing
ALTER TABLE public.report_posts
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT[],
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_indexed_at TIMESTAMPTZ;

-- Create index for featured reports
CREATE INDEX IF NOT EXISTS idx_report_posts_featured ON public.report_posts(featured DESC, published_at DESC)
WHERE status = 'published' AND featured = TRUE;

-- Create index for view count (for trending reports)
CREATE INDEX IF NOT EXISTS idx_report_posts_trending ON public.report_posts(view_count DESC, published_at DESC)
WHERE status = 'published';

-- Update RLS policies to handle access levels
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "posts_select_published" ON public.report_posts;
DROP POLICY IF EXISTS "posts_select_timed_free" ON public.report_posts;
DROP POLICY IF EXISTS "posts_select_pro" ON public.report_posts;
DROP POLICY IF EXISTS "posts_select_ultra" ON public.report_posts;
DROP POLICY IF EXISTS "posts_select_admin" ON public.report_posts;
DROP POLICY IF EXISTS "posts_select_own" ON public.report_posts;

-- Create new tiered access policy
CREATE POLICY "posts_select_timed_free" ON public.report_posts
  FOR SELECT USING (
    status = 'published' AND access_level = 'timed-free'
  );

CREATE POLICY "posts_select_pro" ON public.report_posts
  FOR SELECT USING (
    status = 'published' AND access_level = 'pro' AND
    (
      public.is_admin() OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.plan IN ('pro', 'ultra', 'admin')
      )
    )
  );

CREATE POLICY "posts_select_ultra" ON public.report_posts
  FOR SELECT USING (
    status = 'published' AND access_level = 'ultra' AND
    (
      public.is_admin() OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.plan IN ('ultra', 'admin')
      )
    )
  );

-- Admin can view all posts
CREATE POLICY "posts_select_admin" ON public.report_posts
  FOR SELECT USING (public.is_admin());

-- Users can view their own drafts
CREATE POLICY "posts_select_own" ON public.report_posts
  FOR SELECT USING (user_id = auth.uid());

-- Comment explaining the access level logic
COMMENT ON COLUMN public.report_posts.access_level IS
'Access control tier: timed-free (public SEO content), pro (Pro+ users), ultra (Ultra users only)';

COMMENT ON COLUMN public.report_posts.meta_title IS
'SEO optimized title for <title> tag, defaults to title if empty';

COMMENT ON COLUMN public.report_posts.meta_description IS
'SEO meta description, should be 150-160 characters';

COMMENT ON COLUMN public.report_posts.featured IS
'Whether this report is featured (shown prominently in listings)';

COMMENT ON COLUMN public.report_posts.view_count IS
'Number of times this report has been viewed (for trending algorithm)';
