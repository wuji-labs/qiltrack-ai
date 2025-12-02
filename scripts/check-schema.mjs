import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Check profiles table structure by fetching one row
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(1)

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

if (data && data.length > 0) {
  console.log('Profiles table fields:')
  console.log(Object.keys(data[0]).sort())

  // Check for old fields
  const hasQuotaLimit = 'quota_limit' in data[0]
  const hasReportsUsed = 'reports_used' in data[0]

  console.log('\nOld fields check:')
  console.log(`  quota_limit: ${hasQuotaLimit ? '❌ STILL EXISTS' : '✅ REMOVED'}`)
  console.log(`  reports_used: ${hasReportsUsed ? '❌ STILL EXISTS' : '✅ REMOVED'}`)

  if (hasQuotaLimit || hasReportsUsed) {
    console.log('\n⚠️  Migration 20251201000000_unify_credits_system.sql has NOT been applied!')
    process.exit(1)
  } else {
    console.log('\n✅ Migration completed successfully!')
  }
} else {
  console.log('No users found in profiles table')
}
