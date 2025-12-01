-- Migration: Add report_posts & user_report_uploads with admin roles and RLS
-- Purpose: Stage A backend: enable curated report posts, user uploads, and admin/editor roles
-- Safety: Idempotent ALTER/CREATE with IF NOT EXISTS guards; no data drops

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Add role column to profiles (admin/editor/user)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'editor', 'user'));
  END IF;
END;
$$;

UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL OR role = '';

-- 2) Create report_posts table for curated posts
CREATE TABLE IF NOT EXISTS public.report_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  body TEXT,
  cover TEXT,
  theme TEXT,
  tags TEXT[] DEFAULT '{}',
  lang TEXT DEFAULT 'en',
  status TEXT DEFAULT 'draft',
  version INT DEFAULT 1,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT report_posts_status_check CHECK (status IN ('draft', 'published'))
);

CREATE INDEX IF NOT EXISTS idx_report_posts_slug ON public.report_posts(slug);
CREATE INDEX IF NOT EXISTS idx_report_posts_status ON public.report_posts(status);
CREATE INDEX IF NOT EXISTS idx_report_posts_published_at ON public.report_posts(published_at DESC NULLS LAST);

-- 3) Create user_report_uploads table for user-submitted reports
CREATE TABLE IF NOT EXISTS public.user_report_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  note TEXT,
  file_path TEXT NOT NULL,
  version INT DEFAULT 1,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_report_uploads_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_user_report_uploads_user ON public.user_report_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_report_uploads_status ON public.user_report_uploads(status);
CREATE INDEX IF NOT EXISTS idx_user_report_uploads_created_at ON public.user_report_uploads(created_at DESC);

-- 4) Enable RLS and policies
ALTER TABLE public.report_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_report_uploads ENABLE ROW LEVEL SECURITY;

-- Helper expression for admin/editor role
-- (inline in policies to avoid dependency on custom function)
-- report_posts policies
DROP POLICY IF EXISTS "Public read published report posts" ON public.report_posts;
CREATE POLICY "Public read published report posts" ON public.report_posts
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins can read all report posts" ON public.report_posts;
CREATE POLICY "Admins can read all report posts" ON public.report_posts
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
    OR author_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can insert report posts" ON public.report_posts;
CREATE POLICY "Admins can insert report posts" ON public.report_posts
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can update report posts" ON public.report_posts;
CREATE POLICY "Admins can update report posts" ON public.report_posts
  FOR UPDATE USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
    OR author_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
    OR author_id = auth.uid()
  );

-- user_report_uploads policies
DROP POLICY IF EXISTS "Users can read their uploads" ON public.user_report_uploads;
CREATE POLICY "Users can read their uploads" ON public.user_report_uploads
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Users can insert their uploads" ON public.user_report_uploads;
CREATE POLICY "Users can insert their uploads" ON public.user_report_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update their uploads" ON public.user_report_uploads;
CREATE POLICY "Users can update their uploads" ON public.user_report_uploads
  FOR UPDATE USING (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can manage uploads" ON public.user_report_uploads;
CREATE POLICY "Admins can manage uploads" ON public.user_report_uploads
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can update any upload" ON public.user_report_uploads
  FOR UPDATE USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

-- 5) Refresh fn_initialize_profile to set role
DROP FUNCTION IF EXISTS fn_initialize_profile(UUID, TEXT);

CREATE OR REPLACE FUNCTION fn_initialize_profile(p_user_id UUID, p_email TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, plan, quota_limit, reports_used, role)
  VALUES (p_user_id, p_email, SPLIT_PART(p_email, '@', 1), 'free', 1, 0, 'user')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.report_credits (user_id, credits_available, credits_used)
  VALUES (p_user_id, 1, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.report_credit_events (user_id, event_type, credits_amount, reason)
  VALUES (p_user_id, 'granted', 1, 'Initial signup bonus');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
