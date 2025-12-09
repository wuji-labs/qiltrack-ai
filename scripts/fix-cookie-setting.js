#!/usr/bin/env node

/**
 * Fix cookie setting in report route
 */

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app', 'api', 'report', 'route.ts');
let content = fs.readFileSync(file, 'utf8');

// Add import at the top
if (!content.includes('import { appendCookies }')) {
  content = content.replace(
    /import { reportGenerationRateLimit, checkRateLimit } from "@\/lib\/api\/rate-limit";/,
    `import { reportGenerationRateLimit, checkRateLimit } from "@/lib/api/rate-limit";
import { appendCookies } from "@/lib/utils/cookie-helper";`
  );
}

// Replace all cookie setting patterns
const oldPattern = /responseCookies\.forEach\(\({ name, value }\) => \{\s*response\.headers\.append\("Set-Cookie", `\$\{name\}=\$\{value\}`\);\s*\}\);/g;
const newPattern = 'appendCookies(response, responseCookies);';

content = content.replace(oldPattern, newPattern);

fs.writeFileSync(file, content, 'utf8');

console.log('✅ Fixed cookie setting in report route');
