import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateRiskPips, calculateRR, calculatePnlPct, generateTradeCode } from '@/lib/calculations';

export async function POST(request: NextRequest) {
  try {
    const { trades } = await request.json();
    if (!Array.isArray(trades) || trades.length === 0) {
      return NextResponse.json({ error: 'Trades array is required' }, { status: 400 });
    }

    const createdTrades = [];
    
    // Get last trade code to sequence properly
    const lastTrade = await prisma.trade.findFirst({
      orderBy: { tradeCode: 'desc' },
      select: { tradeCode: true },
    });
    let lastCode = lastTrade?.tradeCode ?? null;

    // Get settings to know actual risk pct
    const settings = await prisma.settings.findFirst();
    const riskPct = settings?.riskPerTrade ?? 1.5;

    for (const t of trades) {
      const tradeCode = generateTradeCode(lastCode);
      lastCode = tradeCode;

      const entryPrice = parseFloat(t.entryPrice) || 0;
      const stopLoss = parseFloat(t.stopLoss) || 0;
      const tp1 = parseFloat(t.tp1) || 0;
      const tp2 = parseFloat(t.tp2) || 0;
      const exitPrice = t.exitPrice ? parseFloat(t.exitPrice) : null;

      const riskPips = calculateRiskPips(entryPrice, stopLoss);
      const rr1 = calculateRR(entryPrice, stopLoss, tp1);
      const rr2 = calculateRR(entryPrice, stopLoss, tp2);
      
      let actualPnlPct = null;
      let status = 'open';
      if (exitPrice) {
        actualPnlPct = calculatePnlPct(
          entryPrice,
          exitPrice,
          t.direction,
          riskPct,
          stopLoss
        );
        status = 'closed';
      }

      const created = await prisma.trade.create({
        data: {
          tradeCode,
          date: new Date(t.date || new Date()),
          entryTime: new Date(t.entryTime || new Date()),
          exitTime: t.exitTime ? new Date(t.exitTime) : null,
          session: t.session || 'NY Open',
          challengePhase: t.challengePhase || 'Phase 1',
          asset: t.asset || 'XAUUSD',
          direction: t.direction || 'BUY',
          setupTypes: JSON.stringify(t.setupTypes ?? []),
          entryPrice,
          stopLoss,
          tp1,
          tp2,
          exitPrice,
          exitReason: t.exitReason || null,
          actualPnlPct,
          riskPips,
          rr1,
          rr2,
          checklistScore: t.checklistScore ?? 0,
          checklistItems: JSON.stringify(t.checklistItems ?? new Array(11).fill(false)),
          preReasoning: t.preReasoning || 'Imported trade',
          emotionBefore: JSON.stringify(t.emotionBefore ?? []),
          status,
        },
      });
      createdTrades.push(created);
    }

    return NextResponse.json({ success: true, count: createdTrades.length });
  } catch (error) {
    console.error('Bulk trades POST error:', error);
    return NextResponse.json({ error: 'Failed to import trades' }, { status: 500 });
  }
}
