import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

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

console.log('🚀 Executing SQL: Drop legacy columns from profiles table\n')

// Step 1: Verify data safety
console.log('Step 1: Verifying data safety...')
const { count: profilesCount } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true })

const { count: creditsCount } = await supabase
  .from('report_credits')
  .select('*', { count: 'exact', head: true })

console.log(`  Profiles: ${profilesCount}, Credits: ${creditsCount}`)

if (profilesCount !== creditsCount) {
  console.error('❌ Mismatch detected! Aborting.')
  process.exit(1)
}

console.log('  ✅ All users have credit records\n')

// Step 2: Execute SQL via REST API
// Note: Supabase client doesn't support arbitrary DDL, so we'll use a workaround
console.log('Step 2: Preparing SQL statement...')
const sql = `
DO $$
BEGIN
  -- Drop columns
  ALTER TABLE public.profiles DROP COLUMN IF EXISTS quota_limit;
  ALTER TABLE public.profiles DROP COLUMN IF EXISTS reports_used;

  -- Verify
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name IN ('quota_limit', 'reports_used')
  ) THEN
    RAISE EXCEPTION 'Failed to drop columns';
  END IF;

  RAISE NOTICE 'Successfully dropped columns';
END $$;
`

console.log('  SQL prepared\n')

console.log('⚠️  Manual action required:')
console.log('  1. Open Supabase Dashboard: https://supabase.com/dashboard/project/inmtounwqcjwsxkfnsfd/editor')
console.log('  2. Go to SQL Editor')
console.log('  3. Execute the following SQL:\n')
console.log('─'.repeat(80))
console.log(sql.trim())
console.log('─'.repeat(80))
console.log('\n  4. After execution, run: node scripts/verify-columns-dropped.mjs')
console.log('\n  (Supabase client cannot execute DDL directly via JS SDK)')
