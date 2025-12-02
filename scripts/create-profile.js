/**
 * 为登录用户创建 profile
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

async function createMissingProfile() {
  const userId = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0';
  const email = 'xiuluart@foxmail.com';

  console.log('🔧 为用户创建 profile...\n');
  console.log('用户ID:', userId);
  console.log('邮箱:', email);
  console.log('');

  // 1. 检查是否已存在
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId);

  if (existing && existing.length > 0) {
    console.log('✅ Profile 已存在');
    console.log('当前角色:', existing[0].role);
    console.log('');

    if (existing[0].role !== 'admin') {
      console.log('更新为管理员...');
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

      if (error) {
        console.log('❌ 更新失败:', error.message);
      } else {
        console.log('✅ 已更新为管理员');
      }
    }
    return;
  }

  // 2. 创建 profile
  console.log('创建新 profile...');

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      role: 'admin',
      plan: 'annual',
      display_name: 'Admin User'
    })
    .select();

  if (error) {
    console.log('❌ 创建失败:', error.message);
    console.log('错误详情:', error);

    console.log('\n请在 Supabase Dashboard 手动执行:\n');
    console.log('='.repeat(60));
    console.log(`INSERT INTO public.profiles (id, email, role, plan, display_name)`);
    console.log(`VALUES ('${userId}', '${email}', 'admin', 'annual', 'Admin User');`);
    console.log('='.repeat(60));
  } else {
    console.log('✅ Profile 创建成功！');
    console.log(data);

    // 3. 创建积分记录
    console.log('\n创建积分记录...');
    const { error: creditError } = await supabase
      .from('report_credits')
      .insert({
        user_id: userId,
        credits_available: 30,
        credits_used: 0
      });

    if (creditError && creditError.code !== '23505') { // 忽略重复键错误
      console.log('⚠️  积分记录创建失败:', creditError.message);
    } else {
      console.log('✅ 积分记录创建成功');
    }
  }

  console.log('\n✅ 完成！请刷新测试页面。');
}

createMissingProfile();
