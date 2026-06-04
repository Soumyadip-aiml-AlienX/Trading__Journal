'use client';

import { useDrawdown } from '@/context/DrawdownContext';

interface DrawdownHeaderProps {
  onMenuClick?: () => void;
}

export default function DrawdownHeader({ onMenuClick }: DrawdownHeaderProps) {
  const { data } = useDrawdown();

  const pnlColor =
    data.todayPnl > 0
      ? 'text-buy'
      : data.todayPnl < 0
      ? 'text-sell'
      : 'text-[var(--color-text-muted)]';

  const dailyBarColor =
    data.dailyUsed >= 3.5
      ? 'bg-[var(--color-danger)]'
      : data.dailyUsed >= 2.5
      ? 'bg-[var(--color-warning)]'
      : data.dailyUsed >= 1.5
      ? 'bg-yellow-500'
      : 'bg-[var(--color-buy)]';

  const showWarning = data.dailyUsed >= 2.5;
  const showDanger = data.dailyUsed >= 3.5;

  return (
    <>
      {/* Warning / Danger Banners */}
      {showDanger && (
        <div className="drawdown-banner drawdown-danger">
          🚨 CRITICAL — DO NOT TRADE — Daily Drawdown at {data.dailyUsed.toFixed(1)}%
        </div>
      )}
      {showWarning && !showDanger && (
        <div className="drawdown-banner drawdown-warning">
          ⚠️ STOP TRADING TODAY — Daily Drawdown at {data.dailyUsed.toFixed(1)}%
        </div>
      )}

      {/* Main Header Bar */}
      <header role="banner" className="h-12 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center px-5 gap-6 text-xs font-medium">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden text-lg text-[var(--color-text-secondary)] hover:text-white p-1.5 hover:bg-[var(--color-surface-overlay)] rounded cursor-pointer transition-colors mr-1 flex items-center justify-center"
          aria-label="Open navigation menu"
        >
          ☰
        </button>

        {/* Today's P&L */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-muted)]">Today&apos;s P&amp;L</span>
          <span className={`font-bold text-sm ${pnlColor}`}>
            <span aria-hidden="true">{data.todayPnl > 0 ? '▲ ' : data.todayPnl < 0 ? '▼ ' : ''}</span>
            {data.todayPnl >= 0 ? '+' : ''}
            {data.todayPnl.toFixed(2)}%
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Daily Drawdown */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-muted)]">Daily DD</span>
          <div className="w-24 h-1.5 rounded-full bg-[var(--color-surface-overlay)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${dailyBarColor}`}
              style={{ width: `${Math.min((data.dailyUsed / 4) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[var(--color-text-secondary)]">
            {data.dailyUsed.toFixed(1)}% / 4%
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Daily Remaining */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-muted)]">Remaining</span>
          <span className="text-[var(--color-text-secondary)] font-semibold">
            {data.dailyRemaining.toFixed(1)}%
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Overall Drawdown */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-muted)]">Overall DD</span>
          <span className="text-[var(--color-text-secondary)]">
            {data.overallUsed.toFixed(1)}% / 8%
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Trades Count */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-muted)]">Trades Today</span>
          <span className={`font-bold ${data.tradesCount >= data.maxTrades ? 'text-sell' : 'text-[var(--color-text-primary)]'}`}>
            {data.tradesCount}/{data.maxTrades}
          </span>
        </div>

        {/* Phase */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-dim)]">
          <span className="text-[var(--color-accent-light)] font-semibold">
            {data.phase}
          </span>
          <span className="text-[var(--color-text-muted)]">
            {data.phaseProgress.toFixed(1)}%/{data.phaseTarget}%
          </span>
        </div>
      </header>
    </>
  );
}
