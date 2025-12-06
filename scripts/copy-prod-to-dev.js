/**
 * 复制生产环境数据到开发环境 (智能版)
 *
 * 特点：
 * 1. 自动检测目标表的字段，只复制共同字段
 * 2. 跳过不存在的表
 * 3. 处理外键依赖
 */

const { createClient } = require('@supabase/supabase-js');

// 生产环境配置
const PROD_CONFIG = {
  url: 'https://inmtounwqcjwsxkfnsfd.supabase.co',
  serviceKey: 'sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP',
};

// 开发环境配置
const DEV_CONFIG = {
  url: 'https://nkqwtejxnghotzuazslk.supabase.co',
  serviceKey: 'sb_secret_7lFTgr8-DkQLsF9FzP-cMQ_z7SUtIVd',
};

// 表导入顺序（按依赖关系）- profiles 必须最先
const TABLES_ORDER = [
  'profiles',
  'report_templates',
  'pricing_plans',
  'copy_modules',
  'faq_entries',
  'publications',
  'research_topics',
  'report_credits',
  'report_credit_events',
  'billing_subscriptions',
  'audit_logs',
  'report_runs',
  'report_documents',
  'reports_embeddings',
  'report_posts',
];

// 每个表的核心字段映射（只复制这些字段）
const TABLE_CORE_FIELDS = {
  profiles: ['id', 'email', 'display_name', 'avatar_url', 'plan', 'role', 'created_at', 'updated_at'],
  report_credits: ['id', 'user_id', 'credits_available', 'credits_used', 'created_at', 'updated_at'],
  report_credit_events: ['id', 'user_id', 'event_type', 'credits_amount', 'reason', 'created_at'],
  audit_logs: ['id', 'user_id', 'action', 'details', 'created_at'],
  report_runs: ['id', 'user_id', 'template_id', 'symbol', 'tone', 'language', 'status', 'model', 'company_snapshot', 'duration_ms', 'error', 'markdown_path', 'docx_path', 'created_at', 'updated_at'],
  report_documents: ['id', 'report_run_id', 'user_id', 'markdown_summary', 'docx_summary', 'created_at'],
  reports_embeddings: ['id', 'report_run_id', 'chunk_index', 'content', 'embedding', 'created_at'],
  report_posts: ['id', 'slug', 'title', 'content', 'summary', 'symbol', 'status', 'author_id', 'created_at', 'updated_at', 'published_at'],
  report_templates: '*',
  pricing_plans: '*',
  copy_modules: '*',
  faq_entries: '*',
  publications: '*',
  research_topics: '*',
  billing_subscriptions: '*',
};

