/**
 * 检查 Supabase Auth Redirect URLs 配置
 * 运行: node scripts/check-supabase-redirects.js
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const requiredUrls = [
  `${siteUrl}/api/auth/callback`,
  `${siteUrl}/account/reset-password`,
];

console.log('🔍 Checking Supabase Auth Redirect URLs...\n');
console.log('Current NEXT_PUBLIC_SITE_URL:', siteUrl);
console.log('\n✅ Required Redirect URLs in Supabase Dashboard:');
requiredUrls.forEach(url => console.log(`   - ${url}`));
console.log('\n📖 Configuration Path:');
console.log('   Supabase Dashboard → Authentication → URL Configuration → Redirect URLs');
console.log('\n⚠️  Make sure ALL above URLs are added to your Supabase project settings.');
