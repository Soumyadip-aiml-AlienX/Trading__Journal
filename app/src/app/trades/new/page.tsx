'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateRR, calculateRiskPips } from '@/lib/calculations';
import ScreenshotUploader from '@/components/trades/ScreenshotUploader';
import TradingViewChart, { getTradingViewUrl } from '@/components/shared/TradingViewChart';
import { useToast } from '@/components/shared/Toast';

const CHECKLIST_ITEMS = [
  '15M trend identified (BOS confirmed)',
  'Valid Order Block marked on 15M',
  'Price returned to OB zone',
  'Inside Killzone session window',
  '5M entry trigger confirmed (FVG/BOS/OTE)',
  'Liquidity grab visible before reversal',
  'No red news within 30 minutes',
  'Risk set to 1.5%',
  'SL placed correctly below/above OB',
  'TP1 and TP2 marked on chart',
  'RR minimum 1:2 confirmed',
];

const EMOTIONS = [
  'Confident',
  'Anxious',
  'FOMO',
  'Patient',
  'Greedy',
  'Uncertain',
  'Calm',
];

const SETUP_TYPES = [
  'Order Block',
  'FVG',
  'OTE',
  'Liquidity Grab',
  'BOS Retest',
];

interface TradeFormData {
  date: string;
  entryTime: string;
  exitTime: string;
  session: string;
  challengePhase: string;
  asset: string;
  direction: 'BUY' | 'SELL';
  setupTypes: string[];
  entryPrice: string;
  stopLoss: string;
  tp1: string;
  tp2: string;
  tp3: string;
  exitPrice: string;
  exitReason: string;
  checklistItems: boolean[];
  preReasoning: string;
  postNotes: string;
  mistakes: string;
  partialClose: boolean;
  breakevenMoved: boolean;
  emotionBefore: string[];
  emotionAfter: string[];
  disciplineRating: number;
  revengeTradeFlag: boolean;
  fomoFlag: boolean;
  followedRules: boolean;
  brokenRule: string;
  pressureToTrade: boolean;
  wouldRetake: string;
  screenshots: string[];
}

