-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth.users reference (using Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
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
  content TEXT,
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
  report_data JSONB,
  storage_path TEXT,
  status TEXT DEFAULT 'completed', -- completed, failed
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

-- Billing subscriptions
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT,
  status TEXT, -- active, canceled, past_due
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
  event_type TEXT NOT NULL, -- consumed, granted, reset
  credits_amount INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RPC Function: Consume report credit
CREATE OR REPLACE FUNCTION fn_consume_report_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_credits_available INT;
BEGIN
  SELECT credits_available INTO v_credits_available
  FROM public.report_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_credits_available IS NULL OR v_credits_available <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.report_credits
  SET credits_used = credits_used + 1,
      credits_available = credits_available - 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;

  INSERT INTO public.report_credit_events (user_id, event_type, credits_amount, reason)
  VALUES (p_user_id, 'consumed', -1, 'Report generation');

  RETURN TRUE;
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

-- Create indexes
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
ALTER TABLE public.report_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_credit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to read/update their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to read their own report credits
CREATE POLICY "Users can view their own report credits" ON public.report_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to read their own report runs
CREATE POLICY "Users can view their own report runs" ON public.report_runs
  FOR SELECT USING (auth.uid() = user_id);

-- Public read access to templates, publications, research
CREATE POLICY "Allow public read access to templates" ON public.report_templates
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to publications" ON public.publications
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to research topics" ON public.research_topics
  FOR SELECT USING (true);

-- Audit logs - authenticated users can view, system can insert
CREATE POLICY "Allow audit log inserts" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to view audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id OR (SELECT auth.role() = 'authenticated'));
