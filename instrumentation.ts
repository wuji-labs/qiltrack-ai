/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js when the server starts.
 * It's the perfect place to validate configuration before the app starts serving requests.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateConfig } = await import('./lib/config/validate')

    try {
      // Validate configuration on startup
      validateConfig()
    } catch (error) {
      // Log error and exit process
      console.error('\n❌ FATAL: Configuration validation failed\n')

      if (error instanceof Error) {
        console.error(error.message)
      }

      console.error('\n💡 To fix this:')
      console.error('   1. Copy .env.local.example to .env.local')
      console.error('   2. Fill in all required environment variables')
      console.error('   3. Restart the server\n')

      // Exit with error code in production
      if (process.env.NODE_ENV === 'production') {
        process.exit(1)
      }

      // In development, just throw the error to show in terminal
      throw error
    }
  }
}
