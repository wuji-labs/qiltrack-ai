-- ============================================================================
-- Add quality score and enhanced SEO fields to report_posts
-- ============================================================================
-- Migration: Add quality scoring and SEO performance tracking
-- Date: 2025-12-09
-- Purpose: Support manual SEO workflow and data-driven decision making
-- ============================================================================

-- Enable uuid-ossp extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add quality score and SEO analytics fields
ALTER TABLE public.report_posts
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS organic_visits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS seo_indexed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seo_indexed_at TIMESTAMPTZ;

-- Create index for quality score (helps admins find SEO candidates)
CREATE INDEX IF NOT EXISTS idx_report_posts_quality_score
ON public.report_posts(quality_score DESC, published_at DESC)
WHERE status = 'published';

-- Create index for SEO performance analysis
CREATE INDEX IF NOT EXISTS idx_report_posts_seo_performance
ON public.report_posts(access_level, organic_visits DESC, conversion_rate DESC)
WHERE status = 'published' AND access_level = 'timed-free';

-- Add comments for documentation
COMMENT ON COLUMN public.report_posts.quality_score IS
'Quality score (0-100) calculated from content length, data completeness, charts, etc. Used by admins to select reports for SEO.';

COMMENT ON COLUMN public.report_posts.organic_visits IS
'Number of visits from organic search (Google, Bing, etc.). Updated via Google Analytics API integration.';

COMMENT ON COLUMN public.report_posts.conversion_rate IS
'Conversion rate from visit to user registration/signup (0.00-1.00). Used to measure SEO ROI.';

COMMENT ON COLUMN public.report_posts.seo_indexed IS
'Whether this report has been successfully indexed by Google (verified via Search Console API).';

COMMENT ON COLUMN public.report_posts.seo_indexed_at IS
'Timestamp when Google first indexed this report (from Search Console API).';

-- ============================================================================
-- Create SEO decision audit log table
-- ============================================================================
-- Tracks admin decisions to set reports as timed-free for SEO

CREATE TABLE IF NOT EXISTS public.seo_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_post_id UUID REFERENCES public.report_posts(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL CHECK (action IN ('set_timed_free', 'restore_pro', 'promote_ultra')),
  reason TEXT,
  quality_score INTEGER,
  previous_access_level TEXT,
  new_access_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying decision history
CREATE INDEX idx_seo_decisions_report_post
ON public.seo_decisions(report_post_id, created_at DESC);

CREATE INDEX idx_seo_decisions_admin
ON public.seo_decisions(admin_user_id, created_at DESC);

-- Comments
COMMENT ON TABLE public.seo_decisions IS
'Audit log of admin decisions to change report access levels for SEO purposes. Tracks who made changes and why.';

-- ============================================================================
-- Create SEO performance tracking table
-- ============================================================================
-- Daily metrics from Google Search Console and Analytics

CREATE TABLE IF NOT EXISTS public.seo_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_post_id UUID REFERENCES public.report_posts(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC(5,2) DEFAULT 0.00,
  avg_position NUMERIC(5,2) DEFAULT 0.00,
  conversions INTEGER DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0.00,
  avg_time_on_page INTEGER DEFAULT 0, -- seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_post_id, date)
);

-- Index for time-series queries
CREATE INDEX idx_seo_performance_date
ON public.seo_performance(date DESC);

CREATE INDEX idx_seo_performance_report_date
ON public.seo_performance(report_post_id, date DESC);

-- Comments
COMMENT ON TABLE public.seo_performance IS
'Daily SEO performance metrics imported from Google Search Console and Google Analytics. Used for data-driven SEO optimization.';

COMMENT ON COLUMN public.seo_performance.impressions IS
'Number of times the report appeared in Google search results (from Search Console).';

COMMENT ON COLUMN public.seo_performance.clicks IS
'Number of clicks from Google search results (from Search Console).';

COMMENT ON COLUMN public.seo_performance.ctr IS
'Click-through rate: clicks / impressions (0.00-1.00).';

COMMENT ON COLUMN public.seo_performance.avg_position IS
'Average position in Google search results (1.0 = #1 ranking).';

COMMENT ON COLUMN public.seo_performance.conversions IS
'Number of user registrations/signups attributed to this report (from GA4).';

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- SEO decisions: Admins can insert/update, all authenticated users can read
ALTER TABLE public.seo_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo_decisions_admin_write" ON public.seo_decisions
  FOR ALL USING (public.is_admin());

CREATE POLICY "seo_decisions_auth_read" ON public.seo_decisions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- SEO performance: Admins can write, authenticated users can read
ALTER TABLE public.seo_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo_performance_admin_write" ON public.seo_performance
  FOR ALL USING (public.is_admin());

CREATE POLICY "seo_performance_auth_read" ON public.seo_performance
  FOR SELECT USING (auth.uid() IS NOT NULL);
