-- ================================================
-- 修复 RLS 无限递归问题
-- 请在 Supabase Dashboard > SQL Editor 中执行此脚本
-- ================================================

-- 1. 创建辅助函数（绕过 RLS）
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

-- 2. 删除旧策略
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own report credits" ON public.report_credits;
DROP POLICY IF EXISTS "Users can view their own credit events" ON public.report_credit_events;
DROP POLICY IF EXISTS "Users can view their own report runs" ON public.report_runs;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON public.profiles;

-- 3. 创建新策略（使用函数，避免递归）
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
