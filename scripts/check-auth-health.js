/**
 * 检查认证系统健康状态
 * 运行: node scripts/check-auth-health.js
 *
 * 用途:
 * - 开发环境：检查必需的环境变量是否配置
 * - CI/CD: 验证部署前的配置完整性
 * - 故障排查：快速定位配置问题
 */

const checks = [
  {
    name: 'Environment Variables',
    check: () => {
      const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
      const missing = required.filter(key => !process.env[key]);
      return missing.length === 0 ? 'OK' : `Missing: ${missing.join(', ')}`;
    }
  },
  {
    name: 'Redirect URL Configuration',
    check: () => {
      return process.env.NEXT_PUBLIC_SITE_URL ? 'OK' : 'Not configured (will use localhost)';
    }
  },
  {
    name: 'OAuth Providers',
    check: () => {
      const providers = [];
      if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) providers.push('Google');
      return providers.length > 0 ? `Configured: ${providers.join(', ')}` : 'None configured';
    }
  },
  {
    name: 'Supabase SSR Version',
    check: () => {
      try {
        const packageJson = require('../package.json');
        const version = packageJson.dependencies['@supabase/ssr'];
        return version ? `${version}` : 'Not found in dependencies';
      } catch {
        return 'package.json not found';
      }
    }
  }
];

console.log('🏥 Auth System Health Check\n');
checks.forEach(({ name, check }) => {
  const result = check();
  const icon = result === 'OK' || result.includes('Configured') || result.includes('^') ? '✅' : '⚠️';
  console.log(`${icon} ${name}: ${result}`);
});

// Exit with error code if critical checks fail
const criticalFailed = checks
  .filter(c => c.name === 'Environment Variables')
  .some(c => c.check().includes('Missing'));

if (criticalFailed) {
  console.log('\n❌ Critical checks failed. Please fix the issues above.');
  process.exit(1);
} else {
  console.log('\n✅ All critical checks passed.');
}
