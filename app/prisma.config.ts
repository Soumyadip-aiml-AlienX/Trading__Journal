import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'prisma/config';

// Load DATABASE_URL from .env.local manually for Prisma CLI compatibility
let databaseUrl = 'file:./prisma/dev.db';
try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (match && match[1]) {
      databaseUrl = match[1];
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
