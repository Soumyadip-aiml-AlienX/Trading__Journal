import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { getUserFromRequest } from '@/lib/auth';

// GET settings
export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.settings.findUnique({
      where: { userId: user.id }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: user.id,
          accountSize: 100000,
          currentPhase: 'Phase 1',
          riskPerTrade: 1.5,
          maxTradesPerDay: 2,
        },
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

// PUT update settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed } = rateLimit(`settings:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json({ error: 'Too many settings updates. Try again later.' }, { status: 429 });
    }

    const body = await request.json();

    const settings = await prisma.settings.upsert({
      where: { userId: user.id },
      update: {
        accountSize: body.accountSize,
        currentPhase: body.currentPhase,
        riskPerTrade: body.riskPerTrade ?? 1.5,
        maxTradesPerDay: body.maxTradesPerDay ?? 2,
        webhookUrl: body.webhookUrl ?? null,
        screenshotPath: body.screenshotPath ?? null,
        googleSheetId: body.googleSheetId ?? null,
        notionApiKey: body.notionApiKey ?? null,
        discordWebhook: body.discordWebhook ?? null,
        onboardingDone: true,
      },
      create: {
        userId: user.id,
        accountSize: body.accountSize,
        currentPhase: body.currentPhase,
        riskPerTrade: body.riskPerTrade ?? 1.5,
        maxTradesPerDay: body.maxTradesPerDay ?? 2,
        webhookUrl: body.webhookUrl ?? null,
        screenshotPath: body.screenshotPath ?? null,
        googleSheetId: body.googleSheetId ?? null,
        notionApiKey: body.notionApiKey ?? null,
        discordWebhook: body.discordWebhook ?? null,
        onboardingDone: true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
