-- Migration: Fix infinite recursion in RLS policies
-- Date: 2025-12-02
-- Purpose: Replace recursive policy checks with a security definer function

-- Step 1: Create a function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'editor')
  );
$$;

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own report credits" ON public.report_credits;
DROP POLICY IF EXISTS "Users can view their own credit events" ON public.report_credit_events;
DROP POLICY IF EXISTS "Users can view their own report runs" ON public.report_runs;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON public.profiles;

-- Step 3: Create new policies using the function
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can view their own report credits" ON public.report_credits
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can view their own credit events" ON public.report_credit_events
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can view their own report runs" ON public.report_runs
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete users" ON public.profiles
  FOR DELETE USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );

-- Add comment
COMMENT ON FUNCTION public.is_admin IS 'Check if a user has admin or editor role. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';
