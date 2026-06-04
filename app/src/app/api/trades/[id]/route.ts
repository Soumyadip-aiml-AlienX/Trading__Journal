import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateRiskPips, calculateRR, calculatePnlPct } from '@/lib/calculations';
import { startOfDay } from 'date-fns';
import { sendNotification } from '@/lib/notifications';
import { TradeInputSchema } from '@/lib/schemas';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const trade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error('Trade GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch trade' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const bodyRaw = await request.json();
    const result = TradeInputSchema.safeParse(bodyRaw);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.format() },
        { status: 400 }
      );
    }
    const body = result.data;

    // Auto-calculate risk and RR if prices changed
    const riskPips = calculateRiskPips(body.entryPrice, body.stopLoss);
    const rr1 = calculateRR(body.entryPrice, body.stopLoss, body.tp1);
    const rr2 = calculateRR(body.entryPrice, body.stopLoss, body.tp2);
    const rr3 = body.tp3 ? calculateRR(body.entryPrice, body.stopLoss, body.tp3) : null;

    let actualPnlPct = null;
    let status = 'open';

    if (body.exitPrice) {
      // Get settings to know actual risk pct
      const settings = await prisma.settings.findFirst();
      const riskPct = settings?.riskPerTrade ?? 1.5;
      
      actualPnlPct = calculatePnlPct(
        body.entryPrice,
        body.exitPrice,
        body.direction,
        riskPct,
        body.stopLoss
      );
      status = 'closed';
    }

    const trade = await prisma.trade.update({
      where: { id },
      data: {
        date: body.date,
        entryTime: new Date(body.entryTime),
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
        emotionAfter: body.emotionAfter ? JSON.stringify(body.emotionAfter) : null,
        disciplineRating: body.disciplineRating ?? null,
        wouldRetake: body.wouldRetake ?? null,
        revengeTradeFlag: body.revengeTradeFlag,
        fomoFlag: body.fomoFlag,
        followedRules: body.followedRules,
        brokenRule: body.brokenRule ?? null,
        pressureToTrade: body.pressureToTrade,
        status,
      },
    });

    // Send exit notification and check drawdown warnings
    try {
      if (status === 'closed' && actualPnlPct !== null) {
        const resultEmoji = actualPnlPct >= 0 ? '🏆' : '🚨';
        const notificationMessage = `[MAVEN JOURNAL] ${resultEmoji} Trade Closed: ${trade.tradeCode} (${trade.asset} ${trade.direction}) | Result: ${actualPnlPct >= 0 ? '+' : ''}${actualPnlPct.toFixed(2)}% | Exit Price: ${trade.exitPrice} | Reason: ${trade.exitReason}`;
        await sendNotification(notificationMessage);

        // Check daily drawdown
        const today = new Date();
        const dayStart = startOfDay(today);
        const todayTrades = await prisma.trade.findMany({
          where: {
            date: { gte: dayStart },
            status: 'closed',
          },
        });
        const dailyPnl = todayTrades.reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0);
        if (dailyPnl <= -2.0) {
          await sendNotification(`[MAVEN JOURNAL] ⚠️ DRAWDOWN ALERT: Daily P&L is currently ${dailyPnl.toFixed(2)}%! Please check your daily limits.`);
        }
      }
    } catch (err) {
      console.error('Failed to send exit notification:', err);
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error('Trade PUT error:', error);
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await prisma.trade.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Trade DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 });
  }
}
