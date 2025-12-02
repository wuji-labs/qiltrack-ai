/**
 * 配置验证测试脚本
 *
 * 用于测试配置验证模块的各种场景
 */

import { validateConfig, getConfigSummary } from '../lib/config/validate'

console.log('🧪 Testing Configuration Validation\n')
console.log('=' .repeat(50))

// Test 1: 正常情况测试
console.log('\n📝 Test 1: Validating current configuration...\n')

try {
  validateConfig()
  console.log('\n✅ Test 1 PASSED: Configuration is valid\n')

  // 显示配置摘要
  console.log('📊 Configuration Summary:')
  console.log(JSON.stringify(getConfigSummary(), null, 2))
} catch (error) {
  console.log('\n❌ Test 1 FAILED: Configuration is invalid')
  if (error instanceof Error) {
    console.log(`   Error: ${error.message}`)
  }
}

console.log('\n' + '=' .repeat(50))
console.log('🏁 Test complete\n')
