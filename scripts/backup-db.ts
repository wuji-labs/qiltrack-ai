/**
 * Supabase 数据库备份脚本
 * 通过 API 导出所有表数据到 JSON 文件
 *
 * 使用方法: npx tsx scripts/backup-db.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const SUPABASE_URL = "https://inmtounwqcjwsxkfnsfd.supabase.co";
const SUPABASE_SERVICE_KEY = "sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP";

// 需要备份的表（按依赖顺序排列，恢复时按此顺序）
const TABLES = [
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

async function backup() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupDir = path.join(__dirname, `../backups/${timestamp}`);

  // 创建备份目录
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`📦 开始备份到: ${backupDir}\n`);

  const metadata: Record<string, number> = {};

  for (const table of TABLES) {
    try {
      // 获取所有数据（分页处理大表）
      let allData: unknown[] = [];
      let offset = 0;
      const pageSize = 1000;

      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.error(`❌ ${table}: ${error.message}`);
          break;
        }

        if (!data || data.length === 0) break;

        allData = allData.concat(data);
        offset += pageSize;

        if (data.length < pageSize) break;
      }

      // 保存到文件
      const filePath = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));

      metadata[table] = allData.length;
      console.log(`✅ ${table}: ${allData.length} 条记录`);
    } catch (err) {
      console.error(`❌ ${table}: ${err}`);
    }
  }

  // 保存元数据
  const metaPath = path.join(backupDir, "_metadata.json");
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        timestamp,
        tables: metadata,
        total: Object.values(metadata).reduce((a, b) => a + b, 0),
      },
      null,
      2
    )
  );

  console.log(`\n✨ 备份完成！共 ${Object.values(metadata).reduce((a, b) => a + b, 0)} 条记录`);
  console.log(`📁 备份位置: ${backupDir}`);
}

backup().catch(console.error);
