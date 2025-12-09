#!/usr/bin/env node

/**
 * Backup production database before deployment
 *
 * Usage:
 *   node scripts/backup-production-db.js
 *
 * This script will:
 * 1. Connect to production Supabase database
 * 2. Export all tables and data
 * 3. Save to backups/ directory with timestamp
 */

require("dotenv").config({ path: ".env.production" });
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Production database credentials
const PROD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROD_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PROD_SUPABASE_URL || !PROD_SERVICE_ROLE_KEY) {
  console.error("\n❌ 错误：缺少生产环境配置");
  console.error("请确保 .env.production 文件包含：");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY\n");
  process.exit(1);
}

// Ensure we're not backing up local database
if (PROD_SUPABASE_URL.includes("127.0.0.1") || PROD_SUPABASE_URL.includes("localhost")) {
  console.error("\n❌ 错误：检测到本地数据库URL");
  console.error("此脚本仅用于备份生产数据库！");
  console.error("当前 URL:", PROD_SUPABASE_URL);
  console.error("\n请检查 .env.production 配置\n");
  process.exit(1);
}

const TABLES_TO_BACKUP = [
  "profiles",
  "report_credits",
  "report_credit_events",
  "daily_rewards",
  "report_templates",
  "report_posts",
  "report_runs",
  "stock_market_data",
];

async function backupProductionDB() {
  console.log("\n🗄️  生产数据库备份工具");
  console.log("=" .repeat(60));
  console.log(`\n📡 连接到生产数据库: ${PROD_SUPABASE_URL}`);
  console.log("⚠️  这将备份生产环境的数据！\n");

  // Confirm backup
  console.log("按 Ctrl+C 取消，或按任意键继续...");
  await new Promise(resolve => {
    process.stdin.once("data", resolve);
  });

  const supabase = createClient(PROD_SUPABASE_URL, PROD_SERVICE_ROLE_KEY);

  // Create backup directory
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`✅ 创建备份目录: ${backupDir}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T").join("-").slice(0, 19);
  const backupFile = path.join(backupDir, `production-${timestamp}.json`);

  console.log(`\n📦 开始备份...\n`);

  const backup = {
    timestamp: new Date().toISOString(),
    source: PROD_SUPABASE_URL,
    tables: {},
  };

  let totalRows = 0;

  for (const table of TABLES_TO_BACKUP) {
    try {
      console.log(`   📋 备份表: ${table}...`);

      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact" });

      if (error) {
        console.warn(`   ⚠️  警告: ${table} - ${error.message}`);
        backup.tables[table] = {
          error: error.message,
          rows: [],
        };
        continue;
      }

      backup.tables[table] = {
        count: count || 0,
        rows: data || [],
      };

      totalRows += count || 0;
      console.log(`   ✅ ${table}: ${count || 0} 行`);
    } catch (err) {
      console.error(`   ❌ 错误: ${table} - ${err.message}`);
      backup.tables[table] = {
        error: err.message,
        rows: [],
      };
    }
  }

  // Save backup file
  console.log(`\n💾 保存备份文件...\n`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), "utf8");

  console.log("=" .repeat(60));
  console.log("✅ 备份完成！");
  console.log(`\n📊 备份统计:`);
  console.log(`   - 表数量: ${Object.keys(backup.tables).length}`);
  console.log(`   - 总行数: ${totalRows}`);
  console.log(`   - 文件位置: ${backupFile}`);
  console.log(`   - 文件大小: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`);
  console.log("\n⚠️  请妥善保管备份文件！\n");

  // Also create a metadata file
  const metadataFile = path.join(backupDir, `production-${timestamp}-metadata.txt`);
  const metadata = `
生产数据库备份
================

备份时间: ${new Date().toISOString()}
数据库URL: ${PROD_SUPABASE_URL}
备份文件: ${backupFile}

表统计:
${Object.entries(backup.tables).map(([table, info]) => {
    if (info.error) {
      return `  ${table}: 错误 - ${info.error}`;
    }
    return `  ${table}: ${info.count} 行`;
  }).join("\n")}

总行数: ${totalRows}

恢复命令:
  node scripts/restore-production-db.js ${backupFile}
`;

  fs.writeFileSync(metadataFile, metadata, "utf8");
  console.log(`📝 备份元数据: ${metadataFile}\n`);
}

backupProductionDB().catch((err) => {
  console.error("\n❌ 备份失败:", err.message);
  console.error(err);
  process.exit(1);
});
