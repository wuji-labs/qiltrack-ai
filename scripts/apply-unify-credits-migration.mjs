import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

console.log('🚀 Applying migration: 20251201000000_unify_credits_system.sql\n')

// Read migration file
const migrationSQL = readFileSync('supabase/migrations/20251201000000_unify_credits_system.sql', 'utf8')

console.log('Migration content preview:')
console.log('...')
console.log(migrationSQL.substring(migrationSQL.indexOf('ALTER TABLE'), migrationSQL.indexOf('ALTER TABLE') + 200))
console.log('...\n')

// Apply migration using Supabase client
// Note: We use raw SQL execution via RPC
const { data, error } = await supabase.rpc('exec_sql', {
  sql: migrationSQL
})

if (error) {
  console.error('❌ Migration failed:', error.message)
  console.error('\nTrying alternative method: Direct column drop...\n')

  // Try dropping columns directly
  const dropQuotaLimit = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE public.profiles DROP COLUMN IF EXISTS quota_limit;'
  })

  if (dropQuotaLimit.error) {
    console.error('Failed to drop quota_limit:', dropQuotaLimit.error.message)
  } else {
    console.log('✅ Dropped quota_limit column')
  }

  const dropReportsUsed = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE public.profiles DROP COLUMN IF EXISTS reports_used;'
  })

  if (dropReportsUsed.error) {
    console.error('Failed to drop reports_used:', dropReportsUsed.error.message)
  } else {
    console.log('✅ Dropped reports_used column')
  }

  process.exit(1)
}

console.log('✅ Migration applied successfully!')
console.log('\nVerifying...')

// Verify by checking table structure
const { data: profileSample, error: verifyError } = await supabase
  .from('profiles')
  .select('*')
  .limit(1)
  .single()

if (verifyError) {
  console.error('❌ Verification failed:', verifyError.message)
  process.exit(1)
}

const fields = Object.keys(profileSample)
const hasQuotaLimit = fields.includes('quota_limit')
const hasReportsUsed = fields.includes('reports_used')

console.log(`\nquota_limit: ${hasQuotaLimit ? '❌ STILL EXISTS' : '✅ REMOVED'}`)
console.log(`reports_used: ${hasReportsUsed ? '❌ STILL EXISTS' : '✅ REMOVED'}`)

if (!hasQuotaLimit && !hasReportsUsed) {
  console.log('\n✅ Migration verified successfully!')
  console.log('\nNext step: Regenerate types with:')
  console.log('  npx supabase gen types typescript --linked --schema public > types/database.ts')
} else {
  console.log('\n⚠️  Migration verification failed - old columns still exist')
  process.exit(1)
}
