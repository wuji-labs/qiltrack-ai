/**
 * 诊断 Supabase Client 差异
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 诊断 Supabase Client 配置差异\n');

// 1. 检查两种 client 创建方式
console.log('1. 检查 @supabase/ssr (新版 createClient)');
try {
  const { createBrowserClient } = require('@supabase/ssr');
  const client1 = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  console.log('   ✅ @supabase/ssr 可用');
  console.log('   Client type:', client1.constructor.name);
} catch (err) {
  console.log('   ❌ @supabase/ssr 不可用:', err.message);
}

console.log('');

console.log('2. 检查 @supabase/auth-helpers-nextjs (旧版)');
try {
  const { createClientComponentClient } = require('@supabase/auth-helpers-nextjs');
  console.log('   ✅ @supabase/auth-helpers-nextjs 可用');
} catch (err) {
  console.log('   ❌ @supabase/auth-helpers-nextjs 不可用:', err.message);
}

console.log('');

console.log('3. 检查 package.json 依赖');
const pkg = require('../package.json');
console.log('   依赖项:');
if (pkg.dependencies['@supabase/ssr']) {
  console.log('   ✅ @supabase/ssr:', pkg.dependencies['@supabase/ssr']);
}
if (pkg.dependencies['@supabase/auth-helpers-nextjs']) {
  console.log('   ✅ @supabase/auth-helpers-nextjs:', pkg.dependencies['@supabase/auth-helpers-nextjs']);
}
if (pkg.dependencies['@supabase/supabase-js']) {
  console.log('   ✅ @supabase/supabase-js:', pkg.dependencies['@supabase/supabase-js']);
}

console.log('');

console.log('📝 建议:');
console.log('问题可能是两个 client 使用不同的 cookie 存储机制');
console.log('');
console.log('解决方案选项:');
console.log('A. 统一使用 @supabase/ssr (推荐)');
console.log('   - 修改 hooks/useSupabaseAuth.ts 使用 createBrowserClient');
console.log('   - 修改 app/(auth)/login/page.tsx 使用相同的 client');
console.log('');
console.log('B. 统一使用 @supabase/auth-helpers-nextjs');
console.log('   - 修改 lib/supabase/client.ts 使用 createClientComponentClient');
console.log('   - 保持登录页面不变');
