const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

let totalReplacements = 0;

files.forEach(file => {
  const filePath = path.join(migrationsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Replace uuid_generate_v4() with gen_random_uuid()
  content = content.replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    const count = (originalContent.match(/uuid_generate_v4\(\)/g) || []).length;
    totalReplacements += count;
    console.log(`✓ Fixed ${count} occurrence(s) in ${file}`);
  }
});

console.log(`\nTotal replacements: ${totalReplacements}`);
console.log('All migration files have been updated!');
