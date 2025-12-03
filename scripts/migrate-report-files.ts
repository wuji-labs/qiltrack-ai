#!/usr/bin/env ts-node
/**
 * Migration script to generate and upload markdown and DOCX files for existing report_runs
 * Usage: npx ts-node scripts/migrate-report-files.ts
 */

import { createClient } from "@supabase/supabase-js";
import { generateDocxFromMarkdown } from "../lib/services/docx-generator";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFile(
  bucket: string,
  path: string,
  content: Buffer | string,
  contentType: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).upload(path, content, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.error(`Failed to upload ${path}:`, error.message);
      return false;
    }

    console.log(`✓ Uploaded ${path}`);
    return true;
  } catch (err) {
    console.error(`Error uploading ${path}:`, err);
    return false;
  }
}

async function migrateReportFiles() {
  console.log("🔄 Starting migration of report files...\n");

  // Get all report_runs with report_posts that have content
  const { data: reportRuns, error: runsError } = await supabase
    .from("report_runs")
    .select("id, symbol")
    .is("markdown_path", null);

  if (runsError || !reportRuns) {
    console.error("Failed to fetch report_runs:", runsError);
    process.exit(1);
  }

  console.log(`Found ${reportRuns.length} report_runs without file paths\n`);

  let successCount = 0;
  let failCount = 0;

  for (const run of reportRuns) {
    try {
      // Get corresponding report_posts content
      const { data: post, error: postError } = await supabase
        .from("report_posts")
        .select("body")
        .eq("report_run_id", run.id)
        .single();

      if (postError || !post?.body) {
        console.warn(`⚠ No content found for run ${run.id}`);
        failCount++;
        continue;
      }

      const markdownPath = `reports/${run.id}.md`;
      const docxPath = `reports/${run.id}.docx`;

      // Upload markdown
      const mdSuccess = await uploadFile(
        "report-outputs",
        markdownPath,
        post.body,
        "text/markdown"
      );

      if (!mdSuccess) {
        failCount++;
        continue;
      }

      // Generate and upload DOCX
      try {
        const docxBuffer = await generateDocxFromMarkdown(post.body, run.symbol);
        const docxSuccess = await uploadFile(
          "report-outputs",
          docxPath,
          docxBuffer,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );

        if (!docxSuccess) {
          failCount++;
          continue;
        }

        // Update report_runs record with file paths
        const { error: updateError } = await supabase
          .from("report_runs")
          .update({
            markdown_path: markdownPath,
            docx_path: docxPath,
          })
          .eq("id", run.id);

        if (updateError) {
          console.error(`Failed to update report_runs for ${run.id}:`, updateError);
          failCount++;
          continue;
        }

        console.log(`✅ Migrated report ${run.id} (${run.symbol})`);
        successCount++;
      } catch (docxErr) {
        console.error(`Failed to generate DOCX for ${run.id}:`, docxErr);
        failCount++;
      }
    } catch (err) {
      console.error(`Error processing run ${run.id}:`, err);
      failCount++;
    }
  }

  console.log(`\n📊 Migration complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Total: ${successCount + failCount}`);
}

// Run migration
migrateReportFiles().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
