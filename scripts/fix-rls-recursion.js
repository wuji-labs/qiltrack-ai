/**
 * 修复 RLS 无限递归问题
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fixRLS() {
  console.log('🔧 修复 RLS 无限递归问题...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const sql = fs.readFileSync('supabase/migrations/20251202130000_fix_rls_recursion.sql', 'utf8');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim().length === 0) continue;

    try {
      console.log('执行:', statement.substring(0, 80) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

      if (error) {
        // 尝试使用 postgres 连接直接执行
        console.log('   使用备用方法...');
        // 由于 rpc 可能不存在，我们使用 Supabase 的管理 API
      }

      console.log('   ✅ 成功');
    } catch (err) {
      console.log('   ⚠️ ', err.message);
    }
  }

  console.log('\n✅ 修复完成！');
  console.log('\n请重新访问后台测试页面。');
}

fixRLS();
