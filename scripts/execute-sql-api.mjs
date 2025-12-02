import { config } from 'dotenv'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PROJECT_REF = 'inmtounwqcjwsxkfnsfd'

// SQL to execute
const sql = `
ALTER TABLE public.profiles DROP COLUMN IF EXISTS quota_limit;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS reports_used;
`

console.log('🚀 Executing SQL via Supabase Management API...\n')
console.log('SQL:', sql)

// Use Supabase Management API to execute SQL
const response = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY
    },
    body: JSON.stringify({ query: sql })
  }
)

const data = await response.json()

if (!response.ok) {
  console.error('❌ Error:', data)
  console.log('\n⚠️  Fallback: Please execute SQL manually in Supabase Dashboard')
  console.log('URL: https://supabase.com/dashboard/project/inmtounwqcjwsxkfnsfd/editor')
  process.exit(1)
}

console.log('✅ SQL executed successfully!')
console.log('Response:', JSON.stringify(data, null, 2))

// Verify
console.log('\nVerifying...')
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(1)
  .single()

if (error) {
  console.error('Verification error:', error)
  process.exit(1)
}

const fields = Object.keys(profile)
console.log('Current fields:', fields)

const hasOldFields = fields.includes('quota_limit') || fields.includes('reports_used')
console.log(`\nResult: ${hasOldFields ? '❌ FAILED' : '✅ SUCCESS'}`)

if (!hasOldFields) {
  console.log('\n✅ Columns successfully dropped!')
  console.log('Next: Regenerate types with:')
  console.log('  npx supabase gen types typescript --linked --schema public > types/database.ts')
}
