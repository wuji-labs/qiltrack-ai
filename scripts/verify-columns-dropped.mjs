import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Verifying columns have been dropped...\n')

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(1)
  .single()

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

const fields = Object.keys(data).sort()
const hasQuotaLimit = fields.includes('quota_limit')
const hasReportsUsed = fields.includes('reports_used')

console.log('Current fields in profiles table:')
fields.forEach(f => console.log(`  - ${f}`))

console.log('\nVerification:')
console.log(`  quota_limit: ${hasQuotaLimit ? '❌ STILL EXISTS' : '✅ REMOVED'}`)
console.log(`  reports_used: ${hasReportsUsed ? '❌ STILL EXISTS' : '✅ REMOVED'}`)

if (hasQuotaLimit || hasReportsUsed) {
  console.log('\n❌ Migration not completed! Please execute the SQL in Dashboard.')
  process.exit(1)
}

console.log('\n✅ Success! Columns have been dropped.')
console.log('\nNext step: Regenerate types with:')
console.log('  npx supabase gen types typescript --linked --schema public > types/database.ts')
