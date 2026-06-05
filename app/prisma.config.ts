import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'prisma/config';

// Load connection URLs from .env.local manually for Prisma CLI compatibility
let databaseUrl = 'file:./prisma/dev.db';
let directUrl = undefined;

try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    const dbMatch = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (dbMatch && dbMatch[1]) {
      databaseUrl = dbMatch[1];
    }
    
    const directMatch = envContent.match(/^DIRECT_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (directMatch && directMatch[1]) {
      directUrl = directMatch[1];
    }
  }
} catch (e) {
  // Ignore
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: databaseUrl,
  },
});
