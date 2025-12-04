/**
 * Sync auth.users with profiles table
 * This script:
 * 1. Creates a trigger to auto-create profiles for new users
 * 2. Syncs any existing auth.users that don't have profiles
 */
import pg from 'pg';
import 'dotenv/config';

const client = new pg.Client({
  host: 'db.inmtounwqcjwsxkfnsfd.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || 'z/uHvR#5Bc-+gXB',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('[SYNC_USERS] Connecting to database...');
  await client.connect();
  console.log('[SYNC_USERS] Connected!');

  try {
    // Step 1: Drop existing trigger if exists
    console.log('[SYNC_USERS] Step 1: Dropping existing trigger...');
    await client.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    `);
    console.log('[SYNC_USERS] Existing trigger dropped.');

    // Step 2: Create new handle_new_user function
    console.log('[SYNC_USERS] Step 2: Creating handle_new_user function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Insert profile
        INSERT INTO public.profiles (id, email, display_name, plan, role, created_at, updated_at)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
          'free',
          'user',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
          updated_at = CURRENT_TIMESTAMP;

        -- Insert report_credits with 60 initial credits
        INSERT INTO public.report_credits (user_id, credits_available, credits_used, created_at, updated_at)
        VALUES (NEW.id, 60, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO NOTHING;

        -- Log the event
        INSERT INTO public.report_credit_events (user_id, event_type, credits_amount, reason, created_at)
        VALUES (NEW.id, 'granted', 60, 'Initial signup bonus', CURRENT_TIMESTAMP);

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('[SYNC_USERS] Function created.');

    // Step 3: Create trigger
    console.log('[SYNC_USERS] Step 3: Creating trigger on auth.users...');
    await client.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
    console.log('[SYNC_USERS] Trigger created.');

    // Step 4: Count existing users without profiles
    console.log('[SYNC_USERS] Step 4: Checking for users without profiles...');
    const orphanedResult = await client.query(`
      SELECT COUNT(*) as count
      FROM auth.users au
      WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
    `);
    const orphanedCount = parseInt(orphanedResult.rows[0].count);
    console.log(`[SYNC_USERS] Found ${orphanedCount} users without profiles.`);

    // Step 5: Sync profiles for existing users
    if (orphanedCount > 0) {
      console.log('[SYNC_USERS] Step 5: Creating profiles for orphaned users...');
      const insertResult = await client.query(`
        INSERT INTO public.profiles (id, email, display_name, plan, role, created_at, updated_at)
        SELECT
          au.id,
          au.email,
          COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)),
          'free',
          'user',
          COALESCE(au.created_at, CURRENT_TIMESTAMP),
          CURRENT_TIMESTAMP
        FROM auth.users au
        WHERE NOT EXISTS (
          SELECT 1 FROM public.profiles p WHERE p.id = au.id
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `);
      console.log(`[SYNC_USERS] Created ${insertResult.rowCount} new profiles.`);
    }

    // Step 6: Sync report_credits
    console.log('[SYNC_USERS] Step 6: Creating credit records for users without them...');
    const creditsResult = await client.query(`
      INSERT INTO public.report_credits (user_id, credits_available, credits_used, created_at, updated_at)
      SELECT
        p.id,
        60,
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM public.profiles p
      WHERE NOT EXISTS (
        SELECT 1 FROM public.report_credits rc WHERE rc.user_id = p.id
      )
      ON CONFLICT (user_id) DO NOTHING
      RETURNING user_id
    `);
    console.log(`[SYNC_USERS] Created ${creditsResult.rowCount} new credit records.`);

    // Step 7: Final stats
    console.log('[SYNC_USERS] Step 7: Final statistics...');
    const authUsersCount = await client.query('SELECT COUNT(*) FROM auth.users');
    const profilesCount = await client.query('SELECT COUNT(*) FROM public.profiles');
    const creditsCount = await client.query('SELECT COUNT(*) FROM public.report_credits');

    console.log('[SYNC_USERS] ===== SYNC COMPLETE =====');
    console.log(`[SYNC_USERS] auth.users: ${authUsersCount.rows[0].count}`);
    console.log(`[SYNC_USERS] profiles: ${profilesCount.rows[0].count}`);
    console.log(`[SYNC_USERS] report_credits: ${creditsCount.rows[0].count}`);
    console.log('[SYNC_USERS] New users will now automatically get profiles and credits!');

  } catch (err) {
    console.error('[SYNC_USERS] ERROR:', err);
    throw err;
  } finally {
    await client.end();
  }
}

run().catch(err => {
  console.error('[SYNC_USERS] Script failed:', err);
  process.exit(1);
});
