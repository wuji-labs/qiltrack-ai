/**
 * 检查并修复重复的 profile 记录
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

async function checkDuplicates() {
  console.log('🔍 检查重复的 profile 记录...\n');

  const userId = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0';

  // 查询这个用户的所有记录
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId);

  if (error) {
    console.log('❌ 查询失败:', error.message);
    return;
  }

  console.log(`找到 ${data.length} 条记录:\n`);

  data.forEach((profile, index) => {
    console.log(`记录 ${index + 1}:`);
    console.log('  ID:', profile.id);
    console.log('  Email:', profile.email);
    console.log('  Role:', profile.role);
    console.log('  Plan:', profile.plan);
    console.log('  Created:', profile.created_at);
    console.log('');
  });

  if (data.length > 1) {
    console.log('⚠️  发现重复记录！');
    console.log('\n建议：删除旧记录，保留最新的一条');
    console.log('\n请在 Supabase Dashboard SQL Editor 执行以下 SQL:\n');
    console.log('='.repeat(60));

    // 找出最新的记录
    const sorted = [...data].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );
    const keepRecord = sorted[0];
    const deleteRecords = sorted.slice(1);

    console.log(`-- 保留最新记录 (created_at: ${keepRecord.created_at})`);
    console.log(`-- 删除 ${deleteRecords.length} 条旧记录\n`);

    // 先临时禁用 RLS
    console.log('-- 临时禁用 RLS 以便删除');
    console.log('ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;\n');

    deleteRecords.forEach((record, index) => {
      console.log(`-- 删除记录 ${index + 1} (created_at: ${record.created_at})`);
      console.log(`DELETE FROM public.profiles WHERE id = '${record.id}' AND created_at = '${record.created_at}';`);
    });

    console.log('\n-- 重新启用 RLS');
    console.log('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;\n');

    console.log(`-- 更新保留记录的角色为 admin`);
    console.log(`UPDATE public.profiles SET role = 'admin' WHERE id = '${keepRecord.id}' AND created_at = '${keepRecord.created_at}';\n`);

    console.log('='.repeat(60));
  } else if (data.length === 1) {
    console.log('✅ 没有重复记录');
    console.log(`\n当前角色: ${data[0].role}`);

    if (data[0].role !== 'admin') {
      console.log('\n⚠️  该用户不是管理员！');
      console.log('\n请执行以下 SQL 设置为管理员:\n');
      console.log('='.repeat(60));
      console.log(`UPDATE public.profiles SET role = 'admin' WHERE id = '${userId}';`);
      console.log('='.repeat(60));
    } else {
      console.log('✅ 该用户已经是管理员');
    }
  } else {
    console.log('❌ 用户不存在！');
  }
}

checkDuplicates();
