-- Migration: Sync quota schema with Hosted environment and API expectations
-- Purpose: Ensure report_credits table is properly initialized with data,
--          convert v_user_quota to regular VIEW (non-materialized) with remaining_credits field,
--          and update fn_consume_report_credit to maintain table consistency
-- Data Protection: Idempotent SQL with IF NOT EXISTS; backfills from events; no data deletion

-- 1. Ensure report_credits table exists with proper structure
CREATE TABLE IF NOT EXISTS public.report_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_available INT DEFAULT 5,
  credits_used INT DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Backfill report_credits from report_credit_events (if table was empty or new records exist)
-- Calculate credits_available as: quota_limit (from profiles) + SUM(all deltas from events)
-- Calculate credits_used as: ABS(SUM(negative deltas)) = total deductions
-- This aggregates ALL events (grants, deductions) to derive current state
INSERT INTO public.report_credits (user_id, credits_available, credits_used, created_at, updated_at)
SELECT
  p.id,
  GREATEST(
    COALESCE(p.quota_limit, 5) + COALESCE(SUM(ce.delta), 0),
    0
  ) AS credits_available,
  COALESCE(ABS(SUM(CASE WHEN ce.delta < 0 THEN ce.delta ELSE 0 END)), 0) AS credits_used,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM public.profiles p
LEFT JOIN public.report_credit_events ce ON p.id = ce.user_id
WHERE NOT EXISTS (SELECT 1 FROM public.report_credits rc WHERE rc.user_id = p.id)
GROUP BY p.id, p.quota_limit
ON CONFLICT (user_id) DO NOTHING;

-- 3. Drop existing materialized view (if it exists) to avoid conflicts
DROP MATERIALIZED VIEW IF EXISTS public.v_user_quota CASCADE;

-- 4. Create v_user_quota as regular VIEW (non-materialized) for real-time data
-- Returns remaining_credits = credits_available from table (synchronized with fn_consume_report_credit)
CREATE VIEW public.v_user_quota AS
SELECT
  p.id AS user_id,
  p.email,
  p.plan,
  p.quota_limit,
  p.reports_used,
  COALESCE(rc.credits_available, 0) AS remaining_credits
FROM public.profiles p
LEFT JOIN public.report_credits rc ON p.id = rc.user_id;

-- 5. Create trigger to auto-create report_credits row for new users
-- When a new profile is inserted, automatically create corresponding report_credits entry
CREATE OR REPLACE FUNCTION public.fn_init_report_credits_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.report_credits (user_id, credits_available, credits_used)
  VALUES (NEW.id, COALESCE(NEW.quota_limit, 5), 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_init_report_credits_on_profile_insert ON public.profiles;
CREATE TRIGGER tr_init_report_credits_on_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.fn_init_report_credits_for_profile();

-- 6. Recreate fn_consume_report_credit with new signature and legacy integer overload
-- Primary signature: takes p_user_id, p_symbol, p_metadata (optional)
-- Returns (success BOOLEAN, remaining_credits INT)
DROP FUNCTION IF EXISTS public.fn_consume_report_credit(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.fn_consume_report_credit(UUID, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.fn_consume_report_credit(
  p_user_id UUID,
  p_symbol TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, remaining_credits INT) AS $$
DECLARE
  v_credits_available INT;
BEGIN
  -- Lock the row for atomic update
  SELECT credits_available INTO v_credits_available
  FROM public.report_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no record or insufficient credits, return failure
  IF v_credits_available IS NULL OR v_credits_available <= 0 THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_credits_available, 0);
    RETURN;
  END IF;

  -- Update report_credits table
  UPDATE public.report_credits
  SET
    credits_available = credits_available - 1,
    credits_used = credits_used + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;

  -- Record in audit event table
  INSERT INTO public.report_credit_events (
    user_id,
    event_type,
    credits_amount,
    reason,
    metadata,
    delta
  )
  VALUES (
    p_user_id,
    'consumed',
    -1,
    COALESCE(p_symbol, 'Report generation'),
    p_metadata,
    -1
  );

  -- Return success with remaining credits after deduction
  RETURN QUERY SELECT TRUE, (v_credits_available - 1)::INT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Legacy integer overload for backwards compatibility: p_cost parameter
-- Delegates to primary function, consuming p_cost credits
CREATE OR REPLACE FUNCTION public.fn_consume_report_credit(
  p_user_id UUID,
  p_cost INTEGER
)
RETURNS TABLE(success BOOLEAN, remaining_credits INT) AS $$
DECLARE
  v_credits_available INT;
  v_loop_count INT;
BEGIN
  -- Lock and fetch current balance
  SELECT credits_available INTO v_credits_available
  FROM public.report_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If insufficient credits, return failure immediately
  IF v_credits_available IS NULL OR v_credits_available < COALESCE(p_cost, 1) THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_credits_available, 0);
    RETURN;
  END IF;

  -- Deduct p_cost credits atomically
  UPDATE public.report_credits
  SET
    credits_available = credits_available - COALESCE(p_cost, 1),
    credits_used = credits_used + COALESCE(p_cost, 1),
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;

  -- Record single audit event with cost metadata
  INSERT INTO public.report_credit_events (
    user_id,
    event_type,
    credits_amount,
    reason,
    metadata,
    delta
  )
  VALUES (
    p_user_id,
    'consumed',
    -COALESCE(p_cost, 1),
    'Report generation (batch)',
    jsonb_build_object('cost', p_cost),
    -COALESCE(p_cost, 1)
  );

  -- Return success with remaining credits after deduction
  RETURN QUERY SELECT TRUE, (v_credits_available - COALESCE(p_cost, 1))::INT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_report_credits_user_id ON public.report_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_report_credit_events_user_id ON public.report_credit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_report_credit_events_created_at ON public.report_credit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_report_credit_events_event_type ON public.report_credit_events(event_type);

-- 7. Enable RLS on tables (if not already enabled)
ALTER TABLE public.report_credits ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for report_credits
DROP POLICY IF EXISTS "Users can view their own report credits" ON public.report_credits;
DROP POLICY IF EXISTS "Service role can manage report credits" ON public.report_credits;
DROP POLICY IF EXISTS "Service role can update report credits" ON public.report_credits;

CREATE POLICY "Users can view their own report credits" ON public.report_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage report credits" ON public.report_credits
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update report credits" ON public.report_credits
  FOR UPDATE USING (auth.role() = 'service_role');
