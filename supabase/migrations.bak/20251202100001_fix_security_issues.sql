-- Migration: Fix critical security issues
-- Date: 2025-12-02
-- Issues fixed:
-- 1. fn_grant_credits authorization vulnerability
-- 2. audit_logs table_name vs resource_type inconsistency

-- 1. Fix fn_grant_credits to require admin authorization
CREATE OR REPLACE FUNCTION public.fn_grant_credits(
  target_user_id UUID,
  amount INT,
  reason TEXT DEFAULT 'admin_grant'
)
RETURNS JSONB AS $$
DECLARE
  v_credits_available INT;
  caller_role TEXT;
BEGIN
  -- 1. Get caller's role
  SELECT role INTO caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- 2. Verify authorization: Must be admin or service_role
  IF caller_role IS NULL OR
     (caller_role NOT IN ('admin', 'superadmin') AND auth.role() != 'service_role') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- 3. Validate parameters
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount: must be positive';
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid target_user_id: cannot be null';
  END IF;

  -- 4. Update credits atomically
  UPDATE public.report_credits
  SET
    credits_available = credits_available + amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = target_user_id
  RETURNING credits_available INTO v_credits_available;

  -- 5. Record event
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

  -- 6. Record audit log (using resource_type instead of table_name)
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  )
  VALUES (
    auth.uid(),
    'grant_credits',
    'report_credits',
    target_user_id::TEXT,
    jsonb_build_object(
      'target_user_id', target_user_id,
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

-- Update function comment
COMMENT ON FUNCTION public.fn_grant_credits IS 'Admin-only function to grant credits to a user. Requires admin or superadmin role. Records event and audit log.';

-- Note: The function still has EXECUTE granted to authenticated,
-- but internal authorization check will prevent non-admin usage
