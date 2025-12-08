/**
 * Supabase 数据库恢复脚本
 * 从备份的 JSON 文件恢复数据到数据库
 *
 * 使用方法: npx ts-node scripts/restore-db.ts [备份文件夹名]
 * 例如: npx ts-node scripts/restore-db.ts 2024-01-15T10-30-00
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// 配置
const SUPABASE_URL = "https://inmtounwqcjwsxkfnsfd.supabase.co";
const SUPABASE_SERVICE_KEY = "sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP";

// 恢复顺序（按依赖关系）
const RESTORE_ORDER = [
  "profiles",
  "pricing_plans",
  "coupons",
  "coupon_redemptions",
  "billing_subscriptions",
  "daily_rewards",
  "report_credits",
  "report_credit_events",
  "referrals",
  "report_runs",
  "report_documents",
  "report_posts",
  "report_feedback",
  "report_templates",
  "reports_embeddings",
  "notifications",
  "audit_logs",
  "faq_entries",
  "copy_modules",
  "publications",
  "research_topics",
  "user_report_uploads",
];

async function restore(backupFolder: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const backupDir = path.join(__dirname, "../backups", backupFolder);

  if (!fs.existsSync(backupDir)) {
    console.error(`❌ 备份文件夹不存在: ${backupDir}`);
    console.log("\n可用的备份:");
    const backupsRoot = path.join(__dirname, "../backups");
    if (fs.existsSync(backupsRoot)) {
      fs.readdirSync(backupsRoot).forEach((dir) => {
        console.log(`  - ${dir}`);
      });
    }
    process.exit(1);
  }

  console.log(`🔄 开始从 ${backupDir} 恢复数据...\n`);
  console.log("⚠️  警告: 这将使用 UPSERT 模式，已存在的数据会被覆盖！\n");

  // 等待 3 秒让用户确认
  await new Promise((resolve) => setTimeout(resolve, 3000));

  for (const table of RESTORE_ORDER) {
    const filePath = path.join(backupDir, `${table}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  ${table}: 跳过（无备份文件）`);
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      if (!data || data.length === 0) {
        console.log(`⏭️  ${table}: 跳过（空数据）`);
        continue;
      }

      // 分批插入（每批 100 条）
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        const { error } = await supabase.from(table).upsert(batch, {
          onConflict: "id",
          ignoreDuplicates: false,
        });

        if (error) {
          console.error(`❌ ${table}: ${error.message}`);
          break;
        }

        inserted += batch.length;
      }

      console.log(`✅ ${table}: 恢复 ${inserted} 条记录`);
    } catch (err) {
      console.error(`❌ ${table}: ${err}`);
    }
  }

  console.log("\n✨ 恢复完成！");
}

// 获取命令行参数
const backupFolder = process.argv[2];

if (!backupFolder) {
  console.log("使用方法: npx ts-node scripts/restore-db.ts [备份文件夹名]");
  console.log("\n可用的备份:");
  const backupsRoot = path.join(__dirname, "../backups");
  if (fs.existsSync(backupsRoot)) {
    fs.readdirSync(backupsRoot).forEach((dir) => {
      console.log(`  - ${dir}`);
    });
  } else {
    console.log("  (暂无备份)");
  }
  process.exit(1);
}

restore(backupFolder).catch(console.error);
