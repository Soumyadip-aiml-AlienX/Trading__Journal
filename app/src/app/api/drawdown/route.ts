import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function GET() {
  try {
    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    // Get today's trades
    const todayTrades = await prisma.trade.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    // Get all closed trades for overall drawdown
    const allTrades = await prisma.trade.findMany({
      where: { status: 'closed' },
    });

    // Settings
    const settings = await prisma.settings.findFirst();
    const phase = settings?.currentPhase ?? 'Phase 1';
    const maxTrades = settings?.maxTradesPerDay ?? 2;

    // Today's P&L
    const todayPnl = todayTrades
      .filter((t) => t.status === 'closed' && t.actualPnlPct !== null)
      .reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0);

    // Daily drawdown (negative P&L as positive drawdown)
    const dailyUsed = Math.abs(Math.min(todayPnl, 0));
    const dailyRemaining = 4 - dailyUsed;

    // Overall drawdown
    const overallPnl = allTrades.reduce(
      (sum, t) => sum + (t.actualPnlPct ?? 0),
      0
    );
    const overallUsed = Math.abs(Math.min(overallPnl, 0));

    // Phase progress
    const phaseTarget = phase === 'Phase 1' ? 8 : 5;
    const phaseProgress = Math.max(overallPnl, 0);

    // Trading streak: consecutive calendar days with >= 1 closed trade
    const allTradeDates = await prisma.trade.findMany({
      where: { status: 'closed' },
      select: { date: true },
      orderBy: { date: 'desc' },
    });
    const tradeDaySet = new Set(
      allTradeDates.map((t) => format(new Date(t.date), 'yyyy-MM-dd'))
    );
    let streak = 0;
    let checkDay = new Date(today);
    // Start from today; if today has no trade, start from yesterday
    if (!tradeDaySet.has(format(checkDay, 'yyyy-MM-dd'))) {
      checkDay = subDays(checkDay, 1);
    }
    while (tradeDaySet.has(format(checkDay, 'yyyy-MM-dd'))) {
      streak++;
      checkDay = subDays(checkDay, 1);
    }

    const response = NextResponse.json({
      todayPnl: Math.round(todayPnl * 100) / 100,
      dailyUsed: Math.round(dailyUsed * 100) / 100,
      dailyRemaining: Math.round(dailyRemaining * 100) / 100,
      overallUsed: Math.round(overallUsed * 100) / 100,
      tradesCount: todayTrades.length,
      maxTrades,
      phase,
      phaseProgress: Math.round(phaseProgress * 100) / 100,
      phaseTarget,
      streak,
    });
    response.headers.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=30');
    return response;
  } catch (error) {
    console.error('Drawdown API error:', error);
    return NextResponse.json({
      todayPnl: 0,
      dailyUsed: 0,
      dailyRemaining: 4,
      overallUsed: 0,
      tradesCount: 0,
      maxTrades: 2,
      phase: 'Phase 1',
      phaseProgress: 0,
      phaseTarget: 8,
    });
  }
}
