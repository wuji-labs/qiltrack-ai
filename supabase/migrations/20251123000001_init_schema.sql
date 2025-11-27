-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create auth.users reference (using Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email CITEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  quota_limit INT DEFAULT 1,
  reports_used INT DEFAULT 0,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  last_report_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report templates table
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  hero_image_url TEXT,
  sections JSONB,
  pills TEXT[] DEFAULT '{}',
  published_at TIMESTAMP WITH TIME ZONE,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User report credits
CREATE TABLE IF NOT EXISTS public.report_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_available INT DEFAULT 5,
  credits_used INT DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Report generation history
CREATE TABLE IF NOT EXISTS public.report_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.report_templates(id),
  symbol TEXT,
  tone TEXT,
  language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'processing',
  model TEXT,
  company_snapshot JSONB,
  duration_ms INT,
  error TEXT,
  markdown_path TEXT,
  docx_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report documents summary (for quick listing)
CREATE TABLE IF NOT EXISTS public.report_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES public.report_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  markdown_summary TEXT,
  docx_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Publications table
CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  published_date DATE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Research topics table
CREATE TABLE IF NOT EXISTS public.research_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FAQ entries (for content management)
CREATE TABLE IF NOT EXISTS public.faq_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  language TEXT DEFAULT 'en',
  order_index INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pricing plans (for content management)
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  quota_limit INT,
  features JSONB,
  call_to_action TEXT,
  language TEXT DEFAULT 'en',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Copy modules (for dynamic content like Hero, sections, etc)
CREATE TABLE IF NOT EXISTS public.copy_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_key TEXT UNIQUE NOT NULL,
  module_value JSONB,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billing subscriptions
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT,
  status TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report credit events (for tracking consumption)
CREATE TABLE IF NOT EXISTS public.report_credit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  credits_amount INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RPC Function: Initialize profile (called on signup)
CREATE OR REPLACE FUNCTION fn_initialize_profile(p_user_id UUID, p_email TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, plan, quota_limit, reports_used)
  VALUES (p_user_id, p_email, SPLIT_PART(p_email, '@', 1), 'free', 1, 0)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.report_credits (user_id, credits_available, credits_used)
  VALUES (p_user_id, 1, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.report_credit_events (user_id, event_type, credits_amount, reason)
  VALUES (p_user_id, 'granted', 1, 'Initial signup bonus');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: Consume report credit (returns table with success and remaining)
CREATE OR REPLACE FUNCTION fn_consume_report_credit(p_user_id UUID, p_symbol TEXT DEFAULT NULL, p_metadata JSONB DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, remaining INT) AS $$
DECLARE
  v_credits_available INT;
BEGIN
  SELECT credits_available INTO v_credits_available
  FROM public.report_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_credits_available IS NULL OR v_credits_available <= 0 THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_credits_available, 0);
    RETURN;
  END IF;

  UPDATE public.report_credits
  SET credits_used = credits_used + 1,
      credits_available = credits_available - 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;

  INSERT INTO public.report_credit_events (user_id, event_type, credits_amount, reason)
  VALUES (p_user_id, 'consumed', -1, COALESCE(p_symbol, 'Report generation'));

  RETURN QUERY SELECT TRUE, v_credits_available - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: Record report run
CREATE OR REPLACE FUNCTION fn_record_report_run(
  p_user_id UUID,
  p_template_id UUID,
  p_report_data JSONB,
  p_storage_path TEXT
)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
BEGIN
  INSERT INTO public.report_runs (user_id, template_id, report_data, storage_path)
  VALUES (p_user_id, p_template_id, p_report_data, p_storage_path)
  RETURNING id INTO v_report_id;

  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create materialized view for user quota (aggregated)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.v_user_quota AS
SELECT
  p.id,
  p.email,
  p.plan,
  p.quota_limit,
  p.reports_used,
  COALESCE(p.quota_limit + SUM(COALESCE(ce.credits_amount, 0)), p.quota_limit) AS remaining_quota
FROM public.profiles p
LEFT JOIN public.report_credit_events ce ON p.id = ce.user_id
GROUP BY p.id, p.email, p.plan, p.quota_limit, p.reports_used;

-- Create indexes for commonly queried columns
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_report_credits_user_id ON public.report_credits(user_id);
CREATE INDEX idx_report_runs_user_id ON public.report_runs(user_id);
CREATE INDEX idx_report_runs_created_at ON public.report_runs(created_at);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_billing_subscriptions_user_id ON public.billing_subscriptions(user_id);
CREATE INDEX idx_billing_subscriptions_stripe_id ON public.billing_subscriptions(stripe_subscription_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_credit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view their own report credits" ON public.report_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage report credits" ON public.report_credits
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update report credits" ON public.report_credits
  FOR UPDATE WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view their own report runs" ON public.report_runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert report runs" ON public.report_runs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update report runs" ON public.report_runs
  FOR UPDATE WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can read their own report documents" ON public.report_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage report documents" ON public.report_documents
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow public read access to templates" ON public.report_templates
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to publications" ON public.publications
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to research topics" ON public.research_topics
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to FAQ" ON public.faq_entries
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to pricing" ON public.pricing_plans
  FOR SELECT USING (published = true);

CREATE POLICY "Allow public read access to copy modules" ON public.copy_modules
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own subscriptions" ON public.billing_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.billing_subscriptions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update subscriptions" ON public.billing_subscriptions
  FOR UPDATE WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow audit log inserts" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Users can view audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage credit events" ON public.report_credit_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view their own credit events" ON public.report_credit_events
  FOR SELECT USING (auth.uid() = user_id);
