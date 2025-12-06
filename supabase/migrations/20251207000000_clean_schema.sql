-- ============================================================================
-- Qiltrack-AI Clean Database Schema
-- Created: 2024-12-07
-- Description: Complete database restructure with unified naming and new features
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- PART 1: Core Tables
-- ============================================================================

-- 1. profiles - User Profile
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email CITEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  -- Membership
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'annual', 'enterprise')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'canceled', 'trialing')),
  subscription_expires_at TIMESTAMPTZ,
  -- Role-based access
  role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'developer', 'editor', 'user', 'guest')),
  -- Stripe (denormalized for quick lookups)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  -- Tracking
  last_login_at TIMESTAMPTZ,
  last_report_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_plan ON profiles(plan);
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- 2. report_credits - User Credit Balance
CREATE TABLE public.report_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credits_available INT DEFAULT 30 NOT NULL,
  credits_used INT DEFAULT 0 NOT NULL,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_credits_user ON report_credits(user_id);

-- 3. report_credit_events - Credit Transaction History
CREATE TABLE public.report_credit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('consumed', 'granted', 'daily_reward', 'subscription_reset', 'refund', 'admin_adjustment', 'admin_grant', 'admin_deduct', 'admin_revoke', 'admin_reset')),
  delta INT NOT NULL,
  balance_after INT,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_events_user ON report_credit_events(user_id);
CREATE INDEX idx_credit_events_type ON report_credit_events(event_type);
CREATE INDEX idx_credit_events_created ON report_credit_events(created_at DESC);

-- 4. daily_rewards - Daily Reward Tracking
CREATE TABLE public.daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_claimed_at TIMESTAMPTZ DEFAULT NOW(),
  streak_count INT DEFAULT 1,
  total_claimed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_rewards_user ON daily_rewards(user_id);

-- 5. report_templates - Report Templates
CREATE TABLE public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  hero_image_url TEXT,
  sections JSONB,
  pills TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_templates_slug ON report_templates(slug);

-- 6. report_runs - Report Generation History
CREATE TABLE public.report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Report parameters (UNIFIED: use 'language' not 'lang')
  symbol TEXT NOT NULL,
  language TEXT DEFAULT 'en' NOT NULL,
  tone TEXT DEFAULT 'baseline' CHECK (tone IN ('baseline', 'buffett', 'musk', 'muddy')),
  mode TEXT DEFAULT 'production' CHECK (mode IN ('production', 'test', 'preview')),
  -- Generation status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled')),
  error TEXT,
  duration_ms INT,
  model TEXT,
  -- Content storage
  content_md TEXT,
  content_html TEXT,
  company_snapshot JSONB,
  meta JSONB DEFAULT '{}',
  -- File paths
  markdown_path TEXT,
  docx_path TEXT,
  pdf_path TEXT,
  -- Reuse tracking
  hash TEXT,
  reused_from_run_id UUID REFERENCES report_runs(id) ON DELETE SET NULL,
  -- Admin features
  is_featured BOOLEAN DEFAULT FALSE,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_runs_user ON report_runs(user_id);
