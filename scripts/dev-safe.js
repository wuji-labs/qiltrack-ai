#!/usr/bin/env node

/**
 * Safe dev server starter for worktree environments
 *
 * Features:
 * - Reads PORT from .env.local
 * - Saves PID to .dev.pid for safe process management
 * - Only manages its own process, won't affect other worktrees
 *
 * Usage:
 *   npm run dev:safe         # Start server
 *   npm run dev:stop         # Stop server
 *   npm run dev:restart      # Restart server
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Paths
const rootDir = path.join(__dirname, "..");
const envLocalPath = path.join(rootDir, ".env.local");
const pidFilePath = path.join(rootDir, ".dev.pid");

// Read PORT from .env.local
let port = 3000;
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  const portMatch = envContent.match(/^PORT=(\d+)/m);
  if (portMatch) {
    port = portMatch[1];
  }
}

// Check if server is already running
if (fs.existsSync(pidFilePath)) {
  const oldPid = fs.readFileSync(pidFilePath, "utf-8").trim();
  console.warn(`⚠️  Warning: Found existing PID file with PID ${oldPid}`);
  console.warn(`⚠️  Server might already be running. Run 'npm run dev:stop' first.`);

  // Check if process is actually running
  try {
    process.kill(oldPid, 0); // Signal 0 checks if process exists
    console.error(`❌ Server is already running on PID ${oldPid}`);
    console.error(`   Run 'npm run dev:stop' to stop it first.`);
    process.exit(1);
  } catch (e) {
    // Process doesn't exist, safe to clean up
    console.log(`   (Process ${oldPid} is not running, cleaning up stale PID file)`);
    fs.unlinkSync(pidFilePath);
  }
}

console.log(`🚀 Starting Next.js dev server on port ${port}...`);
console.log(`📍 Worktree-specific process (PID will be saved to .dev.pid)`);

// Find next binary
const nextBin = path.join(rootDir, "node_modules", ".bin", "next");
const isWindows = process.platform === "win32";
const nextCmd = isWindows ? nextBin + ".cmd" : nextBin;

// Spawn next dev
const child = spawn(nextCmd, ["dev", "--port", String(port)], {
  stdio: "inherit",
  cwd: rootDir,
  shell: true,
  detached: false, // Don't detach on Unix (we want Ctrl+C to work)
});

// Save PID immediately
fs.writeFileSync(pidFilePath, String(child.pid));
console.log(`✅ Server started with PID ${child.pid}`);
console.log(`   PID saved to .dev.pid for safe management\n`);

// Clean up PID file on exit
const cleanup = () => {
  if (fs.existsSync(pidFilePath)) {
    fs.unlinkSync(pidFilePath);
    console.log(`\n🧹 Cleaned up PID file`);
  }
};

child.on("error", (err) => {
  console.error("❌ Failed to start dev server:", err);
  cleanup();
  process.exit(1);
});

child.on("exit", (code) => {
  cleanup();
  process.exit(code || 0);
});

// Handle termination signals
process.on("SIGINT", () => {
  console.log("\n⏹️  Received SIGINT, stopping server...");
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  console.log("\n⏹️  Received SIGTERM, stopping server...");
  child.kill("SIGTERM");
});