export default function NewTradePage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [showLiveChart, setShowLiveChart] = useState(false);
  const [form, setForm] = useState<TradeFormData>({
    date: new Date().toISOString().split('T')[0],
    entryTime: new Date().toTimeString().slice(0, 5),
    exitTime: '',
    session: 'NY Open',
    challengePhase: 'Phase 1',
    asset: 'XAUUSD',
    direction: 'BUY',
    setupTypes: [],
    entryPrice: '',
    stopLoss: '',
    tp1: '',
    tp2: '',
    tp3: '',
    exitPrice: '',
    exitReason: '',
    checklistItems: new Array(11).fill(false),
    preReasoning: '',
    postNotes: '',
    mistakes: '',
    partialClose: false,
    breakevenMoved: false,
    emotionBefore: [],
    emotionAfter: [],
    disciplineRating: 0,
    revengeTradeFlag: false,
    fomoFlag: false,
    followedRules: true,
    brokenRule: '',
    pressureToTrade: false,
    wouldRetake: '',
    screenshots: [],
  });

  const [pendingAlerts, setPendingAlerts] = useState<any[]>([]);
  const [checkInDone, setCheckInDone] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAlerts() {
      try {
        const res = await fetch('/api/webhook/tradingview');
        if (res.ok) {
          setPendingAlerts(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch pending alerts:', err);
      }
    }
    async function checkTodayCheckIn() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/daily-log?date=${todayStr}`);
        if (res.ok) {
          const data = await res.json();
          // If daily log exists and has a readiness score, check-in is done
          setCheckInDone(!!(data && data.readinessScore !== null && data.readinessScore !== undefined));
        } else {
          setCheckInDone(false);
        }
      } catch {
        setCheckInDone(false);
      }
    }
    checkAlerts();
    checkTodayCheckIn();
  }, []);

  const handlePreFill = async (alert: any) => {
    setForm((prev) => ({
      ...prev,
      asset: alert.ticker,
      direction: alert.action,
      entryPrice: alert.price?.toString() || '',
      stopLoss: alert.stopLoss?.toString() || '',
      tp1: alert.tp1?.toString() || '',
      tp2: alert.tp2?.toString() || '',
      session: alert.session || 'NY Open',
      setupTypes: alert.setup ? [alert.setup] : [],
    }));

    try {
      await fetch(`/api/webhook/tradingview?id=${alert.id}&status=converted`, {
        method: 'PATCH',
      });
      setPendingAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    } catch (err) {
      console.error('Failed to update alert status:', err);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await fetch(`/api/webhook/tradingview?id=${alertId}&status=ignored`, {
        method: 'PATCH',
      });
      setPendingAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  // Auto-calculated values
  const entry = parseFloat(form.entryPrice) || 0;
  const sl = parseFloat(form.stopLoss) || 0;
  const tp1 = parseFloat(form.tp1) || 0;
  const tp2 = parseFloat(form.tp2) || 0;
  const riskPips = entry && sl ? calculateRiskPips(entry, sl) : 0;
  const rr1 = entry && sl && tp1 ? calculateRR(entry, sl, tp1) : 0;
  const rr2 = entry && sl && tp2 ? calculateRR(entry, sl, tp2) : 0;
  const checklistScore = form.checklistItems.filter(Boolean).length;
  const rrWarning = rr1 > 0 && rr1 < 2;

  const scoreColor =
    checklistScore >= 9
      ? 'text-buy'
      : checklistScore >= 7
      ? 'text-[var(--color-warning)]'
      : 'text-sell';

  const toggleSetup = (setup: string) => {
    setForm((prev) => ({
      ...prev,
      setupTypes: prev.setupTypes.includes(setup)
        ? prev.setupTypes.filter((s) => s !== setup)
        : [...prev.setupTypes, setup],
    }));
  };

  const toggleEmotion = (emotion: string, field: 'emotionBefore' | 'emotionAfter') => {
    setForm((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(emotion)
        ? (prev[field] as string[]).filter((e) => e !== emotion)
        : [...(prev[field] as string[]), emotion],
    }));
  };

  const handleSubmit = async () => {
    if (checklistScore < 11) {
      toast.warning('Trade Entry Blocked: All 11 Confluence Checklist items must be checked.');
      return;
    }

    if (!form.entryPrice || !form.stopLoss || !form.tp1 || !form.tp2 || !form.preReasoning) {
      toast.warning('Please fill in all required fields: Entry, SL, TP1, TP2, and Pre-Trade Reasoning.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          entryPrice: parseFloat(form.entryPrice),
          stopLoss: parseFloat(form.stopLoss),
          tp1: parseFloat(form.tp1),
          tp2: parseFloat(form.tp2),
          tp3: form.tp3 ? parseFloat(form.tp3) : null,
          exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : null,
          date: `${form.date}T00:00:00Z`,
          entryTime: `${form.date}T${form.entryTime}:00Z`,
          exitTime: form.exitTime ? `${form.date}T${form.exitTime}:00Z` : null,
          checklistScore,
        }),
      });

      if (res.ok) {
        toast.success('Trade saved successfully!');
        router.push('/trades');
      } else {
        toast.error('Failed to save trade. Please try again.');
      }
    } catch {
      toast.error('Failed to save trade. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">New Trade Entry</h1>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="btn-secondary text-xs">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={saving || checklistScore < 11} 
            className={`btn-primary text-xs px-6 ${checklistScore < 11 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Saving...' : '💾 Save Trade'}
          </button>
        </div>
      </div>

      {/* Pending TradingView Alert Banner */}
      {pendingAlerts.length > 0 && (
        <div className="bg-[var(--color-accent-dim)] border border-[var(--color-accent)] rounded-lg p-4 text-xs flex justify-between items-center text-[var(--color-text-primary)]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <div>
              <span className="font-bold">Pending TradingView Alert:</span> {pendingAlerts[0].ticker} {pendingAlerts[0].action} @ {pendingAlerts[0].price}
              {pendingAlerts[0].setup && <span className="text-[var(--color-text-muted)]"> ({pendingAlerts[0].setup})</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePreFill(pendingAlerts[0])}
              className="bg-[var(--color-accent)] text-white font-bold px-3 py-1.5 rounded hover:bg-blue-600 transition-colors cursor-pointer"
            >
              ⚡ Pre-Fill Form
            </button>
            <button
              onClick={() => handleDismissAlert(pendingAlerts[0].id)}
              className="bg-slate-800 text-[var(--color-text-secondary)] px-3 py-1.5 rounded hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* CO3: Pre-Session Check-In Reminder */}
      {checkInDone === false && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-3 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">🧠</span>
            <span className="text-amber-300 font-medium">
              No pre-session check-in completed today. Trading without a psychology check-in may affect your discipline.
            </span>
          </div>
          <a
            href="/psychology"
            className="shrink-0 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 px-3 py-1.5 rounded font-bold transition-colors"
          >
            Complete Check-In
          </a>
        </div>
      )}

      {/* RR Warning */}
      {rrWarning && (
        <div className="drawdown-banner drawdown-warning rounded-lg">
          ⚠️ RR ratio is below 1:2 minimum ({rr1.toFixed(2)}). Consider adjusting TP1.
        </div>
      )}

      {/* Confluence Checklist Gatekeeper (Separate at the top) */}
      <div className={`glass-card p-6 border transition-all duration-300 ${checklistScore === 11 ? 'border-buy border-opacity-40 bg-buy/5 shadow-[0_0_15px_rgba(29,158,117,0.05)]' : 'border-[var(--color-border)] shadow-lg'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <span>🛡️ Confluence Gatekeeper Checklist</span>
              {checklistScore === 11 ? (
                <span className="text-[10px] bg-buy/20 text-buy font-bold px-2.5 py-0.5 rounded-full">
                  Unlocked
                </span>
              ) : (
                <span className="text-[10px] bg-sell/20 text-sell font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                  Locked (Must tick all 11)
                </span>
              )}
            </h2>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              Prop firm discipline rule: Confirm all 11 confluence parameters before entering trade details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLiveChart(!showLiveChart)}
              className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                showLiveChart
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] animate-pulse'
                  : 'bg-[var(--color-navy)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              <span>{showLiveChart ? '❌ Hide Chart' : '📊 Show Chart'}</span>
            </button>
            <div className="text-right">
              <span className={`text-xl font-bold font-mono ${scoreColor}`}>
                {checklistScore}/11
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CHECKLIST_ITEMS.map((item, i) => (
            <label 
              key={i} 
              className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                form.checklistItems[i] 
                  ? 'bg-buy/10 border-buy border-opacity-40 text-[var(--color-text-primary)] shadow-[0_2px_8px_rgba(29,158,117,0.05)] font-medium' 
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-navy)]'
              }`}
            >
              <input
                type="checkbox"
                checked={form.checklistItems[i]}
                onChange={(e) => {
                  const newItems = [...form.checklistItems];
                  newItems[i] = e.target.checked;
                  setForm({ ...form, checklistItems: newItems });
                }}
                className="w-4 h-4 rounded accent-[var(--color-buy)] cursor-pointer"
              />
              <span className="text-xs leading-none">
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Collapsible Live TradingView Chart */}
      {showLiveChart && (
        <div className="glass-card p-5 h-[480px] border border-[var(--color-accent)] border-opacity-35 animate-fade-in relative z-20">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold flex items-center gap-1.5 text-[var(--color-text-primary)]">
              🖥️ Live Interactive Chart: {form.asset}
            </span>
            <a
              href={getTradingViewUrl(form.asset)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent-light)] hover:underline font-bold text-[10px] flex items-center gap-0.5"
            >
              ↗️ Open Full Page
            </a>
          </div>
          <div className="h-[400px] relative">
            <TradingViewChart symbol={form.asset} />
          </div>
        </div>
      )}

      {/* Rest of the form, locked until 11/11 confluence is scored */}
      <div className="relative">
        {checklistScore < 11 && (
          <div className="absolute inset-0 bg-[#0a0a0c]/60 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-xl p-4">
            <div className="glass-card p-6 border border-sell/25 max-w-sm text-center space-y-3 shadow-2xl bg-black/45">
              <div className="text-3xl">🔒</div>
              <h3 className="text-sm font-bold text-sell">Trade Entry Form Locked</h3>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                Check all 11 confluence items in the Confluence Gatekeeper above to unlock price entries, notes, and screenshots.
              </p>
            </div>
          </div>
        )}

        <div className={`transition-all duration-300 ${checklistScore < 11 ? 'opacity-30 pointer-events-none select-none' : ''}`}>
          <div className="grid grid-cols-3 gap-4">
        {/* Left Column - Main Fields */}
        <div className="col-span-2 space-y-4">
          {/* Identification */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
              Identification
            </h2>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Entry Time *</label>
                <input
                  type="time"
                  className="form-input"
                  value={form.entryTime}
                  onChange={(e) => setForm({ ...form, entryTime: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Session *</label>
                <select
                  className="form-input"
                  value={form.session}
                  onChange={(e) => setForm({ ...form, session: e.target.value })}
                >
                  <option>London Open</option>
                  <option>NY Open</option>
                  <option>NY Lunch</option>
                  <option>Late NY</option>
                </select>
              </div>
              <div>
                <label className="form-label">Phase *</label>
                <select
                  className="form-input"
                  value={form.challengePhase}
                  onChange={(e) =>
                    setForm({ ...form, challengePhase: e.target.value })
                  }
                >
                  <option>Phase 1</option>
                  <option>Phase 2</option>
                  <option>Funded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Asset & Direction */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
              Asset & Direction
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label flex justify-between items-center">
                  <span>Asset *</span>
                  <a
                    href={getTradingViewUrl(form.asset)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in TradingView"
                    className="text-[9px] text-[var(--color-accent-light)] hover:underline flex items-center gap-0.5"
                  >
                    ↗️ TV Link
                  </a>
                </label>
                <select
                  className="form-input"
                  value={form.asset}
                  onChange={(e) => setForm({ ...form, asset: e.target.value })}
                >
                  <option value="XAUUSD">XAUUSD (Gold)</option>
                  <option value="BTCUSD">BTCUSD</option>
                  <option value="ETHUSD">ETHUSD</option>
                </select>
              </div>
              <div>
                <label className="form-label">Direction *</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-option flex-1 ${form.direction === 'BUY' ? 'active-buy' : ''}`}
                    onClick={() => setForm({ ...form, direction: 'BUY' })}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    className={`toggle-option flex-1 ${form.direction === 'SELL' ? 'active-sell' : ''}`}
                    onClick={() => setForm({ ...form, direction: 'SELL' })}
                  >
                    SELL
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">Setup Types *</label>
                <div className="flex flex-wrap gap-1.5">
                  {SETUP_TYPES.map((setup) => (
                    <button
                      key={setup}
                      type="button"
                      onClick={() => toggleSetup(setup)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                        form.setupTypes.includes(setup)
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                      }`}
                    >
                      {setup}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Price Levels */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
              Price Levels
            </h2>
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="form-label">Entry *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input font-mono"
                  placeholder="0.00"
                  value={form.entryPrice}
                  onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Stop Loss *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input font-mono"
                  placeholder="0.00"
                  value={form.stopLoss}
                  onChange={(e) => setForm({ ...form, stopLoss: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">TP1 *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input font-mono"
                  placeholder="0.00"
                  value={form.tp1}
                  onChange={(e) => setForm({ ...form, tp1: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">TP2 *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input font-mono"
                  placeholder="0.00"
                  value={form.tp2}
                  onChange={(e) => setForm({ ...form, tp2: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">TP3</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input font-mono"
                  placeholder="Optional"
                  value={form.tp3}
                  onChange={(e) => setForm({ ...form, tp3: e.target.value })}
                />
              </div>
            </div>

            {/* Auto-calculated stats */}
            {entry > 0 && sl > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                <div className="bg-[var(--color-surface)] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Risk</div>
                  <div className="text-sm font-bold font-mono">
                    {riskPips.toFixed(2)} pts
                  </div>
                </div>
                <div className="bg-[var(--color-surface)] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase">RR to TP1</div>
                  <div className={`text-sm font-bold font-mono ${rr1 >= 2 ? 'text-buy' : rr1 > 0 ? 'text-sell' : ''}`}>
                    1:{rr1.toFixed(2)}
                  </div>
                </div>
                <div className="bg-[var(--color-surface)] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase">RR to TP2</div>
                  <div className="text-sm font-bold font-mono text-buy">
                    1:{rr2.toFixed(2)}
                  </div>
                </div>
                <div className="bg-[var(--color-surface)] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Risk %</div>
                  <div className="text-sm font-bold font-mono">1.50%</div>
                </div>
              </div>
            )}
          </div>

          {/* Trade Outcome */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
              Trade Outcome <span className="text-[var(--color-text-muted)] normal-case">(fill after closing)</span>
            </h2>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="form-label">Exit Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input font-mono"
                  placeholder="0.00"
                  value={form.exitPrice}
                  onChange={(e) => setForm({ ...form, exitPrice: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Exit Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={form.exitTime}
                  onChange={(e) => setForm({ ...form, exitTime: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Exit Reason</label>
                <select
                  className="form-input"
                  value={form.exitReason}
                  onChange={(e) => setForm({ ...form, exitReason: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option>TP1 Hit</option>
                  <option>TP2 Hit</option>
                  <option>TP3 Hit</option>
                  <option>Stop Loss</option>
                  <option>Manual Close</option>
                  <option>Breakeven</option>
                </select>
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.partialClose}
                    onChange={(e) =>
                      setForm({ ...form, partialClose: e.target.checked })
                    }
                    className="accent-[var(--color-accent)]"
                  />
                  Partial Close
                </label>
                <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.breakevenMoved}
                    onChange={(e) =>
                      setForm({ ...form, breakevenMoved: e.target.checked })
                    }
                    className="accent-[var(--color-accent)]"
                  />
                  BE Moved
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
              Trade Notes
            </h2>
            <div className="space-y-3">
              <div>
                <label className="form-label">Pre-Trade Reasoning *</label>
                <textarea
                  className="form-input min-h-[80px] resize-y"
                  placeholder="Why are you taking this trade? What confluence do you see?"
                  value={form.preReasoning}
                  onChange={(e) =>
                    setForm({ ...form, preReasoning: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="form-label">Post-Trade Notes</label>
                <textarea
                  className="form-input min-h-[60px] resize-y"
                  placeholder="How did the trade play out? What happened?"
                  value={form.postNotes}
                  onChange={(e) =>
                    setForm({ ...form, postNotes: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="form-label">Mistakes Made</label>
                <textarea
                  className="form-input min-h-[60px] resize-y"
                  placeholder="What went wrong or could be improved?"
                  value={form.mistakes}
                  onChange={(e) =>
                    setForm({ ...form, mistakes: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Screenshots */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
              Trade Screenshots
            </h2>
            <ScreenshotUploader
              screenshots={form.screenshots}
              onChange={(urls) => setForm({ ...form, screenshots: urls })}
            />
          </div>
        </div>

        {/* Right Column - Psychology */}
        <div className="space-y-4">

          {/* Emotion Before */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              Emotion Before Entry
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => toggleEmotion(emotion, 'emotionBefore')}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                    form.emotionBefore.includes(emotion)
                      ? 'bg-[var(--color-phase2)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                  }`}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          {/* Psychology Flags */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              Psychology Flags
            </h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.revengeTradeFlag}
                  onChange={(e) =>
                    setForm({ ...form, revengeTradeFlag: e.target.checked })
                  }
                  className="accent-[var(--color-sell)]"
                />
                🔥 Revenge Trade
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.fomoFlag}
                  onChange={(e) =>
                    setForm({ ...form, fomoFlag: e.target.checked })
                  }
                  className="accent-[var(--color-warning)]"
                />
                😰 FOMO Entry
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pressureToTrade}
                  onChange={(e) =>
                    setForm({ ...form, pressureToTrade: e.target.checked })
                  }
                  className="accent-[var(--color-warning)]"
                />
                😤 Pressure to Trade
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!form.followedRules}
                  onChange={(e) =>
                    setForm({ ...form, followedRules: !e.target.checked })
                  }
                  className="accent-[var(--color-sell)]"
                />
                ❌ Broke a Rule
              </label>
              {!form.followedRules && (
                <input
                  type="text"
                  className="form-input mt-1"
                  placeholder="Which rule did you break?"
                  value={form.brokenRule}
                  onChange={(e) =>
                    setForm({ ...form, brokenRule: e.target.value })
                  }
                />
              )}
            </div>
          </div>

          {/* Discipline Rating (post-trade) */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              Discipline Rating
            </h2>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${form.disciplineRating >= star ? 'filled' : ''}`}
                  onClick={() =>
                    setForm({ ...form, disciplineRating: star })
                  }
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
