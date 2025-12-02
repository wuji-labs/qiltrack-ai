/**
 * 查找邮箱对应的所有 profile
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function findProfilesByEmail() {
  const email = 'xiuluart@foxmail.com';
  const currentUserId = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0';

  console.log('🔍 查找邮箱相关的 profiles...\n');
  console.log('邮箱:', email);
  console.log('当前登录 User ID:', currentUserId);
  console.log('');

  // 按邮箱查询
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email);

  if (error) {
    console.log('❌ 查询失败:', error.message);
    return;
  }

  console.log(`找到 ${data.length} 条记录:\n`);

  data.forEach((profile, index) => {
    console.log(`记录 ${index + 1}:`);
    console.log('  ID:', profile.id);
    console.log('  Email:', profile.email);
    console.log('  Role:', profile.role || 'null');
    console.log('  Plan:', profile.plan || 'null');
    console.log('  Created:', profile.created_at);
    console.log('  是否匹配当前用户:', profile.id === currentUserId ? '✅ 是' : '❌ 否');
    console.log('');
  });

  if (data.length > 0) {
    const match = data.find(p => p.id === currentUserId);

    if (!match) {
      console.log('⚠️  当前登录的用户 ID 与 profiles 表中的不匹配！');
      console.log('');
      console.log('解决方案：更新 profiles 表中的 ID');
      console.log('');
      console.log('请在 Supabase Dashboard 执行:\n');
      console.log('='.repeat(60));
      console.log(`-- 备份旧 ID`);
      console.log(`-- 旧 ID: ${data[0].id}`);
      console.log(`-- 新 ID: ${currentUserId}\n`);
      console.log(`-- 更新 profile ID`);
      console.log(`UPDATE public.profiles`);
      console.log(`SET id = '${currentUserId}'`);
      console.log(`WHERE email = '${email}';\n`);
      console.log(`-- 设置为管理员`);
      console.log(`UPDATE public.profiles`);
      console.log(`SET role = 'admin'`);
      console.log(`WHERE id = '${currentUserId}';`);
      console.log('='.repeat(60));
    } else {
      console.log('✅ ID 匹配！');
      if (match.role !== 'admin') {
        console.log('但角色不是 admin，需要更新：');
        console.log('');
        console.log(`UPDATE public.profiles SET role = 'admin' WHERE id = '${currentUserId}';`);
      } else {
        console.log('✅ 角色也正确！应该可以正常工作了。');
      }
    }
  }
}

findProfilesByEmail();
