/**
 * 检查 Supabase Keys 格式
 */

require('dotenv').config({ path: '.env.local' });

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 检查 Supabase Keys 格式\n');

console.log('1. Anon Key:');
console.log('   长度:', anonKey?.length);
console.log('   前缀:', anonKey?.substring(0, 20));
console.log('   格式:', anonKey?.startsWith('eyJ') ? '✅ JWT 格式' : '❌ 不是 JWT');
console.log('');

console.log('2. Service Role Key:');
console.log('   长度:', serviceKey?.length);
console.log('   前缀:', serviceKey?.substring(0, 20));
console.log('   格式:', serviceKey?.startsWith('eyJ') ? '✅ JWT 格式' : '❌ 不是 JWT');
console.log('');

console.log('📝 说明:');
console.log('Supabase 的 Anon Key 和 Service Role Key 应该是 JWT token 格式');
console.log('通常长度在 200-300 字符左右，以 "eyJ" 开头');
console.log('');

if (!anonKey?.startsWith('eyJ') || !serviceKey?.startsWith('eyJ')) {
  console.log('⚠️  警告: 你的 Supabase Keys 格式不正确！');
  console.log('');
  console.log('请按以下步骤获取正确的 Keys:');
  console.log('1. 登录 Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. 选择项目: inmtounwqcjwsxkfnsfd');
  console.log('3. 进入 Settings > API');
  console.log('4. 复制 "anon public" 和 "service_role" keys');
  console.log('5. 替换 .env.local 中的相应值');
} else {
  console.log('✅ Keys 格式看起来正确');
}
