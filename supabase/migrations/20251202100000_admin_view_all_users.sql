-- Migration: Allow admins to view all user profiles
-- Purpose: Enable admin dashboard to view and manage all users
-- Date: 2025-12-02

-- Step 1: Add role column to profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add role constraint
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

-- Set default role values
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL OR role = '';

-- Set xiuluart@icloud.com as admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'xiuluart@icloud.com';

-- Step 2: Drop existing policy that only allows viewing own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy that allows users to view their own profile OR admins to view all profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

-- Add policy to allow admins to view all report credits
DROP POLICY IF EXISTS "Users can view their own report credits" ON public.report_credits;

CREATE POLICY "Users can view their own report credits" ON public.report_credits
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

-- Add policy to allow admins to view all credit events
DROP POLICY IF EXISTS "Users can view their own credit events" ON public.report_credit_events;

CREATE POLICY "Users can view their own credit events" ON public.report_credit_events
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

-- Add policy to allow admins to view all report runs
DROP POLICY IF EXISTS "Users can view their own report runs" ON public.report_runs;

CREATE POLICY "Users can view their own report runs" ON public.report_runs
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

-- Add policy to allow admins to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Add policy to allow admins to delete users
DROP POLICY IF EXISTS "Admins can delete users" ON public.profiles;

CREATE POLICY "Admins can delete users" ON public.profiles
  FOR DELETE USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
