/**
 * 检查 Supabase Keys 格式
 *
 * 支持两种格式：
 * 1. 新版 Supabase (2024+): sb_publishable_* 和 sb_secret_* 前缀
 * 2. 传统 Supabase: eyJ* JWT 格式
 */

require('dotenv').config({ path: '.env.local' });

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 检查 Supabase Keys 格式\n');

/**
 * 检查 key 是否为有效格式
 * @param {string} key
 * @param {string} type 'anon' | 'service'
 * @returns {object} { valid: boolean, format: string }
 */
function checkKeyFormat(key, type) {
  if (!key) {
    return { valid: false, format: '未设置' };
  }

  // 新版 Supabase 格式 (2024+)
  if (type === 'anon' && key.startsWith('sb_publishable_')) {
    return { valid: true, format: '新版 Supabase (sb_publishable_*)' };
  }
  if (type === 'service' && key.startsWith('sb_secret_')) {
    return { valid: true, format: '新版 Supabase (sb_secret_*)' };
  }

  // 传统 JWT 格式
  if (key.startsWith('eyJ') && key.length > 100) {
    return { valid: true, format: '传统 JWT 格式' };
  }

  return { valid: false, format: '未知格式' };
}

const anonCheck = checkKeyFormat(anonKey, 'anon');
const serviceCheck = checkKeyFormat(serviceKey, 'service');

console.log('1. Anon Key:');
console.log('   长度:', anonKey?.length || 0);
console.log('   前缀:', anonKey?.substring(0, 20) || 'N/A');
console.log('   格式:', anonCheck.valid ? `✅ ${anonCheck.format}` : `❌ ${anonCheck.format}`);
console.log('');

console.log('2. Service Role Key:');
console.log('   长度:', serviceKey?.length || 0);
console.log('   前缀:', serviceKey?.substring(0, 20) || 'N/A');
console.log('   格式:', serviceCheck.valid ? `✅ ${serviceCheck.format}` : `❌ ${serviceCheck.format}`);
console.log('');

console.log('📝 说明:');
console.log('Supabase Keys 支持两种格式:');
console.log('  - 新版 (2024+): sb_publishable_* / sb_secret_* 前缀');
console.log('  - 传统: eyJ* JWT 格式, 长度 200-300 字符');
console.log('');

if (!anonCheck.valid || !serviceCheck.valid) {
  console.log('⚠️  警告: 你的 Supabase Keys 格式不正确！');
  console.log('');
  console.log('请按以下步骤获取正确的 Keys:');
  console.log('1. 登录 Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. 选择你的项目');
  console.log('3. 进入 Settings > API');
  console.log('4. 复制 "anon public" 和 "service_role" keys');
  console.log('5. 替换 .env.local 中的相应值');
  process.exit(1);
} else {
  console.log('✅ Supabase Keys 格式正确');
}
