#!/usr/bin/env node

/**
 * Fix cookie setting in all report API routes
 */

const fs = require('fs');
const path = require('path');

const files = [
  'app/api/report/route.ts',
  'app/api/report/availability/route.ts',
  'app/api/report/similar/route.ts',
  'app/api/report/popular/route.ts',
  'app/api/report/daily-reward/route.ts',
  'app/api/report/daily-reward/status/route.ts',
  'app/api/report/export/pdf/route.tsx',
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping ${filePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Add import at the top if not present
  if (!content.includes('import { appendCookies }')) {
    // Find the last import statement
    const importRegex = /import .+ from .+;/g;
    const imports = content.match(importRegex);
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      content = content.replace(
        lastImport,
        `${lastImport}\nimport { appendCookies } from "@/lib/utils/cookie-helper";`
      );
    }
  }

  // Replace all cookie setting patterns
  // Pattern 1: Multi-line forEach with .append
  const pattern1 = /responseCookies\.forEach\(\({ name, value }\) =>\s*\n?\s*response\.headers\.append\("Set-Cookie", `\$\{name\}=\$\{value\}`\)\s*\n?\s*\);/g;
  const pattern2 = /responseCookies\.forEach\(\({ name, value }\) => {\s*\n\s*response\.headers\.append\("Set-Cookie", `\$\{name\}=\$\{value\}`\);\s*\n\s*}\);/g;
  const pattern3 = /responseCookies\.forEach\(\({ name, value }\) =>\s*\n?\s*errorResponse\.headers\.append\("Set-Cookie", `\$\{name\}=\$\{value\}`\)\s*\n?\s*\);/g;
  const pattern4 = /responseCookies\.forEach\(\({ name, value }\) => {\s*\n\s*errorResponse\.headers\.append\("Set-Cookie", `\$\{name\}=\$\{value\}`\);\s*\n\s*}\);/g;

  content = content.replace(pattern1, 'appendCookies(response, responseCookies);');
  content = content.replace(pattern2, 'appendCookies(response, responseCookies);');
  content = content.replace(pattern3, 'appendCookies(errorResponse, responseCookies);');
  content = content.replace(pattern4, 'appendCookies(errorResponse, responseCookies);');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`✓  ${filePath} (already fixed or no changes needed)`);
  }
}

console.log('🔧 Fixing cookie setting in all report API routes...\n');

files.forEach(fixFile);

console.log('\n✨ Done!');
