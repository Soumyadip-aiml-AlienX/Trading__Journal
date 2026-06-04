import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    databaseUrlSet: !!process.env.DATABASE_URL,
    databaseUrlType: process.env.DATABASE_URL ? (process.env.DATABASE_URL.startsWith('file:') ? 'sqlite' : 'postgres/other') : 'none',
    envVariables: {
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
    }
  };

  try {
    // 1. Test database connection
    diagnostics.connectionTest = "Attempting query...";
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.connectionTest = "Success";

    // 2. Test if User table exists
    diagnostics.userTableTest = "Attempting to count users...";
    const userCount = await prisma.user.count();
    diagnostics.userTableTest = `Success (Found ${userCount} users)`;
  } catch (error: any) {
    diagnostics.error = {
      message: error.message || 'Unknown database error',
      code: error.code,
      meta: error.meta,
      stack: error.stack?.split('\n').slice(0, 3) // first 3 lines
    };
  }

  return NextResponse.json(diagnostics, { status: diagnostics.error ? 500 : 200 });
}
