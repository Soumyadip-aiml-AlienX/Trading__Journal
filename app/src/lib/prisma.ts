import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;
  
  // If PostgreSQL connection string is provided, instantiate native PostgreSQL client
  // It automatically reads the DATABASE_URL environment variable
  if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
    return new PrismaClient();
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
