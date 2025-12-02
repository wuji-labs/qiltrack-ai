import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import pg from 'pg'

config()

// We need to use direct PostgreSQL connection to query supabase_migrations schema
// Supabase client doesn't expose it

const connectionString = `postgresql://postgres.inmtounwqcjwsxkfnsfd:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

const client = new pg.Client({ connectionString })

try {
  await client.connect()
  console.log('✓ Connected to database\n')

  const result = await client.query(`
    SELECT version, name, statements
    FROM supabase_migrations.schema_migrations
    ORDER BY version
  `)

  console.log('Applied migrations:')
  result.rows.forEach(m => {
    console.log(`  ✓ ${m.version} - ${m.name || '(unnamed)'}`)
  })

  console.log(`\nTotal: ${result.rows.length} migrations`)

  // Check for our migration
  const hasUnifyCredits = result.rows.some(m => m.version === '20251201000000')
  console.log(`\n20251201000000_unify_credits_system: ${hasUnifyCredits ? '✅ APPLIED' : '❌ NOT APPLIED'}`)

} catch (error) {
  console.error('Error:', error.message)
  console.log('\n⚠️  Note: You may need to set SUPABASE_DB_PASSWORD environment variable')
} finally {
  await client.end()
}
