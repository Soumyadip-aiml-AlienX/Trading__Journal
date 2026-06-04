import { NextResponse } from 'next/server';
import { syncToGoogleSheets } from '@/lib/google-sheets';
import { getUserFromRequest } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credsPath = path.join(process.cwd(), 'google-credentials.json');
    let hasCredentials = false;
    try {
      await fs.access(credsPath);
      hasCredentials = true;
    } catch {
      // not found
    }
    return NextResponse.json({ hasCredentials });
  } catch {
    return NextResponse.json({ hasCredentials: false });
  }
}

export async function POST() {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncToGoogleSheets(user.id);
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error('Google Sheets API route error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
