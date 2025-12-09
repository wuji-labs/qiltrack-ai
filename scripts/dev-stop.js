#!/usr/bin/env node

/**
 * Safely stop the dev server for this worktree only
 *
 * This script ONLY stops the process started by dev-safe.js in THIS worktree.
 * It will NOT affect other worktrees or other Node processes.
 *
 * Usage:
 *   npm run dev:stop
 */

const fs = require("fs");
const path = require("path");

const pidFilePath = path.join(__dirname, "..", ".dev.pid");

if (!fs.existsSync(pidFilePath)) {
  console.log("ℹ️  No dev server is running (no .dev.pid file found)");
  process.exit(0);
}

const pid = fs.readFileSync(pidFilePath, "utf-8").trim();

console.log(`⏹️  Stopping dev server with PID ${pid}...`);

try {
  // Check if process exists first
  process.kill(pid, 0);

  // Process exists, try to kill it gracefully
  try {
    process.kill(pid, "SIGTERM");
    console.log(`✅ Sent SIGTERM to process ${pid}`);

    // Wait a bit, then force kill if needed
    setTimeout(() => {
      try {
        process.kill(pid, 0);
        // Still running, force kill
        console.log(`⚠️  Process still running, force killing...`);
        process.kill(pid, "SIGKILL");
        console.log(`✅ Process ${pid} killed`);
      } catch (e) {
        // Process already stopped
        console.log(`✅ Process ${pid} has stopped`);
      }

      // Clean up PID file
      if (fs.existsSync(pidFilePath)) {
        fs.unlinkSync(pidFilePath);
        console.log(`🧹 Cleaned up .dev.pid file`);
      }
    }, 2000);
  } catch (e) {
    console.error(`❌ Failed to kill process ${pid}:`, e.message);
    process.exit(1);
  }
} catch (e) {
  // Process doesn't exist
  console.log(`ℹ️  Process ${pid} is not running (cleaning up stale PID file)`);
  fs.unlinkSync(pidFilePath);
  console.log(`🧹 Cleaned up .dev.pid file`);
}
