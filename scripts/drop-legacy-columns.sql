-- Execute this SQL in Supabase Dashboard SQL Editor
-- Or use: psql $DATABASE_URL < this_file.sql

-- Step 1: Drop columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS quota_limit;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS reports_used;

-- Step 2: Add comment
COMMENT ON TABLE public.profiles IS 'User profiles. Credit management moved to report_credits table.';

-- Step 3: Verification query (run this separately to check)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'profiles'
-- ORDER BY column_name;
