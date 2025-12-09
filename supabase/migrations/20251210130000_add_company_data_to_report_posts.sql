-- ============================================================================
-- Add company_data field to report_posts for full report display
-- ============================================================================
-- Migration: Add company_data JSONB field to store complete company information
-- Date: 2025-12-09
-- Purpose: Enable report center (/reports/[slug]) to display same content as
--          generated reports (KPIs, charts, news, etc.)
-- ============================================================================

-- Add company_data field to store CompanyData object
ALTER TABLE public.report_posts
ADD COLUMN IF NOT EXISTS company_data JSONB DEFAULT NULL;

-- Add index for JSONB queries (optional, for future filtering)
CREATE INDEX IF NOT EXISTS idx_report_posts_company_data
ON public.report_posts USING GIN (company_data);

-- Add comment for documentation
COMMENT ON COLUMN public.report_posts.company_data IS
'Complete company data (profile, quote, metrics, news) used for rendering charts and KPIs. Structure: { symbol, profile: { name, exchange, industry, marketCap... }, quote: { current, change... }, metrics: { peTTM, roeTTM... }, recentNews: [...] }';

-- ============================================================================
-- Note: This migration is safe to run multiple times (idempotent)
-- ============================================================================
