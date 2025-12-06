/**
 * 配置验证模块
 *
 * 在应用启动时检查必需的环境变量，避免运行时错误
 *
 * @module lib/config/validate
 */

interface ConfigValidation {
  key: string
  required: boolean
  validator?: (value: string) => boolean
  errorMessage?: string
}

/**
 * 必需的环境变量配置
 */
const requiredConfig: ConfigValidation[] = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    validator: (v) => v.startsWith('https://') || v.startsWith('http://127.0.0.1') || v.startsWith('http://localhost'),
    errorMessage: 'Must be a valid Supabase URL (https:// for production, http://127.0.0.1 or http://localhost for local)'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    validator: (v) => v.startsWith('sb_') || v.length > 100,
    errorMessage: 'Anon key must be a valid Supabase key (sb_... or JWT > 100 chars)'
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    validator: (v) => v.startsWith('sb_') || v.length > 100,
    errorMessage: 'Service role key must be a valid Supabase key (sb_... or JWT > 100 chars)'
  },
  {
    key: 'FINNHUB_API_KEY',
    required: true,
    validator: (v) => v.length > 10,
    errorMessage: 'API key seems invalid'
  },
  {
    key: 'NEXTAUTH_SECRET',
    required: true,
    validator: (v) => v.length >= 32,
    errorMessage: 'Must be at least 32 characters for security'
  },
  {
    key: 'NEXTAUTH_URL',
    required: true,
    validator: (v) => v.startsWith('http://') || v.startsWith('https://'),
    errorMessage: 'Must be a valid URL'
  },
  {
    key: 'STRIPE_SECRET_KEY',
    required: true,
    validator: (v) => v.startsWith('sk_'),
    errorMessage: 'Must be a valid Stripe secret key (starts with sk_)'
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    validator: (v) => v.startsWith('whsec_'),
    errorMessage: 'Must be a valid Stripe webhook secret (starts with whsec_)'
  },
  {
    key: 'STRIPE_PRICE_BASIC',
    required: true,
    validator: (v) => v.startsWith('price_'),
    errorMessage: 'Must be a valid Stripe price id (starts with price_)'
  },
  {
    key: 'STRIPE_PRICE_PRO',
    required: true,
    validator: (v) => v.startsWith('price_'),
    errorMessage: 'Must be a valid Stripe price id (starts with price_)'
  }
]

/**
 * LLM 提供商配置（至少需要一个）
 */
const llmProviders = [
  'HELICONE_API_KEY',
  'OPENROUTER_API_KEY'
]

/**
 * 可选的环境变量（会在缺失时给出警告）
 */
const optionalConfig: string[] = [
  'LANGFUSE_PUBLIC_KEY',
  'LANGFUSE_SECRET_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_SITE_URL'
]

/**
 * 简单的日志输出函数
 */
const logger = {
  info: (msg: string) => console.log(`[CONFIG] ℹ️  ${msg}`),
  warn: (msg: string) => console.warn(`[CONFIG] ⚠️  ${msg}`),
  error: (msg: string) => console.error(`[CONFIG] ❌ ${msg}`)
}

/**
 * 验证环境变量配置
 *
 * @throws {Error} 当必需的环境变量缺失或无效时抛出错误
 */
export function validateConfig(): void {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查必需变量
  for (const config of requiredConfig) {
    const value = process.env[config.key]

    if (!value) {
      errors.push(`Missing required environment variable: ${config.key}`)
      continue
    }

    if (config.validator && !config.validator(value)) {
      errors.push(
        `Invalid ${config.key}: ${config.errorMessage || 'Validation failed'}`
      )
    }
  }

  // 检查 LLM 提供商（至少需要一个）
  const hasLLMProvider = llmProviders.some(key => {
    const value = process.env[key]
    return value && value.length > 0
  })

  if (!hasLLMProvider) {
    errors.push(
      `At least one LLM provider required: ${llmProviders.join(' or ')}`
    )
  }

  // 检查可选变量（只给出警告）
  for (const key of optionalConfig) {
    if (!process.env[key]) {
      warnings.push(`Optional environment variable not set: ${key}`)
    }
  }

  // 如果有错误，输出并抛出异常
  if (errors.length > 0) {
    logger.error('Configuration validation failed:')
    errors.forEach(err => logger.error(`  - ${err}`))

    logger.info('')
    logger.info('Please check your .env.local file and ensure all required variables are set.')
    logger.info('You can copy .env.local.example as a template.')

    throw new Error(
      `Invalid configuration. ${errors.length} error(s) found. Check console for details.`
    )
  }

  // 输出警告信息（不阻止启动）
  if (warnings.length > 0) {
    warnings.forEach(warn => logger.warn(warn))
  }

  // 验证成功
  logger.info('✅ Configuration validated successfully')

  // 输出已配置的 LLM 提供商
  const configuredProviders = llmProviders.filter(key => !!process.env[key])
  logger.info(`📡 LLM Providers configured: ${configuredProviders.join(', ')}`)
}

/**
 * 获取当前配置摘要（用于调试）
 *
 * @returns 配置摘要对象
 */
export function getConfigSummary() {
  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    llm: {
      helicone: {
        enabled: !!process.env.HELICONE_API_KEY,
        model: process.env.HELICONE_MODEL || 'not set'
      },
      openrouter: {
        enabled: !!process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL || 'not set'
      }
    },
    marketData: {
      finnhub: !!process.env.FINNHUB_API_KEY
    },
    auth: {
      nextauthUrl: process.env.NEXTAUTH_URL,
      hasSecret: !!process.env.NEXTAUTH_SECRET
    },
    optional: {
      langfuse: !!process.env.LANGFUSE_PUBLIC_KEY,
      redis: !!process.env.UPSTASH_REDIS_REST_URL
    },
    stripe: {
      secret: !!process.env.STRIPE_SECRET_KEY,
      webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
      priceBasic: !!process.env.STRIPE_PRICE_BASIC,
      pricePro: !!process.env.STRIPE_PRICE_PRO
    }
  }
}
