-- Migration: Initialize user credits to 30 for new and existing users
-- Purpose: Set initial credits to 30, add daily reward system, ensure all users have credits initialized
-- Data Protection: Idempotent with ON CONFLICT; no data deletion

-- 1. Update profiles default quota_limit from 1 to 30
ALTER TABLE public.profiles
  ALTER COLUMN quota_limit SET DEFAULT 30;

-- 2. Backfill existing users: if they don't have report_credits, create with 30 credits
INSERT INTO public.report_credits (user_id, credits_available, credits_used, created_at, updated_at)
SELECT
  p.id,
  30,  -- Initialize all users with 30 credits
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.report_credits rc WHERE rc.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Update trigger to initialize new users with 30 credits (instead of 5)
DROP TRIGGER IF EXISTS tr_init_report_credits_on_profile_insert ON public.profiles;

CREATE OR REPLACE FUNCTION public.fn_init_report_credits_for_profile_v2()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.report_credits (user_id, credits_available, credits_used)
  VALUES (NEW.id, 30, 0)  -- New users get 30 credits
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_init_report_credits_on_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.fn_init_report_credits_for_profile_v2();

-- 3.5 Update fn_initialize_profile to use 30 credits
CREATE OR REPLACE FUNCTION public.fn_initialize_profile(p_user_id UUID, p_email TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, plan, quota_limit, reports_used)
  VALUES (p_user_id, p_email, SPLIT_PART(p_email, '@', 1), 'free', 30, 0)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.report_credits (user_id, credits_available, credits_used)
  VALUES (p_user_id, 30, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.report_credit_events (user_id, event_type, credits_amount, reason, delta)
  VALUES (p_user_id, 'granted', 30, 'Initial signup bonus', 30)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create daily_rewards table to track daily credit claims
CREATE TABLE IF NOT EXISTS public.daily_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_claimed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  streak_count INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create function to claim daily reward (10 credits)
CREATE OR REPLACE FUNCTION public.fn_claim_daily_reward(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, remaining_credits INT) AS $$
DECLARE
  v_last_claimed TIMESTAMP WITH TIME ZONE;
  v_today TIMESTAMP WITH TIME ZONE;
  v_credits_available INT;
BEGIN
  v_today := CURRENT_DATE::TIMESTAMP WITH TIME ZONE AT TIME ZONE 'UTC';

  -- Check if user has already claimed today
  SELECT last_claimed INTO v_last_claimed
  FROM public.daily_rewards
  WHERE user_id = p_user_id;

  -- If user never claimed, create entry
  IF v_last_claimed IS NULL THEN
    INSERT INTO public.daily_rewards (user_id, last_claimed, streak_count)
    VALUES (p_user_id, v_today, 1);
  ELSIF v_last_claimed::DATE = v_today::DATE THEN
    -- User already claimed today
    RETURN QUERY SELECT FALSE, 'Already claimed today', 0;
    RETURN;
  ELSE
    -- Update claim time and streak (if within 1 day, increment streak; else reset)
    UPDATE public.daily_rewards
    SET
      last_claimed = v_today,
      streak_count = CASE
        WHEN (v_today - v_last_claimed) <= INTERVAL '1 day' THEN streak_count + 1
        ELSE 1
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
  END IF;

  -- Add 10 credits atomically
  UPDATE public.report_credits
  SET
    credits_available = credits_available + 10,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id
  RETURNING credits_available INTO v_credits_available;

  -- Record in audit event table
  INSERT INTO public.report_credit_events (
    user_id,
    event_type,
    credits_amount,
    reason,
    delta
  )
  VALUES (
    p_user_id,
    'daily_reward',
    10,
    'Daily reward claim',
    10
  );

  -- Return success
  RETURN QUERY SELECT TRUE, 'Daily reward claimed', COALESCE(v_credits_available, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create indexes for daily_rewards table
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON public.daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_last_claimed ON public.daily_rewards(last_claimed);

-- 7. Enable RLS on daily_rewards
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily rewards" ON public.daily_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage daily rewards" ON public.daily_rewards
  FOR ALL USING (auth.role() = 'service_role');

-- 8. Add report_credit_events columns if missing
ALTER TABLE public.report_credit_events
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS delta INT;

