-- Migration: Unify credit system - remove profiles quota fields
-- Purpose: Migrate from dual credit system (profiles + report_credits) to single report_credits table
-- Date: 2025-12-01
-- IMPORTANT: This migration removes quota_limit and reports_used from profiles table

-- 1. Verify all users have report_credits records (should be handled by existing triggers, but double-check)
-- Insert missing records if any (should be rare due to existing triggers)
INSERT INTO public.report_credits (user_id, credits_available, credits_used, created_at, updated_at)
SELECT
  p.id,
  COALESCE(p.quota_limit, 30) - COALESCE(p.reports_used, 0) AS credits_available,
  COALESCE(p.reports_used, 0) AS credits_used,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.report_credits rc WHERE rc.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Create RPC function for admin to grant credits
CREATE OR REPLACE FUNCTION public.fn_grant_credits(
  target_user_id UUID,
  amount INT,
  reason TEXT DEFAULT 'admin_grant'
)
RETURNS JSONB AS $$
DECLARE
  v_credits_available INT;
BEGIN
  -- Update credits atomically
  UPDATE public.report_credits
  SET
    credits_available = credits_available + amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = target_user_id
  RETURNING credits_available INTO v_credits_available;

  -- Record event
  INSERT INTO public.report_credit_events (
    user_id,
    event_type,
    credits_amount,
    reason,
    delta,
    metadata
  )
  VALUES (
    target_user_id,
    'granted',
    amount,
    reason,
    amount,
    jsonb_build_object('granted_by', auth.uid())
  );

  -- Record audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    details
  )
  VALUES (
    COALESCE(auth.uid(), target_user_id),
    'GRANT_CREDITS',
    'report_credits',
    jsonb_build_object(
      'target_user', target_user_id,
      'amount', amount,
      'reason', reason
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_added', amount,
    'new_balance', COALESCE(v_credits_available, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create RPC function to get user credits (convenience function)
CREATE OR REPLACE FUNCTION public.fn_get_user_credits(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  credits_available INT,
  credits_used INT,
  last_updated TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.credits_available,
    rc.credits_used,
    rc.updated_at
  FROM public.report_credits rc
  WHERE rc.user_id = COALESCE(p_user_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Remove quota_limit and reports_used columns from profiles
-- IMPORTANT: This is a breaking change - make sure all code is updated to use report_credits table
-- First drop any views that depend on these columns
DROP VIEW IF EXISTS public.v_user_quota CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS quota_limit;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS reports_used;

-- 5. Update comments for clarity
COMMENT ON TABLE public.report_credits IS 'Unified credit system for report generation. Each user has one record tracking available and used credits.';
COMMENT ON FUNCTION public.fn_grant_credits IS 'Admin function to grant credits to a user. Records event and audit log.';
COMMENT ON FUNCTION public.fn_get_user_credits IS 'Get credit balance for current user or specified user.';

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.fn_grant_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_user_credits TO authenticated;
