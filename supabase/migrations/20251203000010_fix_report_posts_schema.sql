-- Migration: Fix report_posts schema for report generation system
-- Purpose: Add missing fields required for report generation workflow
-- Safety: Idempotent operations with IF NOT EXISTS guards

-- 1. Add missing fields to report_posts
ALTER TABLE public.report_posts
  ADD COLUMN IF NOT EXISTS report_run_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'baseline';

-- 2. Add unique constraint on report_run_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'report_posts_report_run_id_key'
  ) THEN
    ALTER TABLE public.report_posts
      ADD CONSTRAINT report_posts_report_run_id_key
      UNIQUE (report_run_id);
  END IF;
END $$;

-- 3. Add tone constraint (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'report_posts_tone_check'
  ) THEN
    ALTER TABLE public.report_posts
      ADD CONSTRAINT report_posts_tone_check
      CHECK (tone IN ('baseline', 'buffett', 'musk', 'muddy'));
  END IF;
END $$;

-- 4. Create indexes for better query performance (concurrent to avoid locking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_posts_report_run_id
  ON public.report_posts(report_run_id)
  WHERE report_run_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_posts_user_id
  ON public.report_posts(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_posts_tone
  ON public.report_posts(tone);

-- 5. Add field comments for documentation
COMMENT ON COLUMN public.report_posts.report_run_id IS
  'Unique ID for report generation run. Links report to generation metadata.';

COMMENT ON COLUMN public.report_posts.user_id IS
  'User who generated this report. NULL for test/system generated reports.';

COMMENT ON COLUMN public.report_posts.tone IS
  'Report tone style: baseline (neutral), buffett (value investing), musk (growth), muddy (short-selling)';

-- 6. Update RLS policies to include user_id access
-- Allow users to read their own draft reports
DROP POLICY IF EXISTS "Users can read their own drafts" ON public.report_posts;
CREATE POLICY "Users can read their own drafts" ON public.report_posts
  FOR SELECT USING (
    status = 'published'
    OR user_id = auth.uid()
    OR author_id = auth.uid()
  );
