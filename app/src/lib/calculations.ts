// ──────────────────────────────────────────────
// Maven Trading Journal - Core Calculations
// ──────────────────────────────────────────────

/**
 * Calculate risk in pips/points
 */
export function calculateRiskPips(entryPrice: number, stopLoss: number): number {
  if (isNaN(entryPrice) || isNaN(stopLoss)) return 0;
  return Math.abs(entryPrice - stopLoss);
}

/**
 * Calculate Risk-Reward ratio
 */
export function calculateRR(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number {
  if (isNaN(entryPrice) || isNaN(stopLoss) || isNaN(takeProfit)) return 0;
  const risk = Math.abs(entryPrice - stopLoss);
  if (risk === 0) return 0;
  return Math.abs(takeProfit - entryPrice) / risk;
}

/**
 * Calculate actual P&L percentage from a trade
 */
export function calculatePnlPct(
  entryPrice: number,
  exitPrice: number,
  direction: 'BUY' | 'SELL',
  riskPct: number = 1.5,
  stopLoss: number
): number {
  if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(stopLoss) || isNaN(riskPct)) return 0;
  const risk = Math.abs(entryPrice - stopLoss);
  if (risk === 0) return 0;

  let priceDiff: number;
  if (direction === 'BUY') {
    priceDiff = exitPrice - entryPrice;
  } else {
    priceDiff = entryPrice - exitPrice;
  }

  const rrAchieved = priceDiff / risk;
  return rrAchieved * riskPct;
}

/**
 * Calculate position size in lots
 */
export function calculatePositionSize(
  accountBalance: number,
  riskPct: number,
  entryPrice: number,
  stopLoss: number,
  asset: string
): { lots: number; dollarRisk: number; pipValue: number } {
  if (isNaN(accountBalance) || isNaN(riskPct) || isNaN(entryPrice) || isNaN(stopLoss)) {
    return { lots: 0, dollarRisk: 0, pipValue: 0 };
  }
  const dollarRisk = accountBalance * (riskPct / 100);
  const pips = Math.abs(entryPrice - stopLoss);

  let pipValue: number;
  let lots: number;

  if (asset === 'XAUUSD') {
    // Gold: 1 lot = 100 troy ounces, pip value = $1 per 0.01 per lot (standard)
    // For Gold, pip = $0.01 move, 1 standard lot = 100 oz
    // Value per pip per lot = 100 * 0.01 = $1 (for 0.01 move)
    // But typically SL is in dollar terms, e.g., entry 2347.50, SL 2352.80 = 5.30 points
    // Dollar per point per lot = 100 (since 1 lot = 100 oz)
    pipValue = 100; // $ per point per standard lot
  } else if (asset === 'BTCUSD') {
    // BTC: 1 lot = 1 BTC typically
    pipValue = 1; // $ per $ move per lot
  } else if (asset === 'ETHUSD') {
    // ETH: 1 lot = 1 ETH typically
    pipValue = 1;
  } else {
    pipValue = 10; // Default forex
  }

  if (pips === 0 || isNaN(pips)) {
    lots = 0;
  } else {
    lots = dollarRisk / (pips * pipValue);
  }

  return {
    lots: isFinite(lots) ? Math.round(lots * 100) / 100 : 0,
    dollarRisk: Math.round(dollarRisk * 100) / 100,
    pipValue,
  };
}

/**
 * Calculate win rate from trades
 */
export function calculateWinRate(
  trades: Array<{ actualPnlPct: number | null; status: string }>
): number {
  const closedTrades = trades.filter(
    (t) => t.status === 'closed' && t.actualPnlPct !== null
  );
  if (closedTrades.length === 0) return 0;

  const wins = closedTrades.filter((t) => (t.actualPnlPct ?? 0) > 0).length;
  return (wins / closedTrades.length) * 100;
}

/**
 * Calculate profit factor
 */
export function calculateProfitFactor(
  trades: Array<{ actualPnlPct: number | null; status: string }>
): number {
  const closedTrades = trades.filter(
    (t) => t.status === 'closed' && t.actualPnlPct !== null
  );

  const totalWins = closedTrades
    .filter((t) => (t.actualPnlPct ?? 0) > 0)
    .reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0);

  const totalLosses = Math.abs(
    closedTrades
      .filter((t) => (t.actualPnlPct ?? 0) < 0)
      .reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0)
  );

  if (totalLosses === 0) return totalWins > 0 ? Infinity : 0;
  return totalWins / totalLosses;
}

/**
 * Calculate expectancy per trade
 */
export function calculateExpectancy(
  trades: Array<{ actualPnlPct: number | null; status: string }>
): number {
  const closedTrades = trades.filter(
    (t) => t.status === 'closed' && t.actualPnlPct !== null
  );
  if (closedTrades.length === 0) return 0;

  const wins = closedTrades.filter((t) => (t.actualPnlPct ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.actualPnlPct ?? 0) <= 0);

  const winRate = wins.length / closedTrades.length;
  const lossRate = losses.length / closedTrades.length;

  const avgWin =
    wins.length > 0
      ? wins.reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0) / wins.length
      : 0;

  const avgLoss =
    losses.length > 0
      ? Math.abs(
          losses.reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0) /
            losses.length
        )
      : 0;

  return winRate * avgWin - lossRate * avgLoss;
}

