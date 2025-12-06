-- Migration: Update admin email domain from @investor.ai to @qiltrack.com
-- This migration updates RLS policies to use the new domain

-- Update RLS policies for report_runs
DROP POLICY IF EXISTS "Admins can view all report runs" ON public.report_runs;
DROP POLICY IF EXISTS "Admins can update report runs" ON public.report_runs;

CREATE POLICY "Admins can view all report runs" ON public.report_runs
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (plan = 'admin' OR email LIKE '%@qiltrack.com')
    )
  );

CREATE POLICY "Admins can update report runs" ON public.report_runs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (plan = 'admin' OR email LIKE '%@qiltrack.com')
    )
  );
