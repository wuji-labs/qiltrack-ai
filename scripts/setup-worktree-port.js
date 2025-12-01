#!/usr/bin/env node

/**
 * Setup worktree-specific port in package.json
 * This script should be run in each worktree after creation
 * to set the correct dev port without committing to git
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get current branch name
const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();

// Load port configuration
const portsConfig = require('./worktree-ports.json');
const port = portsConfig.ports[branch] || portsConfig.ports['main'];

console.log(`📍 Current branch: ${branch}`);
console.log(`🔌 Setting dev port to: ${port}`);

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Update dev script
packageJson.scripts.dev = `next dev -p ${port}`;

// Write back to package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('✅ Port configured successfully!');
console.log('⚠️  Note: This change is for local development only. Do NOT commit package.json port changes.');

// Mark package.json as assumed unchanged (optional)
try {
  execSync('git update-index --skip-worktree package.json', { stdio: 'ignore' });
  console.log('✅ Marked package.json to skip port changes in git');
} catch (error) {
  console.log('⚠️  Could not mark package.json as skip-worktree (not critical)');
}