/**
 * Calculate readiness score from pre-session check-in
 */
export function calculateReadinessScore(
  mentalState: number,
  physicalState: string,
  marketConfidence: number,
  distractionLevel: string,
  sleepQuality: string,
  personalStress: boolean
): number {
  const physicalScore =
    physicalState === 'Well Rested' ? 10 : physicalState === 'Slightly Tired' ? 6 : 3;
  const distractionScore =
    distractionLevel === 'Fully Focused'
      ? 10
      : distractionLevel === 'Minor Distractions'
      ? 6
      : 3;
  const sleepScore =
    sleepQuality === 'Excellent' ? 10 : sleepQuality === 'Good' ? 7 : 3;
  const stressScore = personalStress ? 3 : 10;

  return (
    (mentalState + physicalScore + marketConfidence + distractionScore + sleepScore + stressScore) / 6
  );
}

/**
 * Generate the next trade code (TRD-001, TRD-002, etc.)
 */
export function generateTradeCode(lastCode: string | null): string {
  if (!lastCode) return 'TRD-001';
  const num = parseInt(lastCode.replace('TRD-', ''), 10);
  return `TRD-${String(num + 1).padStart(3, '0')}`;
}

/**
 * Calculate daily P&L from trades
 */
export function calculateDailyPnl(
  trades: Array<{ actualPnlPct: number | null; status: string }>
): number {
  return trades
    .filter((t) => t.status === 'closed' && t.actualPnlPct !== null)
    .reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0);
}

/**
 * Check if daily drawdown limit is exceeded
 */
export function checkDrawdownStatus(
  dailyPnl: number,
  dailyLimit: number = 4
): {
  level: 'safe' | 'warning' | 'danger' | 'critical';
  used: number;
  remaining: number;
  message: string;
} {
  const used = Math.abs(Math.min(dailyPnl, 0));
  const remaining = dailyLimit - used;

  if (used >= 3.5) {
    return {
      level: 'critical',
      used,
      remaining,
      message: 'CRITICAL - DO NOT TRADE',
    };
  }
  if (used >= 2.5) {
    return {
      level: 'danger',
      used,
      remaining,
      message: 'STOP TRADING TODAY',
    };
  }
  if (used >= 1.5) {
    return {
      level: 'warning',
      used,
      remaining,
      message: 'Approaching daily limit - trade cautiously',
    };
  }
  return {
    level: 'safe',
    used,
    remaining,
    message: 'Within safe limits',
  };
}

/**
 * Generate auto daily summary paragraph
 */
export function generateDailySummary(
  date: string,
  trades: Array<{
    id: string;
    tradeCode: string;
    asset: string;
    actualPnlPct: number | null;
    checklistScore: number;
    disciplineRating: number | null;
    status: string;
  }>,
  lesson: string | null
): string {
  const closedTrades = trades.filter((t) => t.status === 'closed');
  const assets = [...new Set(trades.map((t) => t.asset))].join(', ');
  const totalPnl = closedTrades.reduce((s, t) => s + (t.actualPnlPct ?? 0), 0);
  const winRate = calculateWinRate(closedTrades);
  const avgChecklist =
    trades.length > 0
      ? (
          trades.reduce((s, t) => s + t.checklistScore, 0) / trades.length
        ).toFixed(1)
      : '0';
  const avgDiscipline =
    closedTrades.filter((t) => t.disciplineRating !== null).length > 0
      ? (
          closedTrades
            .filter((t) => t.disciplineRating !== null)
            .reduce((s, t) => s + (t.disciplineRating ?? 0), 0) /
          closedTrades.filter((t) => t.disciplineRating !== null).length
        ).toFixed(1)
      : 'N/A';

  const best = closedTrades.reduce(
    (b, t) => ((t.actualPnlPct ?? -Infinity) > (b.actualPnlPct ?? -Infinity) ? t : b),
    closedTrades[0]
  );
  const worst = closedTrades.reduce(
    (w, t) => ((t.actualPnlPct ?? Infinity) < (w.actualPnlPct ?? Infinity) ? t : w),
    closedTrades[0]
  );

  let summary = `On ${date}, I took ${trades.length} trade${trades.length !== 1 ? 's' : ''} on ${assets || 'N/A'}.`;
  if (closedTrades.length > 0) {
    summary += ` My P&L for the day was ${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}%. Win rate was ${winRate.toFixed(0)}%.`;
    if (best) summary += ` Best trade: ${best.tradeCode} ${best.actualPnlPct !== null ? (best.actualPnlPct >= 0 ? '+' : '') + best.actualPnlPct.toFixed(2) : 'N/A'}%.`;
    if (worst) summary += ` Worst trade: ${worst.tradeCode} ${worst.actualPnlPct !== null ? (worst.actualPnlPct >= 0 ? '+' : '') + worst.actualPnlPct.toFixed(2) : 'N/A'}%.`;
  }
  summary += ` I followed ${avgChecklist}/11 checklist rules on average. My discipline rating was ${avgDiscipline}/5.`;
  if (lesson) summary += ` Key lesson: ${lesson}.`;

  return summary;
}