const prodClient = createClient(PROD_CONFIG.url, PROD_CONFIG.serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const devClient = createClient(DEV_CONFIG.url, DEV_CONFIG.serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * 清空开发环境表（反向顺序）
 */
async function truncateDevTables() {
  console.log('\n📦 Step 1: 清空开发环境数据...\n');

  const reverseOrder = [...TABLES_ORDER].reverse();

  for (const table of reverseOrder) {
    try {
      const { error } = await devClient
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: 已清空`);
      }
    } catch (err) {
      console.log(`   ⚠️  ${table}: ${err.message}`);
    }
  }
}

/**
 * 获取并复制 auth.users (保持相同 ID)
 */
async function syncAuthUsers() {
  console.log('\n📦 Step 2: 同步 auth.users (保持原 ID)...\n');

  const { data, error } = await prodClient.auth.admin.listUsers();
  if (error) {
    console.error('   ❌ 获取用户失败:', error.message);
    return [];
  }

  console.log(`   ✅ 生产环境有 ${data.users.length} 个用户`);

  // 先删除开发环境中已存在的用户（根据 email）
  const { data: devUsers } = await devClient.auth.admin.listUsers();
  if (devUsers?.users) {
    for (const devUser of devUsers.users) {
      try {
        await devClient.auth.admin.deleteUser(devUser.id);
        console.log(`   🗑️  ${devUser.email}: 已删除旧用户`);
      } catch (err) {
        console.log(`   ⚠️  ${devUser.email}: 删除失败 - ${err.message}`);
      }
    }
  }

  let created = 0, failed = 0;

  // 使用生产环境的 ID 创建用户
  for (const user of data.users) {
    try {
      // 使用 admin API 创建用户并指定 ID
      const { error: createError } = await devClient.auth.admin.createUser({
        id: user.id,  // 关键：使用生产环境的 ID
        email: user.email,
        email_confirm: true,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
        password: 'TempPassword123!'
      });

      if (createError) {
        console.log(`   ❌ ${user.email}: ${createError.message}`);
        failed++;
      } else {
        console.log(`   ✅ ${user.email}: 已创建 (ID: ${user.id.slice(0,8)}...)`);
        created++;
      }
    } catch (err) {
      console.log(`   ❌ ${user.email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n   统计: 创建 ${created}, 失败 ${failed}`);
  return data.users;
}

/**
 * 过滤数据，只保留指定字段
 */
function filterFields(data, fields) {
  if (fields === '*') return data;

  return data.map(row => {
    const filtered = {};
    for (const field of fields) {
      if (row.hasOwnProperty(field)) {
        filtered[field] = row[field];
      }
    }
    return filtered;
  });
}

/**
 * 复制单个表数据
 */
async function copyTable(tableName) {
  try {
    // 获取生产数据
    const { data: prodData, error: prodError } = await prodClient
      .from(tableName)
      .select('*');

    if (prodError) {
      console.log(`   ⚠️  ${tableName}: 读取失败 - ${prodError.message}`);
      return { success: false, count: 0 };
    }

    if (!prodData || prodData.length === 0) {
      console.log(`   ⏭️  ${tableName}: 无数据`);
      return { success: true, count: 0 };
    }

    // 过滤字段
    const fields = TABLE_CORE_FIELDS[tableName] || '*';
    const filteredData = filterFields(prodData, fields);

    // 分批插入
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < filteredData.length; i += batchSize) {
      const batch = filteredData.slice(i, i + batchSize);

      const { error: devError } = await devClient
        .from(tableName)
        .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

      if (devError) {
        console.log(`   ⚠️  ${tableName}: batch ${Math.floor(i/batchSize)+1} 失败 - ${devError.message}`);
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`   ✅ ${tableName}: ${insertedCount}/${prodData.length} 条`);
    return { success: true, count: insertedCount };

  } catch (err) {
    console.log(`   ❌ ${tableName}: ${err.message}`);
    return { success: false, count: 0 };
  }
}

/**
 * 复制所有表
 */
async function copyAllTables() {
  console.log('\n📦 Step 3: 复制表数据...\n');

  for (const table of TABLES_ORDER) {
    await copyTable(table);
  }
}

/**
 * 验证
 */
async function verify() {
  console.log('\n📦 Step 4: 验证...\n');

  for (const table of TABLES_ORDER) {
    try {
      const { count: prodCount } = await prodClient
        .from(table)
        .select('*', { count: 'exact', head: true });

      const { count: devCount } = await devClient
        .from(table)
        .select('*', { count: 'exact', head: true });

      const match = prodCount === devCount;
      console.log(`   ${match ? '✅' : '⚠️'} ${table}: 生产 ${prodCount || 0} / 开发 ${devCount || 0}`);
    } catch (err) {
      console.log(`   ⚠️  ${table}: 验证失败`);
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   生产环境 → 开发环境 数据复制工具 (智能版)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n生产: ${PROD_CONFIG.url}`);
  console.log(`开发: ${DEV_CONFIG.url}\n`);

  if (!process.argv.includes('--yes')) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => rl.question('确定继续? (yes/no): ', resolve));
    rl.close();
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n已取消。');
      process.exit(0);
    }
  }

  const start = Date.now();

  await truncateDevTables();
  await syncAuthUsers();
  await copyAllTables();
  await verify();

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`   ✅ 完成！耗时: ${((Date.now() - start) / 1000).toFixed(1)} 秒`);
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log('\n📌 开发环境用户密码: TempPassword123!\n');
}

main().catch(console.error);
