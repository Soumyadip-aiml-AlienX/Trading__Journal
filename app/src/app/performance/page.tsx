'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const PerformanceEquityChart = dynamic(
  () => import('@/components/charts/PerformanceCharts').then(m => m.PerformanceEquityChart),
  { ssr: false, loading: () => <div className="h-[320px] flex items-center justify-center text-sm text-[var(--color-text-muted)] animate-pulse">Loading equity curve...</div> }
);

const PerformanceSessionChart = dynamic(
  () => import('@/components/charts/PerformanceCharts').then(m => m.PerformanceSessionChart),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center text-sm text-[var(--color-text-muted)] animate-pulse">Loading session data...</div> }
);

export default function PerformancePage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) setData(await res.json());
      } catch (err) { console.warn('Performance data fetch failed:', err); } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasData = (data as { totalTrades?: number })?.totalTrades ?? 0 > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">📈 Performance Analytics</h1>

      {!hasData ? (
        <div className="glass-card p-12 text-center">
          <p className="text-3xl mb-3">📊</p>
          <p className="text-[var(--color-text-secondary)]">
            Performance analytics will appear after you log your first trades.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Equity Curve */}
          <div className="glass-card p-5 col-span-2">
            <h3 className="text-sm font-semibold mb-4">Equity Curve</h3>
            <PerformanceEquityChart data={(data as { equityCurve?: Array<{ trade: string; pnl: number }> })?.equityCurve ?? []} />
          </div>

          {/* Session Analysis */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Session Analysis</h3>
            <PerformanceSessionChart data={(data as { sessionData?: Array<{ name: string; value: number }> })?.sessionData ?? []} />
          </div>

          {/* Setup Effectiveness Placeholder */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Setup Effectiveness</h3>
            <div className="h-[280px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
              Setup analysis will populate with more trade data.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
