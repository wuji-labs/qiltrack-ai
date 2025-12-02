#!/usr/bin/env node

/**
 * Setup worktree-specific port via .env.local
 * This script should be run in each worktree after creation
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Get current branch name
const branch = execSync("git branch --show-current", { encoding: "utf-8" }).trim();

// Load port configuration
const portsConfig = require("./worktree-ports.json");
const port = portsConfig.ports[branch] || portsConfig.ports["main"];

console.log(`📍 Current branch: ${branch}`);
console.log(`🔌 Setting dev port to: ${port}`);

// Create .env.local with PORT setting
const envLocalPath = path.join(__dirname, "..", ".env.local");
let envContent = "";

// Read existing .env.local if it exists
if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, "utf-8");

  // Remove existing PORT line
  envContent = envContent
    .split("\n")
    .filter((line) => !line.startsWith("PORT="))
    .join("\n");
}

// Add PORT setting
envContent = `PORT=${port}\n${envContent}`.trim() + "\n";

// Write to .env.local
fs.writeFileSync(envLocalPath, envContent);

console.log("✅ Created/updated .env.local with PORT=" + port);
console.log("⚠️  Note: .env.local is gitignored and won't be committed.");
console.log("");
console.log("Now run: npm run dev");
console.log(`Server will start on http://localhost:${port}`);
