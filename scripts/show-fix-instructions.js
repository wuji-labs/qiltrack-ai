/**
 * 通过 Supabase Service Role 执行 SQL 修复 RLS
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function executeSql(sql) {
  console.log('执行 SQL...');
  console.log(sql.substring(0, 100) + '...\n');

  // 使用 Supabase 的 postgrest API 直接执行
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    console.log('❌ 请求失败，尝试备用方法...\n');
    return false;
  }

  return true;
}

async function fixRLS() {
  console.log('🔧 修复 RLS 无限递归问题\n');
  console.log('由于 Supabase REST API 限制，请手动执行以下步骤：\n');
  console.log('='.repeat(60));
  console.log('1. 访问 Supabase Dashboard');
  console.log('   https://supabase.com/dashboard/project/inmtounwqcjwsxkfnsfd/sql');
  console.log('');
  console.log('2. 在 SQL Editor 中执行以下 SQL:');
  console.log('='.repeat(60));
  console.log('');

  const sql = `
-- 1. 创建辅助函数
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

-- 3. 创建新策略
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can view their own report credits" ON public.report_credits
  FOR SELECT USING (
    auth.uid() = user_id OR auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can view their own credit events" ON public.report_credit_events
  FOR SELECT USING (
    auth.uid() = user_id OR auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can view their own report runs" ON public.report_runs
  FOR SELECT USING (
    auth.uid() = user_id OR auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete users" ON public.profiles
  FOR DELETE USING (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );
`;

  console.log(sql);
  console.log('');
  console.log('='.repeat(60));
  console.log('3. 点击 "RUN" 按钮执行');
  console.log('4. 刷新后台测试页面');
  console.log('='.repeat(60));
}

fixRLS();
