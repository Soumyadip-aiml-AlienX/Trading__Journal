import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import path from 'node:path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function sanitizeDatabaseUrl(url: string): string {
  try {
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      return url;
    }

    const protocolMatch = url.match(/^(postgres(?:ql)?:\/\/)/);
    if (!protocolMatch) return url;
    const protocol = protocolMatch[1];
    const remaining = url.substring(protocol.length);

    const firstSlash = remaining.indexOf('/');
    const authorityEnd = firstSlash === -1 ? remaining.length : firstSlash;
    const authority = remaining.substring(0, authorityEnd);
    const pathAndQuery = remaining.substring(authorityEnd);

    const atIndex = authority.lastIndexOf('@');
    if (atIndex === -1) return url;

    const credentials = authority.substring(0, atIndex);
    const hostPart = authority.substring(atIndex + 1);

    const colonIndex = credentials.indexOf(':');
    if (colonIndex === -1) return url;

    const username = credentials.substring(0, colonIndex);
    const password = credentials.substring(colonIndex + 1);

    let encodedPassword = password;
    try {
      const decoded = decodeURIComponent(password);
      if (decoded === password) {
        encodedPassword = encodeURIComponent(password);
      }
    } catch {
      encodedPassword = encodeURIComponent(password);
    }

    return `${protocol}${username}:${encodedPassword}@${hostPart}${pathAndQuery}`;
  } catch (e) {
    console.error('Error sanitizing database URL:', e);
    return url;
  }
}

function createPrismaClient() {
  let dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl) {
    dbUrl = dbUrl.replace(/^["']|["']$/g, '');
    dbUrl = sanitizeDatabaseUrl(dbUrl);
    process.env.DATABASE_URL = dbUrl; // Sync back to environment for Prisma Rust engine
  }
  
  // If PostgreSQL connection string is provided, use PrismaPg adapter (required in Prisma 7)
  if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
    const cleanDbUrl = dbUrl.replace(/[?&]sslmode=[^&]*/g, '');
    const pool = new Pool({
      connectionString: cleanDbUrl,
      ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // Otherwise, use SQLite adapter for local development
  const dbPath = dbUrl && dbUrl.startsWith('file:')
    ? dbUrl.substring(5)
    : path.join(process.cwd(), 'prisma', 'dev.db');
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

