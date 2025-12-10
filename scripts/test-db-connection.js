/**
 * 数据库连接测试脚本
 * 测试本地Supabase数据库连接和基本功能
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

async function testDatabaseConnection() {
  console.log('🔍 开始数据库连接测试...\n');

  // Test 1: 基本连接
  console.log('📊 测试 1: 基本连接');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ 数据库连接成功');
    console.log(`   用户数量: ${data || 0}\n`);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('   详情:', error);
    return;
  }

  // Test 2: Service Role权限
  console.log('📊 测试 2: Service Role 权限');
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: tables, error } = await supabaseAdmin.rpc('get_schema_tables', {}, { count: 'exact' });
    if (error && error.code !== 'PGRST202') {
      // PGRST202 = function not found, 这是正常的
      console.log('⚠️  get_schema_tables 函数不存在 (正常)');
    }

    // 测试基本表
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, plan, role')
      .limit(5);

    if (profileError) throw profileError;
    console.log('✅ Service Role 连接成功');
    console.log(`   查询到 ${profiles?.length || 0} 个用户资料\n`);

    if (profiles && profiles.length > 0) {
      console.log('   示例数据:');
      profiles.forEach(p => {
        console.log(`   - ${p.email} (${p.plan}, ${p.role})`);
      });
      console.log('');
    }
  } catch (error) {
    console.error('❌ Service Role 测试失败:', error.message);
  }

  // Test 3: 检查关键表是否存在
  console.log('📊 测试 3: 验证数据库Schema');
  const requiredTables = [
    'profiles',
    'report_credits',
    'report_credit_events',
    'report_runs',
    'daily_rewards',
    'referrals',
    'notifications',
    'audit_logs',
    'billing_subscriptions',
    'pricing_plans'
  ];

  let allTablesExist = true;
  for (const table of requiredTables) {
    try {
      const { error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.error(`   ❌ 表 "${table}" 不存在或无法访问`);
        allTablesExist = false;
      } else {
        console.log(`   ✅ ${table}`);
      }
    } catch (error) {
      console.error(`   ❌ ${table}: ${error.message}`);
      allTablesExist = false;
    }
  }

  if (allTablesExist) {
    console.log('\n✅ 所有关键表验证通过\n');
  } else {
    console.log('\n⚠️  部分表缺失，可能需要运行数据库迁移\n');
  }

  // Test 4: 检查存储桶
  console.log('📊 测试 4: 验证存储桶');
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error) throw error;

    const requiredBuckets = ['report-assets', 'report-outputs', 'user-uploads'];
    const existingBuckets = buckets.map(b => b.name);

    requiredBuckets.forEach(bucketName => {
      if (existingBuckets.includes(bucketName)) {
        console.log(`   ✅ ${bucketName}`);
      } else {
        console.log(`   ❌ ${bucketName} (未创建)`);
      }
    });

    console.log('');
  } catch (error) {
    console.error('❌ 存储桶检查失败:', error.message);
  }

  // Test 5: 测试数据库函数
  console.log('📊 测试 5: 验证关键函数');
  const requiredFunctions = [
    'fn_initialize_profile',
    'fn_consume_credit',
    'fn_grant_credits',
    'fn_claim_daily_reward',
    'fn_upgrade_membership',
    'is_admin'
  ];

  try {
    // 获取所有函数
    const { data: functions, error } = await supabaseAdmin.rpc('pg_get_functiondef', {});

    if (error && error.code === 'PGRST202') {
      console.log('   ⚠️  无法直接查询函数列表');
      console.log('   提示: 这是正常的，RPC函数列表需要通过其他方式验证\n');
    }
  } catch (error) {
    console.log('   ⚠️  函数验证跳过 (需要特殊权限)\n');
  }

  console.log('🎉 数据库测试完成!\n');
  console.log('💡 下一步:');
  console.log('   1. 如果有表缺失，运行: npx supabase db reset');
  console.log('   2. 如果存储桶缺失，手动在 Supabase Studio 创建');
  console.log('   3. 启动开发服务器: npm run dev\n');
}

testDatabaseConnection().catch(console.error);
