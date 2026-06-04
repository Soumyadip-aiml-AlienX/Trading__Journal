const fs = require('fs');
const path = require('path');

// Try to find the connection URL
let dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

// Read .env.local manually if running locally and URL is not in environment
if (!dbUrl) {
  try {
    const envLocalPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, 'utf8');
      const match = content.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        dbUrl = match[1];
      }
    }
  } catch (e) {
    // Ignore
  }
}

if (!dbUrl) {
  dbUrl = 'file:./prisma/dev.db';
}

const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
try {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Find datasource db block and replace provider dynamically
  const updatedContent = schemaContent.replace(
    /(datasource\s+db\s*{[\s\S]*?provider\s*=\s*")([^"]+)("[\s\S]*?})/g,
    (match, p1, oldProvider, p3) => {
      if (oldProvider !== targetProvider) {
        console.log(`[PRISMA CONFIG] Changing datasource provider from "${oldProvider}" to "${targetProvider}" to match connection URL.`);
        return `${p1}${targetProvider}${p3}`;
      }
      return match;
    }
  );

  fs.writeFileSync(schemaPath, updatedContent, 'utf8');
} catch (e) {
  console.error('[PRISMA CONFIG] Failed to prepare schema.prisma:', e);
  process.exit(1);
}