CREATE INDEX idx_report_runs_symbol ON report_runs(symbol);
CREATE INDEX idx_report_runs_hash ON report_runs(hash) WHERE hash IS NOT NULL;
CREATE INDEX idx_report_runs_status ON report_runs(status);
CREATE INDEX idx_report_runs_created ON report_runs(created_at DESC);
CREATE INDEX idx_report_runs_featured ON report_runs(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_report_runs_reuse ON report_runs(symbol, language, tone, created_at DESC) WHERE status = 'completed';

-- 7. report_documents - Report Document Files
CREATE TABLE public.report_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_run_id UUID NOT NULL REFERENCES report_runs(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'markdown',
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_documents_run ON report_documents(report_run_id);

-- 8. reports_embeddings - Report Vector Embeddings
CREATE TABLE public.reports_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_run_id UUID NOT NULL REFERENCES report_runs(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  language TEXT,
  tone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_run_id, chunk_index)
);

CREATE INDEX idx_reports_embeddings_run ON reports_embeddings(report_run_id);

-- 9. report_posts - Published Reports (CMS)
-- UNIFIED: use user_id only (removed author_id), use language (removed lang)
CREATE TABLE public.report_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_run_id UUID UNIQUE REFERENCES report_runs(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Content
  slug TEXT UNIQUE NOT NULL,
  symbol TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  cover TEXT,
  theme TEXT,
  tags TEXT[] DEFAULT '{}',
  -- Settings (UNIFIED: use 'language' not 'lang')
  language TEXT DEFAULT 'en' NOT NULL,
  tone TEXT DEFAULT 'baseline' CHECK (tone IN ('baseline', 'buffett', 'musk', 'muddy')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version INT DEFAULT 1,
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_posts_slug ON report_posts(slug);
CREATE INDEX idx_report_posts_user ON report_posts(user_id);
CREATE INDEX idx_report_posts_status ON report_posts(status);
CREATE INDEX idx_report_posts_published ON report_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_report_posts_symbol ON report_posts(symbol) WHERE symbol IS NOT NULL;

-- 10. user_report_uploads - User Uploaded Reports
CREATE TABLE public.user_report_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  note TEXT,
  file_path TEXT NOT NULL,
  version INT DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_uploads_user ON user_report_uploads(user_id);
CREATE INDEX idx_user_uploads_status ON user_report_uploads(status);

-- 11. billing_subscriptions - Subscription Details
CREATE TABLE public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_user ON billing_subscriptions(user_id);
CREATE INDEX idx_billing_stripe_customer ON billing_subscriptions(stripe_customer_id);
CREATE INDEX idx_billing_stripe_sub ON billing_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_billing_status ON billing_subscriptions(status);

-- 12. audit_logs - Audit Trail
-- UNIFIED: use resource_type (removed table_name)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================================
-- PART 2: CMS Tables
-- ============================================================================

-- 13. pricing_plans - Pricing Plan Configuration
CREATE TABLE public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  quota_limit INT,
  features JSONB,
  call_to_action TEXT,
  language TEXT DEFAULT 'en',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. publications - Publications
CREATE TABLE public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  published_date DATE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. research_topics - Research Topics
CREATE TABLE public.research_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. faq_entries - FAQ Entries
CREATE TABLE public.faq_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  language TEXT DEFAULT 'en',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. copy_modules - Copy Modules
CREATE TABLE public.copy_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT UNIQUE NOT NULL,
  module_value JSONB,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 3: New Feature Tables
-- ============================================================================

-- 18. notifications - User Notifications (NEW)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_low', 'subscription_expiring', 'report_ready', 'system', 'referral', 'welcome')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- 19. referrals - Referral System (NEW)
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded', 'expired')),
  credits_awarded INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_referred ON referrals(referred_id) WHERE referred_id IS NOT NULL;

-- 20. report_feedback - Report Feedback (NEW)
CREATE TABLE public.report_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  report_run_id UUID REFERENCES report_runs(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  feedback_type TEXT CHECK (feedback_type IN ('quality', 'accuracy', 'usefulness', 'other')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_report ON report_feedback(report_run_id);
CREATE INDEX idx_feedback_user ON report_feedback(user_id);

-- 21. coupons - Discount Coupons (NEW)
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credits', 'discount_percent', 'discount_amount', 'free_trial')),
  value INT NOT NULL,
  max_uses INT,
  uses_count INT DEFAULT 0,
  min_plan TEXT,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active, valid_until);

-- 22. coupon_redemptions - Coupon Usage Tracking (NEW)
CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

CREATE INDEX idx_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX idx_redemptions_user ON coupon_redemptions(user_id);

-- ============================================================================
-- PART 4: Helper Functions
-- ============================================================================

-- is_admin: Unified admin check to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(check_user_id, auth.uid())
    AND role IN ('super_admin', 'admin', 'editor')
  );
$$;

-- update_updated_at: Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: Core RPC Functions
-- ============================================================================

-- fn_initialize_profile: Initialize user profile and credits
CREATE OR REPLACE FUNCTION public.fn_initialize_profile(
  p_user_id UUID,
  p_email TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- fn_consume_credit: Consume credits for report generation
CREATE OR REPLACE FUNCTION public.fn_consume_credit(
  p_user_id UUID,
  p_amount INT DEFAULT 1,
  p_symbol TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(success BOOLEAN, remaining_credits INT, message TEXT) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- fn_grant_credits: Admin grant credits to user
CREATE OR REPLACE FUNCTION public.fn_grant_credits(
  p_target_user_id UUID,
  p_amount INT,
  p_reason TEXT DEFAULT 'admin_grant'
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- fn_claim_daily_reward: Claim daily reward
CREATE OR REPLACE FUNCTION public.fn_claim_daily_reward(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, remaining_credits INT, streak_count INT) AS $$
DECLARE
  v_last_claimed DATE;
  v_today DATE := CURRENT_DATE;
  v_reward_amount INT := 30;
  v_new_balance INT;
  v_streak INT;
BEGIN
  -- Check last claim
  SELECT last_claimed_at::DATE, dr.streak_count INTO v_last_claimed, v_streak
  FROM public.daily_rewards dr
  WHERE dr.user_id = p_user_id;

  IF v_last_claimed = v_today THEN
    RETURN QUERY SELECT FALSE, 'Already claimed today'::TEXT, 0, COALESCE(v_streak, 0);
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
    RETURNING streak_count INTO v_streak;
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
  UPDATE public.report_credits
  SET
    credits_available = credits_available + v_reward_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING credits_available INTO v_new_balance;

  -- Record event
  INSERT INTO public.report_credit_events (user_id, event_type, delta, balance_after, reason, metadata)
  VALUES (
    p_user_id,
    'daily_reward',
    v_reward_amount,
    v_new_balance,
    'Daily reward claim',
    jsonb_build_object('streak', v_streak)
  );

  RETURN QUERY SELECT TRUE, format('Claimed %s credits (streak: %s)', v_reward_amount, v_streak), v_new_balance, v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- fn_upgrade_membership: Upgrade user membership (called by Stripe webhook)
CREATE OR REPLACE FUNCTION public.fn_upgrade_membership(
  p_user_id UUID,
  p_plan TEXT,
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- fn_cancel_membership: Cancel user membership
CREATE OR REPLACE FUNCTION public.fn_cancel_membership(
  p_user_id UUID,
  p_immediate BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- fn_user_has_password: Check if user has password set
CREATE OR REPLACE FUNCTION public.fn_user_has_password()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND encrypted_password IS NOT NULL
    AND encrypted_password != ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- fn_get_user_identities: Get user OAuth identities
CREATE OR REPLACE FUNCTION public.fn_get_user_identities()
RETURNS TABLE(provider TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT i.provider::TEXT, i.created_at
  FROM auth.identities i
  WHERE i.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- fn_compute_report_hash: Compute report hash for caching
CREATE OR REPLACE FUNCTION public.fn_compute_report_hash(
  p_symbol TEXT,
  p_language TEXT,
  p_tone TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN MD5(LOWER(p_symbol) || '|' || LOWER(p_language) || '|' || LOWER(p_tone));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- fn_find_reusable_report: Find reusable report within 7 days
CREATE OR REPLACE FUNCTION public.fn_find_reusable_report(
  p_symbol TEXT,
  p_language TEXT,
  p_tone TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  symbol TEXT,
  language TEXT,
  tone TEXT,
  content_md TEXT,
  created_at TIMESTAMPTZ
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- fn_get_popular_symbols: Get popular stock symbols
CREATE OR REPLACE FUNCTION public.fn_get_popular_symbols(
  p_limit INT DEFAULT 10,
  p_days INT DEFAULT 30
)
RETURNS TABLE(symbol TEXT, count BIGINT) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- get_active_users_count: Get count of active users in last N days
CREATE OR REPLACE FUNCTION public.get_active_users_count(
  days INT DEFAULT 7
)
RETURNS INT AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id)::INT
    FROM public.report_runs
    WHERE created_at > NOW() - (days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- match_reports_embeddings: Vector similarity search
CREATE OR REPLACE FUNCTION public.match_reports_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  report_run_id UUID,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.report_run_id, 1 - (e.embedding <=> query_embedding) as similarity
  FROM public.reports_embeddings e
  WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 6: Triggers
-- ============================================================================

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.fn_initialize_profile(
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update timestamps
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_report_credits_timestamp BEFORE UPDATE ON report_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_report_runs_timestamp BEFORE UPDATE ON report_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_report_posts_timestamp BEFORE UPDATE ON report_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_billing_subscriptions_timestamp BEFORE UPDATE ON billing_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_daily_rewards_timestamp BEFORE UPDATE ON daily_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_uploads_timestamp BEFORE UPDATE ON user_report_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PART 7: RLS Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_credit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_report_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_modules ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');
CREATE POLICY "profiles_insert_service" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (public.is_admin() OR auth.role() = 'service_role');

-- Report Credits RLS
CREATE POLICY "credits_select" ON public.report_credits
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "credits_insert_service" ON public.report_credits
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "credits_update_service" ON public.report_credits
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Report Credit Events RLS
CREATE POLICY "credit_events_select" ON public.report_credit_events
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "credit_events_insert_service" ON public.report_credit_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Daily Rewards RLS
CREATE POLICY "daily_rewards_select" ON public.daily_rewards
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "daily_rewards_insert_service" ON public.daily_rewards
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "daily_rewards_update_service" ON public.daily_rewards
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Report Runs RLS
CREATE POLICY "runs_select" ON public.report_runs
  FOR SELECT USING (user_id = auth.uid() OR is_featured = TRUE OR auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "runs_insert_service" ON public.report_runs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "runs_update" ON public.report_runs
  FOR UPDATE USING (auth.role() = 'service_role' OR public.is_admin())
  WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "runs_delete_admin" ON public.report_runs
  FOR DELETE USING (auth.role() = 'service_role' OR public.is_admin());

-- Report Documents RLS
CREATE POLICY "documents_select" ON public.report_documents
  FOR SELECT USING (auth.role() = 'service_role' OR public.is_admin() OR
    EXISTS (SELECT 1 FROM report_runs r WHERE r.id = report_run_id AND r.user_id = auth.uid()));
CREATE POLICY "documents_insert_service" ON public.report_documents
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Reports Embeddings RLS
CREATE POLICY "embeddings_select" ON public.reports_embeddings
  FOR SELECT USING (auth.role() = 'service_role' OR public.is_admin() OR
    EXISTS (SELECT 1 FROM report_runs r WHERE r.id = report_run_id AND r.user_id = auth.uid()));
CREATE POLICY "embeddings_insert_service" ON public.reports_embeddings
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Report Posts RLS
CREATE POLICY "posts_select_published" ON public.report_posts
  FOR SELECT USING (status = 'published');
CREATE POLICY "posts_select_own" ON public.report_posts
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "posts_insert" ON public.report_posts
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "posts_update" ON public.report_posts
  FOR UPDATE USING (user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "posts_delete" ON public.report_posts
  FOR DELETE USING (auth.role() = 'service_role' OR public.is_admin());

-- Report Templates RLS
CREATE POLICY "templates_select" ON public.report_templates FOR SELECT USING (true);
CREATE POLICY "templates_insert_admin" ON public.report_templates
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "templates_update_admin" ON public.report_templates
  FOR UPDATE USING (auth.role() = 'service_role' OR public.is_admin())
  WITH CHECK (auth.role() = 'service_role' OR public.is_admin());

-- User Report Uploads RLS
CREATE POLICY "uploads_select" ON public.user_report_uploads
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "uploads_insert" ON public.user_report_uploads
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');
CREATE POLICY "uploads_update" ON public.user_report_uploads
  FOR UPDATE USING (user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin());

-- Billing Subscriptions RLS
CREATE POLICY "billing_select" ON public.billing_subscriptions
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "billing_insert_service" ON public.billing_subscriptions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "billing_update_service" ON public.billing_subscriptions
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Audit Logs RLS
CREATE POLICY "audit_select_admin" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "audit_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR public.is_admin() OR auth.uid() = user_id);

-- Notifications RLS
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');
CREATE POLICY "notifications_insert_service" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Referrals RLS
CREATE POLICY "referrals_select" ON public.referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "referrals_insert_service" ON public.referrals
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "referrals_update_service" ON public.referrals
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Report Feedback RLS
CREATE POLICY "feedback_select" ON public.report_feedback
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "feedback_insert" ON public.report_feedback
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

-- Coupons RLS
CREATE POLICY "coupons_select" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "coupons_insert_admin" ON public.coupons
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "coupons_update_admin" ON public.coupons
  FOR UPDATE USING (auth.role() = 'service_role' OR public.is_admin())
  WITH CHECK (auth.role() = 'service_role' OR public.is_admin());

-- Coupon Redemptions RLS
CREATE POLICY "redemptions_select" ON public.coupon_redemptions
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin());
CREATE POLICY "redemptions_insert" ON public.coupon_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

-- CMS Tables (public read)
CREATE POLICY "pricing_plans_select" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "pricing_plans_modify_admin" ON public.pricing_plans FOR ALL USING (auth.role() = 'service_role' OR public.is_admin());

CREATE POLICY "publications_select" ON public.publications FOR SELECT USING (true);
CREATE POLICY "publications_modify_admin" ON public.publications FOR ALL USING (auth.role() = 'service_role' OR public.is_admin());

CREATE POLICY "research_topics_select" ON public.research_topics FOR SELECT USING (true);
CREATE POLICY "research_topics_modify_admin" ON public.research_topics FOR ALL USING (auth.role() = 'service_role' OR public.is_admin());

CREATE POLICY "faq_entries_select" ON public.faq_entries FOR SELECT USING (true);
CREATE POLICY "faq_entries_modify_admin" ON public.faq_entries FOR ALL USING (auth.role() = 'service_role' OR public.is_admin());

CREATE POLICY "copy_modules_select" ON public.copy_modules FOR SELECT USING (true);
CREATE POLICY "copy_modules_modify_admin" ON public.copy_modules FOR ALL USING (auth.role() = 'service_role' OR public.is_admin());

-- ============================================================================
-- PART 8: Storage Bucket
-- ============================================================================

-- Create report-assets bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-assets', 'report-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Create report-outputs bucket for report files (JSON, MD, PDF, DOCX)
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-outputs', 'report-outputs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for report-assets
CREATE POLICY "report_assets_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'report-assets' AND auth.role() = 'authenticated');
CREATE POLICY "report_assets_insert_service" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'report-assets' AND auth.role() = 'service_role');
CREATE POLICY "report_assets_update_service" ON storage.objects
  FOR UPDATE USING (bucket_id = 'report-assets' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'report-assets' AND auth.role() = 'service_role');
CREATE POLICY "report_assets_delete_service" ON storage.objects
  FOR DELETE USING (bucket_id = 'report-assets' AND auth.role() = 'service_role');

-- Storage RLS for report-outputs
CREATE POLICY "report_outputs_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'report-outputs' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));
CREATE POLICY "report_outputs_insert_service" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'report-outputs' AND auth.role() = 'service_role');
CREATE POLICY "report_outputs_update_service" ON storage.objects
  FOR UPDATE USING (bucket_id = 'report-outputs' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'report-outputs' AND auth.role() = 'service_role');
CREATE POLICY "report_outputs_delete_service" ON storage.objects
  FOR DELETE USING (bucket_id = 'report-outputs' AND auth.role() = 'service_role');

-- ============================================================================
-- PART 9: Grant Permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
