import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  calculateRiskPips,
  calculateRR,
  calculatePnlPct,
  generateTradeCode,
} from '@/lib/calculations';
import { sendNotification } from '@/lib/notifications';
import { TradeInputSchema } from '@/lib/schemas';
import { rateLimit } from '@/lib/rate-limit';
import { getUserFromRequest } from '@/lib/auth';
import { syncToGoogleSheets } from '@/lib/google-sheets';

// GET all trades for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset');
    const session = searchParams.get('session');
    const direction = searchParams.get('direction');
    const status = searchParams.get('status');
    const phase = searchParams.get('phase');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: Record<string, unknown> = { userId: user.id };
    if (asset) where.asset = asset;
    if (session) where.session = session;
    if (direction) where.direction = direction;
    if (status) where.status = status;
    if (phase) where.challengePhase = phase;
    if (dateFrom || dateTo) {
      where.date = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(trades);
  } catch (error) {
    console.error('Trades GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

// POST create new trade for current user
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed } = rateLimit(`trades:${ip}`, { maxRequests: 20, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429 }
      );
    }

    const bodyRaw = await request.json();
    const result = TradeInputSchema.safeParse(bodyRaw);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.format() },
        { status: 400 }
      );
    }
    const body = result.data;

    // Generate trade code scoped to this user
    const lastTrade = await prisma.trade.findFirst({
      where: { userId: user.id },
      orderBy: { tradeCode: 'desc' },
      select: { tradeCode: true },
    });
    const tradeCode = generateTradeCode(lastTrade?.tradeCode ?? null);

    // Auto-calculate fields
    const riskPips = calculateRiskPips(body.entryPrice, body.stopLoss);
    const rr1 = calculateRR(body.entryPrice, body.stopLoss, body.tp1);
    const rr2 = calculateRR(body.entryPrice, body.stopLoss, body.tp2);
    const rr3 = body.tp3
      ? calculateRR(body.entryPrice, body.stopLoss, body.tp3)
      : null;

    // Calculate P&L if exit price provided
    let actualPnlPct: number | null = null;
    let status = 'open';
    if (body.exitPrice) {
      actualPnlPct = calculatePnlPct(
        body.entryPrice,
        body.exitPrice,
        body.direction,
        1.5,
        body.stopLoss
      );
      status = 'closed';
    }

    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        tradeCode,
        date: body.date,
        entryTime: new Date(body.entryTime.includes('T') ? body.entryTime : `${bodyRaw.date}T${body.entryTime}:00Z`),
        exitTime: body.exitTime ? new Date(body.exitTime) : null,
        session: body.session,
        challengePhase: body.challengePhase,
        asset: body.asset,
        direction: body.direction,
        setupTypes: JSON.stringify(body.setupTypes),
        entryPrice: body.entryPrice,
        stopLoss: body.stopLoss,
        tp1: body.tp1,
        tp2: body.tp2,
        tp3: body.tp3 ?? null,
        exitPrice: body.exitPrice ?? null,
        exitReason: body.exitReason ?? null,
        actualPnlPct,
        riskPips,
        rr1,
        rr2,
        rr3,
        checklistScore: body.checklistScore,
        checklistItems: JSON.stringify(body.checklistItems),
        preReasoning: body.preReasoning,
        postNotes: body.postNotes ?? null,
        mistakes: body.mistakes ?? null,
        partialClose: body.partialClose,
        breakevenMoved: body.breakevenMoved,
        screenshots: JSON.stringify(body.screenshots),
        emotionBefore: JSON.stringify(body.emotionBefore),
        emotionAfter: body.emotionAfter
          ? JSON.stringify(body.emotionAfter)
          : null,
        disciplineRating: body.disciplineRating ?? null,
        wouldRetake: body.wouldRetake ?? null,
        revengeTradeFlag: body.revengeTradeFlag,
        fomoFlag: body.fomoFlag,
        followedRules: body.followedRules,
        brokenRule: body.brokenRule ?? null,
        pressureToTrade: body.pressureToTrade,
        status,
        dailyLogId: null,
      },
    });

    // Send Discord/Telegram Notification
    try {
      const directionEmoji = trade.direction === 'BUY' ? '🟢' : '🔴';
      const notificationMessage = `[ALIENX JOURNAL] ${directionEmoji} ${trade.direction} Entered: ${trade.asset} @ ${trade.entryPrice} | SL: ${trade.stopLoss} | TP1: ${trade.tp1} | Checklist: ${trade.checklistScore}/36`;
      await sendNotification(notificationMessage, user.id);
    } catch (err) {
      console.error('Failed to send entry notification:', err);
    }

    // Auto-sync to Google Sheets in background
    try {
      syncToGoogleSheets(user.id).catch((err) => {
        console.error('Background Google Sheets sync error:', err);
      });
    } catch (err) {
      console.error('Google Sheets sync trigger error:', err);
    }

    return NextResponse.json(trade, { status: 201 });
  } catch (error) {
    console.error('Trades POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}
