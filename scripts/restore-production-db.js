#!/usr/bin/env node

/**
 * Restore production database from backup
 *
 * Usage:
 *   node scripts/restore-production-db.js <backup-file.json>
 *
 * ⚠️ WARNING: This will overwrite data in production database!
 */

require("dotenv").config({ path: ".env.production" });
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const backupFile = process.argv[2];

if (!backupFile) {
  console.error("\n❌ 错误：请指定备份文件");
  console.error("\n用法:");
  console.error("  node scripts/restore-production-db.js backups/production-YYYYMMDD-HHMMSS.json\n");
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.error(`\n❌ 错误：备份文件不存在: ${backupFile}\n`);
  process.exit(1);
}

const PROD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROD_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PROD_SUPABASE_URL || !PROD_SERVICE_ROLE_KEY) {
  console.error("\n❌ 错误：缺少生产环境配置");
  console.error("请确保 .env.production 文件包含：");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY\n");
  process.exit(1);
}

async function restoreProductionDB() {
  console.log("\n🔄 生产数据库恢复工具");
  console.log("=" .repeat(60));
  console.log(`\n📡 目标数据库: ${PROD_SUPABASE_URL}`);
  console.log(`📂 备份文件: ${backupFile}`);

  // Load backup
  const backup = JSON.parse(fs.readFileSync(backupFile, "utf8"));

  console.log(`\n📅 备份时间: ${backup.timestamp}`);
  console.log(`📊 包含表: ${Object.keys(backup.tables).length}`);

  console.log("\n⚠️  警告: 这将覆盖生产数据库的数据！");
  console.log("⚠️  请确保你知道自己在做什么！\n");
  console.log("输入 'YES' 确认恢复，或按 Ctrl+C 取消：");

  // Wait for confirmation
  const confirmation = await new Promise(resolve => {
    process.stdin.once("data", data => {
      resolve(data.toString().trim());
    });
  });

  if (confirmation !== "YES") {
    console.log("\n❌ 恢复已取消\n");
    process.exit(0);
  }

  const supabase = createClient(PROD_SUPABASE_URL, PROD_SERVICE_ROLE_KEY);

  console.log(`\n🔄 开始恢复...\n`);

  let totalRestored = 0;

  for (const [table, tableData] of Object.entries(backup.tables)) {
    if (tableData.error || !tableData.rows || tableData.rows.length === 0) {
      console.log(`   ⏭️  跳过: ${table} (无数据)`);
      continue;
    }

    try {
      console.log(`   📋 恢复表: ${table} (${tableData.rows.length} 行)...`);

      // Delete existing data (optional - comment out if you want to keep existing data)
      // const { error: deleteError } = await supabase
      //   .from(table)
      //   .delete()
      //   .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      // Insert data in batches
      const batchSize = 100;
      for (let i = 0; i < tableData.rows.length; i += batchSize) {
        const batch = tableData.rows.slice(i, i + batchSize);

        const { error } = await supabase
          .from(table)
          .upsert(batch, { onConflict: "id" });

        if (error) {
          console.error(`   ❌ 错误: ${table} - ${error.message}`);
          break;
        }

        totalRestored += batch.length;
      }

      console.log(`   ✅ ${table}: 恢复 ${tableData.rows.length} 行`);
    } catch (err) {
      console.error(`   ❌ 错误: ${table} - ${err.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ 恢复完成！");
  console.log(`\n📊 恢复统计:`);
  console.log(`   - 总行数: ${totalRestored}`);
  console.log("\n⚠️  请验证数据完整性！\n");
}

restoreProductionDB().catch((err) => {
  console.error("\n❌ 恢复失败:", err.message);
  console.error(err);
  process.exit(1);
});
