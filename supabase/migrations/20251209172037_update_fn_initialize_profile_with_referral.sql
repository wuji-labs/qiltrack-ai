-- Update fn_initialize_profile to support referral code
-- This migration evolves the 3-parameter function to 4-parameter version
-- Using CREATE OR REPLACE to properly update the function definition

-- Drop the old 3-parameter version to avoid "function is not unique" error
DROP FUNCTION IF EXISTS public.fn_initialize_profile(uuid, text, text);

CREATE OR REPLACE FUNCTION public.fn_initialize_profile(
  p_user_id uuid,
  p_email text,
  p_display_name text DEFAULT NULL,
  p_referral_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_initial_credits INT := 30;
  v_user_referral_code TEXT;
BEGIN
  -- Generate user's own referral code
  v_user_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || p_user_id::TEXT) FROM 1 FOR 8));

  -- Create profile
  INSERT INTO public.profiles (id, email, display_name, plan, role, subscription_status, referral_code)
  VALUES (
    p_user_id,
    p_email,
    COALESCE(p_display_name, SPLIT_PART(p_email, '@', 1)),
    'free',
    'user',
    'inactive',
    v_user_referral_code
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code),
    updated_at = NOW();

  -- Create credits record
  INSERT INTO public.report_credits (user_id, credits_available, credits_used)
  VALUES (p_user_id, v_initial_credits, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Record initial credits event
  INSERT INTO public.report_credit_events (user_id, event_type, delta, balance_after, reason)
  VALUES (p_user_id, 'granted', v_initial_credits, v_initial_credits, 'Initial signup bonus');

  -- Handle referral reward
  IF p_referral_code IS NOT NULL AND p_referral_code != '' THEN
    PERFORM fn_claim_referral_signup(p_user_id, p_referral_code);
  END IF;

  -- Send welcome notification
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    p_user_id, 'welcome', 'Welcome to Qiltrack AI!',
    'You have received ' || v_initial_credits || ' credits to get started.'
  );
END;
$$;
