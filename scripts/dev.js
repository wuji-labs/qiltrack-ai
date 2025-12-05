#!/usr/bin/env node

/**
 * Cross-platform dev server starter that reads PORT from .env.local
 *
 * This script allows each git worktree to have its own port configuration
 * without needing to modify package.json (which should stay in version control).
 *
 * Port is read from .env.local (gitignored) - set via: npm run worktree:setup-port
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Read PORT from .env.local
const envLocalPath = path.join(__dirname, "..", ".env.local");
let port = 3000;

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  const portMatch = envContent.match(/^PORT=(\d+)/m);
  if (portMatch) {
    port = portMatch[1];
  }
}

console.log(`Starting Next.js dev server on port ${port}...`);

// Spawn next dev with the port - use execPath to find next binary
const nextBin = path.join(__dirname, "..", "node_modules", ".bin", "next");
const isWindows = process.platform === "win32";
const nextCmd = isWindows ? nextBin + ".cmd" : nextBin;

const child = spawn(nextCmd, ["dev", "--port", String(port)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
  shell: true,
});

child.on("error", (err) => {
  console.error("Failed to start dev server:", err);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
