set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fn_cancel_membership(p_user_id uuid, p_immediate boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF p_immediate THEN
    -- Immediate cancellation
    UPDATE public.profiles
    SET
      plan = 'free',
      subscription_status = 'canceled',
      updated_at = NOW()
    WHERE id = p_user_id;

    UPDATE public.billing_subscriptions
    SET
      status = 'canceled',
      canceled_at = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'active';
  ELSE
    -- Cancel at period end
    UPDATE public.profiles
    SET
      subscription_status = 'canceled',
      updated_at = NOW()
    WHERE id = p_user_id;

    UPDATE public.billing_subscriptions
    SET
      status = 'canceled',
      updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'active';
  END IF;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (p_user_id, 'CANCEL_MEMBERSHIP', 'profiles', p_user_id::TEXT,
    jsonb_build_object('immediate', p_immediate));

  -- Notify user
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (p_user_id, 'system', 'Subscription Canceled',
    CASE WHEN p_immediate
      THEN 'Your subscription has been canceled immediately.'
      ELSE 'Your subscription will end at the current period.'
    END);

  RETURN jsonb_build_object('success', true, 'immediate', p_immediate);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_claim_daily_reward(p_user_id uuid)
 RETURNS TABLE(success boolean, message text, remaining_credits integer, streak_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_last_claimed DATE;
  v_today DATE := CURRENT_DATE;
  v_reward_amount INT;
  v_user_plan TEXT;
  v_new_balance INT;
  v_streak INT;
BEGIN
  -- Get user's plan to determine reward amount
  SELECT COALESCE(plan, 'free') INTO v_user_plan
  FROM public.profiles
  WHERE id = p_user_id;

  -- Set reward amount based on plan
  CASE v_user_plan
    WHEN 'ultra' THEN v_reward_amount := 60;
    WHEN 'pro' THEN v_reward_amount := 30;
    ELSE v_reward_amount := 10; -- free or unknown
  END CASE;

  -- Check last claim
  SELECT last_claimed_at::DATE, dr.streak_count INTO v_last_claimed, v_streak
  FROM public.daily_rewards dr
  WHERE dr.user_id = p_user_id;

  IF v_last_claimed = v_today THEN
    -- Already claimed today - return current balance
    SELECT COALESCE(credits_available, 0) INTO v_new_balance
    FROM public.report_credits
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT FALSE, 'Already claimed today'::TEXT, COALESCE(v_new_balance, 0), COALESCE(v_streak, 0);
    RETURN;
  END IF;

  -- Update streak
  IF v_last_claimed IS NULL THEN
    INSERT INTO public.daily_rewards (user_id, last_claimed_at, streak_count, total_claimed)
    VALUES (p_user_id, NOW(), 1, v_reward_amount);
    v_streak := 1;
  ELSIF v_last_claimed = v_today - 1 THEN
    UPDATE public.daily_rewards
    SET
      last_claimed_at = NOW(),
      streak_count = streak_count + 1,
      total_claimed = total_claimed + v_reward_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING daily_rewards.streak_count INTO v_streak;
  ELSE
    UPDATE public.daily_rewards
    SET
      last_claimed_at = NOW(),
      streak_count = 1,
      total_claimed = total_claimed + v_reward_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id;
    v_streak := 1;
  END IF;

  -- Add credits
  INSERT INTO public.report_credits (user_id, credits_available)
  VALUES (p_user_id, v_reward_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET
    credits_available = report_credits.credits_available + v_reward_amount,
    updated_at = NOW()
  RETURNING credits_available INTO v_new_balance;

  -- Record event (使用正确的表名 report_credit_events)
  INSERT INTO public.report_credit_events (user_id, event_type, delta, balance_after, reason, metadata)
  VALUES (
    p_user_id,
    'daily_reward',
    v_reward_amount,
    v_new_balance,
    'Daily check-in reward (' || v_user_plan || ' plan)',
    jsonb_build_object('streak', v_streak, 'plan', v_user_plan)
  );

  RETURN QUERY SELECT TRUE, format('Claimed %s credits (streak: %s)', v_reward_amount, v_streak), v_new_balance, v_streak;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_compute_report_hash(p_symbol text, p_language text, p_tone text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN MD5(LOWER(p_symbol) || '|' || LOWER(p_language) || '|' || LOWER(p_tone));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_consume_credit(p_user_id uuid, p_amount integer DEFAULT 1, p_symbol text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(success boolean, remaining_credits integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_available INT;
  v_new_balance INT;
BEGIN
  -- Lock and check
  SELECT credits_available INTO v_available
  FROM public.report_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_available IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'No credit record found'::TEXT;
    RETURN;
  END IF;

  IF v_available < p_amount THEN
    RETURN QUERY SELECT FALSE, v_available, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;

  -- Deduct
  v_new_balance := v_available - p_amount;

  UPDATE public.report_credits
  SET
    credits_available = v_new_balance,
    credits_used = credits_used + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record event
  INSERT INTO public.report_credit_events (user_id, event_type, delta, balance_after, reason, metadata)
  VALUES (
    p_user_id,
    'consumed',
    -p_amount,
    v_new_balance,
    COALESCE('Report: ' || p_symbol, 'Report generation'),
    p_metadata
  );

  -- Check low credit and send notification
  IF v_new_balance <= 5 AND v_new_balance > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (p_user_id, 'credit_low', 'Credits Running Low',
      'You have ' || v_new_balance || ' credits remaining. Consider upgrading your plan.',
      '/pricing')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY SELECT TRUE, v_new_balance, 'Success'::TEXT;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_find_reusable_report(p_symbol text, p_language text, p_tone text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, user_id uuid, symbol text, language text, tone text, content_md text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.id, r.user_id, r.symbol, r.language, r.tone, r.content_md, r.created_at
  FROM public.report_runs r
  WHERE r.symbol = p_symbol
    AND r.language = p_language
    AND r.tone = p_tone
    AND r.status = 'completed'
    AND r.content_md IS NOT NULL
    AND LENGTH(r.content_md) > 1000
    AND r.created_at > NOW() - INTERVAL '7 days'
    AND (p_user_id IS NULL OR r.user_id = p_user_id)
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_get_popular_symbols(p_limit integer DEFAULT 10, p_days integer DEFAULT 30)
 RETURNS TABLE(symbol text, count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.symbol, COUNT(*) as count
  FROM public.report_runs r
  WHERE r.created_at > NOW() - (p_days || ' days')::INTERVAL
    AND r.status = 'completed'
    AND r.symbol IS NOT NULL
  GROUP BY r.symbol
  ORDER BY count DESC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_get_user_identities()
 RETURNS TABLE(provider text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT i.provider::TEXT, i.created_at
  FROM auth.identities i
  WHERE i.user_id = auth.uid();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_grant_credits(p_target_user_id uuid, p_amount integer, p_reason text DEFAULT 'admin_grant'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_caller_role TEXT;
  v_new_balance INT;
BEGIN
  -- Verify admin permission
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role NOT IN ('super_admin', 'admin') THEN
    IF auth.role() != 'service_role' THEN
      RAISE EXCEPTION 'Unauthorized: Admin role required';
    END IF;
  END IF;

  -- Grant credits
  UPDATE public.report_credits
  SET
    credits_available = credits_available + p_amount,
    updated_at = NOW()
  WHERE user_id = p_target_user_id
  RETURNING credits_available INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    -- Create record if not exists
    INSERT INTO public.report_credits (user_id, credits_available, credits_used)
    VALUES (p_target_user_id, p_amount, 0)
    RETURNING credits_available INTO v_new_balance;
  END IF;

  -- Record event
  INSERT INTO public.report_credit_events (user_id, event_type, delta, balance_after, reason, metadata)
  VALUES (
    p_target_user_id,
    'granted',
    p_amount,
    v_new_balance,
    p_reason,
    jsonb_build_object('granted_by', COALESCE(auth.uid()::TEXT, 'system'))
  );

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'GRANT_CREDITS',
    'report_credits',
    p_target_user_id::TEXT,
    jsonb_build_object('amount', p_amount, 'reason', p_reason, 'new_balance', v_new_balance)
  );

  -- Notify user
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (p_target_user_id, 'system', 'Credits Added',
    'You have received ' || p_amount || ' credits. Reason: ' || p_reason);

  RETURN jsonb_build_object(
    'success', true,
    'credits_added', p_amount,
    'new_balance', COALESCE(v_new_balance, 0)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_initialize_profile(p_user_id uuid, p_email text, p_display_name text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_initial_credits INT := 30;
  v_referral_code TEXT;
BEGIN
  -- Generate referral code
  v_referral_code := 'REF' || UPPER(SUBSTRING(MD5(p_user_id::TEXT || NOW()::TEXT) FROM 1 FOR 8));

  -- Create profile
  INSERT INTO public.profiles (id, email, display_name, plan, role, subscription_status)
  VALUES (
    p_user_id,
    p_email,
    COALESCE(p_display_name, SPLIT_PART(p_email, '@', 1)),
    'free',
    'user',
    'inactive'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    updated_at = NOW();

  -- Create credits
  INSERT INTO public.report_credits (user_id, credits_available, credits_used)
  VALUES (p_user_id, v_initial_credits, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create referral entry
  INSERT INTO public.referrals (referrer_id, referral_code, status)
  VALUES (p_user_id, v_referral_code, 'pending')
  ON CONFLICT DO NOTHING;

  -- Record initial credits event
  INSERT INTO public.report_credit_events (user_id, event_type, delta, balance_after, reason)
  VALUES (p_user_id, 'granted', v_initial_credits, v_initial_credits, 'Initial signup bonus');

  -- Send welcome notification
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (p_user_id, 'welcome', 'Welcome to Qiltrack AI!', 'You have received ' || v_initial_credits || ' credits to get started.');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_upgrade_membership(p_user_id uuid, p_plan text, p_stripe_customer_id text, p_stripe_subscription_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_monthly_credits INT;
BEGIN
  -- Determine credits by plan
  v_monthly_credits := CASE p_plan
    WHEN 'pro' THEN 300
    WHEN 'annual' THEN 600
    ELSE 60
  END;

  -- Update profile
  UPDATE public.profiles
  SET
    plan = p_plan,
    subscription_status = 'active',
    stripe_customer_id = p_stripe_customer_id,
    stripe_subscription_id = p_stripe_subscription_id,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Set credits
  UPDATE public.report_credits
  SET
    credits_available = v_monthly_credits,
    last_reset_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record event
  INSERT INTO public.report_credit_events (user_id, event_type, delta, balance_after, reason, metadata)
  VALUES (
    p_user_id,
    'subscription_reset',
    v_monthly_credits,
    v_monthly_credits,
    format('Upgraded to %s plan', p_plan),
    jsonb_build_object('plan', p_plan, 'stripe_subscription_id', p_stripe_subscription_id)
  );

  -- Create/update subscription record
  INSERT INTO public.billing_subscriptions (user_id, stripe_customer_id, stripe_subscription_id, plan_id, status)
  VALUES (p_user_id, p_stripe_customer_id, p_stripe_subscription_id, p_plan, 'active')
  ON CONFLICT (stripe_subscription_id) DO UPDATE SET
    status = 'active',
    plan_id = p_plan,
    updated_at = NOW();

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (p_user_id, 'UPGRADE_MEMBERSHIP', 'profiles', p_user_id::TEXT,
    jsonb_build_object('plan', p_plan, 'credits', v_monthly_credits));

  -- Notify user
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (p_user_id, 'system', 'Subscription Activated',
    format('Your %s plan is now active! You have %s credits.', p_plan, v_monthly_credits));

  RETURN jsonb_build_object('success', true, 'plan', p_plan, 'credits', v_monthly_credits);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_user_has_password()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND encrypted_password IS NOT NULL
    AND encrypted_password != ''
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_active_users_count(days integer DEFAULT 7)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id)::INT
    FROM public.report_runs
    WHERE created_at > NOW() - (days || ' days')::INTERVAL
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  PERFORM public.fn_initialize_profile(
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(check_user_id, auth.uid())
    AND role IN ('super_admin', 'admin', 'editor')
  );
$function$
;

CREATE OR REPLACE FUNCTION public.match_reports_embeddings(query_embedding public.vector, match_threshold double precision DEFAULT 0.5, match_count integer DEFAULT 5)
 RETURNS TABLE(id uuid, report_run_id uuid, similarity double precision)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT e.id, e.report_run_id, 1 - (e.embedding <=> query_embedding) as similarity
  FROM public.reports_embeddings e
  WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;


