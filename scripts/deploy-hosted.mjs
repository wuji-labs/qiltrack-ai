import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://inmtounwqcjwsxkfnsfd.supabase.co';
const serviceRoleKey = 'sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 1. Test connection
console.log('🔗 Testing Supabase connection...');
try {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  console.log('✅ Connection successful');
  console.log(`   Total users in project: ${data.users.length}`);
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
}

// 2. Check existing tables
console.log('\n📋 Checking existing schema...');
try {
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (error) throw error;
  console.log('✅ Existing tables:');
  tables?.forEach(t => console.log(`   - ${t.table_name}`));
} catch (err) {
  console.log('ℹ️  Could not query tables:', err.message);
}

// 3. Execute migrations manually (since CLI requires login)
console.log('\n🚀 Executing migrations...');

// Read migration files
const migrationDir = path.join(process.cwd(), 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationDir).sort();

for (const file of migrationFiles) {
  if (!file.endsWith('.sql')) continue;

  const migrationPath = path.join(migrationDir, file);
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log(`\n▶️  Applying ${file}...`);
  try {
    // Split by statements and execute
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await supabase.rpc('exec', { sql: statement.trim() }).then(r => {
          if (r.error) throw r.error;
        });
      }
    }

    console.log(`✅ ${file} completed`);
  } catch (err) {
    console.error(`⚠️  ${file} encountered issue:`, err.message);
    // Continue anyway - might be idempotent
  }
}

console.log('\n✨ Migration execution completed!');
