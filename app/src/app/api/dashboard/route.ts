import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  calculateWinRate,
  calculateProfitFactor,
  calculateExpectancy,
} from '@/lib/calculations';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trades = await prisma.trade.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const closedTrades = trades.filter(
      (t) => t.status === 'closed' && t.actualPnlPct !== null
    );

    const totalTrades = trades.length;
    const winRate = calculateWinRate(trades);
    const currentPnl = closedTrades.reduce(
      (sum, t) => sum + (t.actualPnlPct ?? 0),
      0
    );

    // Determine phase target
    const settings = await prisma.settings.findUnique({
      where: { userId: user.id }
    });
    const phase = settings?.currentPhase ?? 'Phase 1';
    const target = phase === 'Phase 1' ? 8 : 5;
    const remainingToTarget = target - currentPnl;

    // Best/Worst trades
    const pnls = closedTrades.map((t) => t.actualPnlPct ?? 0);
    const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
    const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;

    // Average win/loss
    const wins = closedTrades.filter((t) => (t.actualPnlPct ?? 0) > 0);
    const losses = closedTrades.filter((t) => (t.actualPnlPct ?? 0) < 0);
    const avgWin =
      wins.length > 0
        ? wins.reduce((s, t) => s + (t.actualPnlPct ?? 0), 0) / wins.length
        : 0;
    const avgLoss =
      losses.length > 0
        ? losses.reduce((s, t) => s + (t.actualPnlPct ?? 0), 0) / losses.length
        : 0;

    const profitFactor = calculateProfitFactor(trades);
    const expectancy = calculateExpectancy(trades);

    // Equity curve data
    let cumPnl = 0;
    const equityCurve = closedTrades
      .sort(
        (a, b) =>
          new Date(a.exitTime ?? a.entryTime).getTime() -
          new Date(b.exitTime ?? b.entryTime).getTime()
      )
      .map((t) => {
        cumPnl += t.actualPnlPct ?? 0;
        return {
          trade: t.tradeCode,
          pnl: Math.round(cumPnl * 100) / 100,
        };
      });

    // Session analysis
    const sessionMap = new Map<string, number>();
    closedTrades.forEach((t) => {
      const cur = sessionMap.get(t.session) ?? 0;
      sessionMap.set(t.session, cur + (t.actualPnlPct ?? 0));
    });
    const sessionData = Array.from(sessionMap.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));

    // Recent trades (last 10)
    const recentTrades = trades.slice(0, 10).map((t) => ({
      id: t.id,
      tradeCode: t.tradeCode,
      asset: t.asset,
      direction: t.direction,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      actualPnlPct: t.actualPnlPct,
      status: t.status,
      date: t.date.toISOString(),
    }));

    // Calculate daily stats for calendar heatmap
    const dailyMap = new Map<string, { pnl: number; count: number }>();
    closedTrades.forEach((t) => {
      const dayStr = t.date.toISOString().split('T')[0];
      const cur = dailyMap.get(dayStr) ?? { pnl: 0, count: 0 };
      dailyMap.set(dayStr, {
        pnl: cur.pnl + (t.actualPnlPct ?? 0),
        count: cur.count + 1,
      });
    });
    const dailyStats = Array.from(dailyMap.entries()).map(([date, val]) => ({
      date,
      pnl: Math.round(val.pnl * 100) / 100,
      count: val.count,
    }));

    return NextResponse.json({
      totalTrades,
      winRate: Math.round(winRate * 10) / 10,
      currentPnl: Math.round(currentPnl * 100) / 100,
      remainingToTarget: Math.round(remainingToTarget * 100) / 100,
      bestTrade: Math.round(bestTrade * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      equityCurve,
      sessionData,
      recentTrades,
      dailyStats,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
