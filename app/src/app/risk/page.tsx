'use client';

import { useState } from 'react';

export default function RiskMonitorPage() {
  const [calc, setCalc] = useState({
    accountBalance: '100000',
    riskPct: '1.0',
    entryPrice: '',
    stopLoss: '',
    asset: 'XAUUSD',
  });

  const balance = parseFloat(calc.accountBalance) || 0;
  const riskPct = parseFloat(calc.riskPct) || 1.0;
  const entry = parseFloat(calc.entryPrice) || 0;
  const sl = parseFloat(calc.stopLoss) || 0;
  const pips = Math.abs(entry - sl);
  const dollarRisk = balance * (riskPct / 100);

  let lots = 0;
  let unit = 'lots';
  if (pips > 0) {
    if (calc.asset === 'XAUUSD') {
      lots = dollarRisk / (pips * 100);
      unit = 'lots (troy oz)';
    } else if (calc.asset === 'EURUSD') {
      lots = dollarRisk / (pips * 100000);
      unit = 'lots';
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">⚠️ Risk Management</h1>

      {/* Risk Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            Risk Rules
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Max trades per day</span>
              <span className="font-bold">2</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Risk per trade</span>
              <span className="font-bold">1.0%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Minimum RR</span>
              <span className="font-bold">1:1 (TP1) / 1:5 (TP2)</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Daily drawdown limit</span>
              <span className="font-bold">2.0%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Min checklist score</span>
              <span className="font-bold">36/36</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            Hard Stops
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
              <span className="text-buy mt-0.5">✓</span>
              <span>Block trades if daily count ≥ 2</span>
            </div>
            <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
              <span className="text-buy mt-0.5">✓</span>
              <span>Block trades if daily drawdown ≥ 2.0%</span>
            </div>
            <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
              <span className="text-buy mt-0.5">✓</span>
              <span>Block trades if TP1 RR &lt; 1:1</span>
            </div>
            <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
              <span className="text-[var(--color-warning)] mt-0.5">⚠️</span>
              <span>Lock form if checklist score &lt; 36/36</span>
            </div>
          </div>
        </div>
      </div>

      {/* Position Size Calculator */}
      <div className="glass-card p-5">
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
          🧮 Position Size Calculator
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="form-label">Account Balance ($)</label>
            <input
              type="number"
              className="form-input font-mono"
              value={calc.accountBalance}
              onChange={(e) => setCalc({ ...calc, accountBalance: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Risk %</label>
            <input
              type="number"
              step="0.1"
              className="form-input font-mono"
              value={calc.riskPct}
              onChange={(e) => setCalc({ ...calc, riskPct: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Asset</label>
            <select
              className="form-input"
              value={calc.asset}
              onChange={(e) => setCalc({ ...calc, asset: e.target.value })}
            >
              <option value="XAUUSD">XAUUSD (Gold)</option>
              <option value="EURUSD">EURUSD</option>
            </select>
          </div>
          <div>
            <label className="form-label">Entry Price</label>
            <input
              type="number"
              step="0.01"
              className="form-input font-mono"
              placeholder="0.00"
              value={calc.entryPrice}
              onChange={(e) => setCalc({ ...calc, entryPrice: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Stop Loss</label>
            <input
              type="number"
              step="0.01"
              className="form-input font-mono"
              placeholder="0.00"
              value={calc.stopLoss}
              onChange={(e) => setCalc({ ...calc, stopLoss: e.target.value })}
            />
          </div>
        </div>

        {/* Results */}
        {pips > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[var(--color-surface)] rounded-lg p-4 text-center">
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Position Size</div>
              <div className="text-xl font-bold font-mono text-[var(--color-accent-light)]">
                {lots.toFixed(2)}
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)]">{unit}</div>
            </div>
            <div className="bg-[var(--color-surface)] rounded-lg p-4 text-center">
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Dollar Risk</div>
              <div className="text-xl font-bold font-mono text-sell">
                ${dollarRisk.toFixed(2)}
              </div>
            </div>
            <div className="bg-[var(--color-surface)] rounded-lg p-4 text-center">
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Risk Distance</div>
              <div className="text-xl font-bold font-mono">
                {pips.toFixed(2)} pts
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
