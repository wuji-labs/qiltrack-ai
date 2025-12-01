#!/usr/bin/env node
/**
 * Apply migration 20251201000001_report_hub_refresh.sql to hosted Supabase
 * Uses Supabase REST API with service role key
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function executeSql(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

async function applyMigration() {
  console.log('📝 Reading migration file...\n');
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251201000001_report_hub_refresh.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('⚠️  Note: Supabase REST API does not support direct SQL execution.');
  console.log('📋 Migration must be applied manually via Supabase Dashboard SQL Editor.\n');
  console.log('Steps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/inmtounwqcjwsxkfnsfd/sql/new');
  console.log('2. Copy contents of: supabase/migrations/20251201000001_report_hub_refresh.sql');
  console.log('3. Paste and execute in SQL Editor\n');

  // Verify if functions already exist by checking popular endpoint
  console.log('🔍 Checking if migration already applied...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_get_popular_symbols`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ p_range_days: 30, p_limit: 5 })
    });

    if (res.ok) {
      console.log('✅ Migration appears to be already applied (fn_get_popular_symbols exists)');
      const data = await res.json();
      console.log(`   Found ${data.length} popular symbols`);
      return true;
    } else {
      const error = await res.json();
      console.log(`❌ Migration NOT applied: ${error.message}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Error checking migration status: ${err.message}`);
    return false;
  }
}

applyMigration()
  .then(applied => {
    if (!applied) {
      console.log('\n⚠️  Please apply migration manually and re-run tests');
      process.exit(1);
    }
    console.log('\n✅ Migration verification complete');
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
