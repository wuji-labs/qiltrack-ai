#!/usr/bin/env node

/**
 * Safely restart the dev server for this worktree only
 *
 * This script stops the current dev server (if running) and starts a new one.
 * It ONLY affects THIS worktree, not other worktrees.
 *
 * Usage:
 *   npm run dev:restart
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const pidFilePath = path.join(__dirname, "..", ".dev.pid");

console.log("🔄 Restarting dev server...\n");

// Step 1: Stop existing server if running
if (fs.existsSync(pidFilePath)) {
  console.log("⏹️  Stopping existing server...");
  try {
    execSync("node scripts/dev-stop.js", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });

    // Wait for stop to complete
    let attempts = 0;
    while (fs.existsSync(pidFilePath) && attempts < 10) {
      require("child_process").execSync("sleep 0.5 || timeout /t 1 >nul 2>&1", {
        shell: true,
      });
      attempts++;
    }

    if (fs.existsSync(pidFilePath)) {
      console.error("❌ Failed to stop server, PID file still exists");
      process.exit(1);
    }

    console.log("✅ Server stopped\n");
  } catch (e) {
    console.error("❌ Error stopping server:", e.message);
    process.exit(1);
  }
} else {
  console.log("ℹ️  No server is currently running\n");
}

// Step 2: Start new server
console.log("🚀 Starting new server...\n");
try {
  execSync("node scripts/dev-safe.js", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
} catch (e) {
  console.error("❌ Error starting server:", e.message);
  process.exit(1);
}
