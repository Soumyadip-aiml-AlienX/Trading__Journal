'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getTradingViewUrl } from '@/components/shared/TradingViewChart';
import CalendarHeatmap from '@/components/charts/CalendarHeatmap';

const DashboardEquityChart = dynamic(
  () => import('@/components/charts/DashboardEquityChart'),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center text-sm text-[var(--color-text-muted)] animate-pulse">Loading equity curve...</div> }
);

const DashboardSessionChart = dynamic(
  () => import('@/components/charts/DashboardSessionChart'),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center text-sm text-[var(--color-text-muted)] animate-pulse">Loading session data...</div> }
);

interface DashboardData {
  totalTrades: number;
  winRate: number;
  currentPnl: number;
  remainingToTarget: number;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  equityCurve: Array<{ trade: string; pnl: number }>;
  sessionData: Array<{ name: string; value: number }>;
  recentTrades: Array<{
    id: string;
    tradeCode: string;
    asset: string;
    direction: string;
    entryPrice: number;
    exitPrice: number | null;
    actualPnlPct: number | null;
    status: string;
    date: string;
  }>;
  dailyStats: Array<{ date: string; pnl: number; count: number }>;
}

const SESSION_COLORS = ['#3B82F6', '#1D9E75', '#E87721', '#8B5CF6'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.warn('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Trades', value: data?.totalTrades ?? 0, format: 'number' },
    { label: 'Win Rate', value: data?.winRate ?? 0, format: 'percent', color: (data?.winRate ?? 0) >= 50 ? 'text-buy' : 'text-sell' },
    { label: 'Current P&L', value: data?.currentPnl ?? 0, format: 'pnl', color: (data?.currentPnl ?? 0) >= 0 ? 'text-buy' : 'text-sell' },
    { label: 'Remaining to Target', value: data?.remainingToTarget ?? 8, format: 'percent' },
    { label: 'Best Trade', value: data?.bestTrade ?? 0, format: 'pnl', color: 'text-buy' },
    { label: 'Worst Trade', value: data?.worstTrade ?? 0, format: 'pnl', color: 'text-sell' },
    { label: 'Avg Win', value: data?.avgWin ?? 0, format: 'pnl', color: 'text-buy' },
    { label: 'Avg Loss', value: data?.avgLoss ?? 0, format: 'pnl', color: 'text-sell' },
    { label: 'Profit Factor', value: data?.profitFactor ?? 0, format: 'decimal' },
    { label: 'Expectancy', value: data?.expectancy ?? 0, format: 'pnl' },
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percent': return `${value.toFixed(1)}%`;
      case 'pnl': return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
      case 'decimal': return value === Infinity ? '∞' : value.toFixed(2);
      default: return value.toString();
    }
  };

  const hasData = (data?.totalTrades ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      {!hasData && (
        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome to Maven Trading Journal</h2>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-lg mx-auto">
            Your professional SMC + ICT Hybrid trading journal. Start by logging your first trade
            or completing today&apos;s pre-session check-in.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/trades/new" className="btn-primary text-sm px-6 py-2.5">
              ➕ Log First Trade
            </Link>
            <Link href="/psychology" className="btn-secondary text-sm px-6 py-2.5">
              🧠 Pre-Session Check-In
            </Link>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="metric-card">
            <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              {stat.label}
            </div>
            <div className={`text-xl font-bold ${stat.color ?? 'text-[var(--color-text-primary)]'}`}>
              {formatValue(stat.value, stat.format)}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equity Curve */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            📈 Equity Curve
          </h3>
          {hasData ? (
            <DashboardEquityChart data={data?.equityCurve ?? []} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
              No trade data yet. Your equity curve will appear here.
            </div>
          )}
        </div>

        {/* Session Analysis */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            🕐 Session Analysis
          </h3>
          {hasData ? (
            <DashboardSessionChart data={data?.sessionData ?? []} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
              Session breakdown will appear after your first trades.
            </div>
          )}
        </div>
      </div>

      {/* Calendar Heatmap */}
      {hasData && (
        <CalendarHeatmap dailyStats={data?.dailyStats ?? []} />
      )}

      {/* Recent Trades */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            📋 Recent Trades
          </h3>
          <Link href="/trades" className="text-xs text-[var(--color-accent-light)] hover:underline">
            View All →
          </Link>
        </div>
        {(data?.recentTrades ?? []).length > 0 ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="data-table min-w-[800px] lg:min-w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Asset</th>
                  <th>Direction</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>P&amp;L</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentTrades ?? []).map((trade) => (
                  <tr
                    key={trade.id}
                    className={
                      trade.status === 'closed'
                        ? (trade.actualPnlPct ?? 0) > 0
                          ? 'row-win'
                          : 'row-loss'
                        : ''
                    }
                  >
                    <td className="font-mono font-semibold text-[var(--color-accent-light)] hover:underline">
                      <Link href={`/trades/${trade.id}`}>
                        {trade.tradeCode}
                      </Link>
                    </td>
                    <td>{new Date(trade.date).toLocaleDateString()}</td>
                    <td className="font-semibold">
                      <span className="flex items-center gap-1">
                        {trade.asset}
                        <a
                          href={getTradingViewUrl(trade.asset)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in TradingView"
                          className="text-[10px] opacity-40 hover:opacity-100 transition-opacity hover:text-[var(--color-accent-light)]"
                        >
                          ↗️
                        </a>
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${trade.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="font-mono">{trade.entryPrice.toFixed(2)}</td>
                    <td className="font-mono">{trade.exitPrice?.toFixed(2) ?? '—'}</td>
                    <td className={`font-mono font-semibold ${(trade.actualPnlPct ?? 0) >= 0 ? 'text-buy' : 'text-sell'}`}>
                      {trade.actualPnlPct !== null
                        ? `${trade.actualPnlPct >= 0 ? '+' : ''}${trade.actualPnlPct.toFixed(2)}%`
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${trade.status === 'open' ? 'badge-open' : 'badge-closed'}`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-sm">No trades logged yet</p>
            <Link href="/trades/new" className="btn-primary inline-block mt-4 text-xs">
              Log Your First Trade
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
