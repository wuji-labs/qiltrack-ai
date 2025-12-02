import pg from 'pg'
import { config } from 'dotenv'

config()

// Construct connection string
// Format: postgresql://postgres.PROJECT_REF:PASSWORD@HOST:PORT/postgres
const host = 'aws-0-us-east-1.pooler.supabase.com'
const port = 6543
const projectRef = 'inmtounwqcjwsxkfnsfd'
const password = process.env.SUPABASE_DB_PASSWORD || 'NEED_PASSWORD'

const connectionString = `postgresql://postgres.${projectRef}:${password}@${host}:${port}/postgres`

console.log('🚀 Connecting to PostgreSQL directly...\n')

if (!process.env.SUPABASE_DB_PASSWORD) {
  console.error('❌ SUPABASE_DB_PASSWORD environment variable is required!')
  console.log('\nPlease add to .env.local:')
  console.log('  SUPABASE_DB_PASSWORD=your_database_password')
  console.log('\nGet password from: https://supabase.com/dashboard/project/inmtounwqcjwsxkfnsfd/settings/database')
  process.exit(1)
}

const client = new pg.Client({ connectionString })

try {
  await client.connect()
  console.log('✅ Connected to database\n')

  // Execute DROP COLUMN statements
  console.log('Executing: DROP COLUMN quota_limit...')
  await client.query('ALTER TABLE public.profiles DROP COLUMN IF EXISTS quota_limit;')
  console.log('✅ quota_limit dropped\n')

  console.log('Executing: DROP COLUMN reports_used...')
  await client.query('ALTER TABLE public.profiles DROP COLUMN IF EXISTS reports_used;')
  console.log('✅ reports_used dropped\n')

  // Verify
  console.log('Verifying columns...')
  const result = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
    ORDER BY column_name;
  `)

  const columns = result.rows.map(r => r.column_name)
  console.log('\nCurrent columns in profiles table:')
  columns.forEach(c => console.log(`  - ${c}`))

  const hasQuotaLimit = columns.includes('quota_limit')
  const hasReportsUsed = columns.includes('reports_used')

  if (hasQuotaLimit || hasReportsUsed) {
    console.log('\n❌ Verification failed! Columns still exist.')
    process.exit(1)
  }

  console.log('\n✅ SUCCESS! Columns have been dropped.')
  console.log('\nNext step: Regenerate types')
  console.log('  npx supabase gen types typescript --linked --schema public > types/database.ts')

} catch (error) {
  console.error('\n❌ Error:', error.message)
  process.exit(1)
} finally {
  await client.end()
}
