import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('Checking applied migrations...\n')

// Query schema_migrations table
const { data, error } = await supabase
  .from('schema_migrations')
  .select('version')
  .order('version', { ascending: true })

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

console.log('Applied migrations:')
data.forEach(m => console.log(`  ✓ ${m.version}`))

console.log(`\nTotal: ${data.length} migrations`)

// Check if unify_credits migration is applied
const hasUnifyCredits = data.some(m => m.version === '20251201000000')
console.log(`\n20251201000000_unify_credits_system: ${hasUnifyCredits ? '✅ APPLIED' : '❌ NOT APPLIED'}`)
