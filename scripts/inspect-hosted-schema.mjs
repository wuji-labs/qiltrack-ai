import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://inmtounwqcjwsxkfnsfd.supabase.co';
const serviceRoleKey = 'sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectSchema() {
  console.log('🔍 Inspecting Hosted schema...\n');

  // 1. Check report_documents structure
  console.log('📋 Checking report_documents columns:');
  try {
    const { data: cols, error } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'report_documents'
        ORDER BY ordinal_position
      `
    });
    if (error) throw error;
    console.log(JSON.stringify(cols, null, 2));
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // 2. Check report_documents row count
  console.log('\n📊 Checking report_documents row count:');
  try {
    const { count, error } = await supabase
      .from('report_documents')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    console.log(`   Total rows: ${count}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // 3. Check report_credit_events existence
  console.log('\n📋 Checking report_credit_events columns:');
  try {
    const { data: cols, error } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'report_credit_events'
        ORDER BY ordinal_position
      `
    });
    if (error) throw error;
    console.log(JSON.stringify(cols, null, 2));
  } catch (err) {
    console.error('❌ Table may not exist:', err.message);
  }

  // 4. Check v_user_quota view
  console.log('\n📋 Checking v_user_quota view:');
  try {
    const { data: rows, error } = await supabase
      .from('v_user_quota')
      .select('*')
      .limit(1);
    if (error) throw error;
    console.log(`   View exists, columns:`, Object.keys(rows[0] || {}));
  } catch (err) {
    console.error('⚠️  Error:', err.message);
  }

  // 5. Check fn_consume_report_credit function
  console.log('\n📋 Checking fn_consume_report_credit function:');
  try {
    const { data: procs, error } = await supabase.rpc('exec', {
      sql: `
        SELECT proname, pg_get_functiondef(oid) as definition
        FROM pg_proc
        WHERE proname = 'fn_consume_report_credit'
      `
    });
    if (error) throw error;
    console.log(`   Function exists:`, !!procs?.length);
  } catch (err) {
    console.error('⚠️  Error:', err.message);
  }

  console.log('\n✅ Schema inspection complete!');
}

inspectSchema().catch(console.error);
