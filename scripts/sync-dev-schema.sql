-- ============================================================
-- 开发环境 Schema 同步脚本 (完整版)
-- 将此脚本在开发环境 Supabase Dashboard > SQL Editor 中执行
-- ============================================================

-- 1. profiles 表补充字段
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. report_credits 表补充字段
ALTER TABLE public.report_credits
  ADD COLUMN IF NOT EXISTS bonus_credits INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMP WITH TIME ZONE;

-- 3. audit_logs 表补充字段
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS resource_type TEXT,
  ADD COLUMN IF NOT EXISTS resource_id TEXT;

-- 4. report_posts 表补充字段
ALTER TABLE public.report_posts
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS report_run_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'baseline';

-- 5. 创建 user_report_uploads 表 (如果不存在)
CREATE TABLE IF NOT EXISTS public.user_report_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. 启用 RLS
ALTER TABLE public.user_report_uploads ENABLE ROW LEVEL SECURITY;

-- 7. 创建 RLS 策略
DROP POLICY IF EXISTS "Users can view their own uploads" ON public.user_report_uploads;
CREATE POLICY "Users can view their own uploads" ON public.user_report_uploads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own uploads" ON public.user_report_uploads;
CREATE POLICY "Users can insert their own uploads" ON public.user_report_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage uploads" ON public.user_report_uploads;
CREATE POLICY "Service role can manage uploads" ON public.user_report_uploads
  FOR ALL USING (auth.role() = 'service_role');

-- 8. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_report_uploads_user_id ON public.user_report_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 9. 更新触发器：自动创建 profile 和 credits (如果不存在)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.report_credits (user_id, credits_available, credits_used, bonus_credits)
  VALUES (NEW.id, 30, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Admin 角色检查函数
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN user_role IN ('super_admin', 'admin', 'editor', 'developer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 添加 Admin RLS 策略
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all credits" ON public.report_credits;
CREATE POLICY "Admins can view all credits" ON public.report_credits
  FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update all credits" ON public.report_credits;
CREATE POLICY "Admins can update all credits" ON public.report_credits
  FOR UPDATE USING (public.is_admin());

-- 12. 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ Schema 同步完成！';
END $$;
