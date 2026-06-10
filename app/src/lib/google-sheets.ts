import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

function signJWT(email: string, privateKey: string): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Claim = Buffer.from(JSON.stringify(claim)).toString('base64url');
  
  const signatureInput = `${base64Header}.${base64Claim}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(privateKey, 'base64url');

  return `${signatureInput}.${signature}`;
}

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const jwt = signJWT(email, privateKey);
  
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  
  if (!res.ok) {
    throw new Error(`Google OAuth token exchange failed: ${await res.text()}`);
  }
  
  const data = await res.json();
  return data.access_token;
}

export async function syncToGoogleSheets(userId: string): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const settings = await prisma.settings.findUnique({
      where: { userId }
    });
    if (!settings || !settings.googleSheetId) {
      return { success: false, count: 0, message: 'Google Sheet ID not configured in Settings.' };
    }

    // Attempt to load google-credentials.json from project root
    let creds;
    try {
      const credsPath = path.join(process.cwd(), 'google-credentials.json');
      const credsData = await fs.readFile(credsPath, 'utf8');
      creds = JSON.parse(credsData);
    } catch {
      return {
        success: false,
        count: 0,
        message: 'google-credentials.json not found in project root. Place your service account JSON file there to sync.',
      };
    }

    const { client_email, private_key } = creds;
    if (!client_email || !private_key) {
      return { success: false, count: 0, message: 'Invalid credentials in google-credentials.json.' };
    }

    const token = await getAccessToken(client_email, private_key);
    const spreadsheetId = settings.googleSheetId;

    // Get all trades for user
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (trades.length === 0) {
      return { success: true, count: 0, message: 'No trades to sync.' };
    }

    // Fetch existing values in spreadsheet to check for Trade ID rows
    const getValuesRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:A`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    let existingIds: string[] = [];
    if (getValuesRes.ok) {
      const data = await getValuesRes.json();
      existingIds = (data.values || []).map((row: string[]) => row[0]);
    }

    let updatedCount = 0;
    let appendedCount = 0;

    // If sheet is completely empty, initialize headers
    if (existingIds.length === 0) {
      const headers = [
        'Trade ID', 'Date', 'Asset', 'Direction', 'Entry', 'SL', 'TP1', 'TP2',
        'Exit', 'P&L%', 'RR', 'Setup', 'Session', 'Checklist Score',
        'Emotion Before', 'Discipline Rating'
      ];
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [headers] }),
        }
      );
      existingIds = ['Trade ID'];
    }

    for (const t of trades) {
      const rowData = [
        t.tradeCode,
        new Date(t.date).toLocaleDateString(),
        t.asset,
        t.direction,
        t.entryPrice,
        t.stopLoss,
        t.tp1,
        t.tp2,
        t.exitPrice || '',
        t.actualPnlPct !== null ? `${t.actualPnlPct.toFixed(2)}%` : '',
        t.rr1 ? `1:${t.rr1.toFixed(1)}` : '',
        JSON.parse(t.setupTypes || '[]').join(', '),
        t.session,
        `${t.checklistScore}/36`,
        JSON.parse(t.emotionBefore || '[]').join(', '),
        t.disciplineRating || '',
      ];

      const existingIndex = existingIds.indexOf(t.tradeCode);

      if (existingIndex !== -1) {
        // Upsert logic: Update existing row (index is 0-based, spreadsheet is 1-based)
        const rowNum = existingIndex + 1;
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A${rowNum}:P${rowNum}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [rowData] }),
          }
        );
        updatedCount++;
      } else {
        // Append new row
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:P:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [rowData] }),
          }
        );
        existingIds.push(t.tradeCode);
        appendedCount++;
      }
    }

    return {
      success: true,
      count: trades.length,
      message: `Sync complete. Appended ${appendedCount} new rows, updated ${updatedCount} existing rows.`,
    };
  } catch (error: any) {
    console.error('Google Sheets sync error:', error);
    return { success: false, count: 0, message: `Sync failed: ${error.message || error}` };
  }
}
