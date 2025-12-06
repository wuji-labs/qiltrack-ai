-- Migration: Emergency fix for admin functions, role constraints, and report RLS
-- Date: 2025-12-05
-- Purpose: Fix multiple issues causing admin panel and report history failures

-- ========== Part 1: Fix is_admin() function to include super_admin ==========
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('super_admin', 'admin', 'editor')
  );
$$;

COMMENT ON FUNCTION public.is_admin IS 'Check if a user has super_admin, admin or editor role. Uses SECURITY DEFINER to bypass RLS.';

-- ========== Part 2: Fix profiles role constraint to include all roles ==========
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('super_admin', 'admin', 'developer', 'editor', 'user', 'guest'));

-- ========== Part 3: Fix report_posts RLS for user report history ==========

-- Allow users to read their own reports (regardless of status)
DROP POLICY IF EXISTS "Users can read their own reports" ON public.report_posts;
CREATE POLICY "Users can read their own reports" ON public.report_posts
  FOR SELECT USING (
    user_id = auth.uid()
    OR author_id = auth.uid()
    OR status = 'published'
    OR auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );

-- Drop old policy that was replaced
DROP POLICY IF EXISTS "Users can read their own drafts" ON public.report_posts;

-- Update admin read policy to use is_admin function
DROP POLICY IF EXISTS "Admins can read all report posts" ON public.report_posts;
CREATE POLICY "Admins can read all report posts" ON public.report_posts
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR author_id = auth.uid()
  );

-- Update admin update policy to include user_id owner
DROP POLICY IF EXISTS "Admins can update report posts" ON public.report_posts;
CREATE POLICY "Admins can update report posts" ON public.report_posts
  FOR UPDATE USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR author_id = auth.uid()
    OR user_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR author_id = auth.uid()
    OR user_id = auth.uid()
  );

-- Update admin insert policy to use is_admin function
DROP POLICY IF EXISTS "Admins can insert report posts" ON public.report_posts;
CREATE POLICY "Admins can insert report posts" ON public.report_posts
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );
