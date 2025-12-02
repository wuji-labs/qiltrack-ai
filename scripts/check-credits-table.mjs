import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Check if report_credits table exists and has data
console.log('Checking report_credits table...\n')

const { data: credits, error: creditsError, count } = await supabase
  .from('report_credits')
  .select('*', { count: 'exact', head: false })
  .limit(3)

if (creditsError) {
  console.error('❌ Error querying report_credits:', creditsError.message)
  process.exit(1)
}

console.log(`✅ report_credits table exists`)
console.log(`   Total records: ${count}`)
console.log(`   Sample data:`)
console.log(JSON.stringify(credits, null, 2))

// Check profiles count
const { count: profilesCount, error: profilesError } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true })

if (profilesError) {
  console.error('❌ Error counting profiles:', profilesError.message)
  process.exit(1)
}

console.log(`\nProfiles count: ${profilesCount}`)
console.log(`Credits count: ${count}`)

if (profilesCount === count) {
  console.log('✅ All users have credit records - safe to proceed with migration')
} else {
  console.log(`⚠️  Mismatch: ${profilesCount - count} users missing credit records`)
  console.log('   Migration will create these records automatically')
}
