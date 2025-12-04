/**
 * Generate Supabase types only when the CLI is available.
 * In CI or when SKIP_DB_TYPES=1, this becomes a no-op to avoid failing jobs.
 */
const { spawnSync } = require("child_process");
const { writeFileSync } = require("fs");
const path = require("path");

const isCi = process.env.CI === "true";
const skip =
  process.env.SKIP_DB_TYPES === "1" ||
  process.env.SKIP_DB_TYPES === "true" ||
  process.env.DB_TYPES_GENERATE !== "1";

if (isCi || skip) {
  console.log("[db:types] Skipped (enable with DB_TYPES_GENERATE=1).");
  process.exit(0);
}

const cliCheck = spawnSync("supabase", ["--version"], { encoding: "utf-8" });

if (cliCheck.status !== 0) {
  console.warn("[db:types] Supabase CLI not found, skipping type generation.");
  process.exit(0);
}

console.log("[db:types] Supabase CLI detected, generating types...");

const result = spawnSync("supabase", ["gen", "types", "typescript", "--local"], {
  encoding: "utf-8",
});

if (result.status !== 0 || !result.stdout) {
  console.error("[db:types] Failed to generate types:", result.stderr || "unknown error");
  process.exit(result.status || 1);
}

const outputPath = path.join(process.cwd(), "types", "database.ts");
writeFileSync(outputPath, result.stdout);
console.log(`[db:types] Types written to ${outputPath}`);
