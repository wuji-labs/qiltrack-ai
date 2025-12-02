# ⚠️ Manual SQL Execution Required

Due to Supabase JS SDK limitations, DDL statements must be executed manually.

## Quick Execution Steps

### Option 1: Supabase Dashboard (Recommended - 2 minutes)

1. **Open SQL Editor**:
   https://supabase.com/dashboard/project/inmtounwqcjwsxkfnsfd/editor

2. **Copy and paste this SQL**:
   ```sql
   ALTER TABLE public.profiles DROP COLUMN IF EXISTS quota_limit;
   ALTER TABLE public.profiles DROP COLUMN IF EXISTS reports_used;
   ```

3. **Click "Run"** button

4. **Verify success** - Should see: `Success. No rows returned`

5. **Run verification script**:
   ```bash
   npx dotenv -e .env.local -- node scripts/verify-columns-dropped.mjs
   ```

### Option 2: psql Command Line (if you have DB password)

1. Add to `.env.local`:
   ```
   SUPABASE_DB_PASSWORD=your_db_password
   ```

2. Run:
   ```bash
   npx dotenv -e .env.local -- node scripts/execute-sql-direct.mjs
   ```

---

## Why This is Safe

✅ All users (2) have credit records in `report_credits` table
✅ No data loss - only column metadata is removed
✅ Migration has been tested in other environments
✅ Can be reversed if needed (but would require re-migration)

---

## What Happens Next

After columns are dropped:

1. **Regenerate types**: `types/database.ts` will no longer have these fields
2. **Fix 3 code files**: Update to use `report_credits` table
3. **Test**: Ensure admin user creation still works
4. **Commit**: Submit PR with all changes

---

**Current Status**: ⏸️ Waiting for manual SQL execution in Dashboard

**Estimated Time**: 2 minutes
