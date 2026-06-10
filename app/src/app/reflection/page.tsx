'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';

export default function ReflectionPage() {
  const toast = useToast();
  const [form, setForm] = useState({
    marketBias: 'Neutral',
    goldBehaviour: '',
    cryptoBehaviour: '',
    keyNewsEvents: '',
    goodDayToTrade: 3,
    strategyRating: 5,
    setupsWorked: [] as string[],
    setupsFailed: [] as string[],
    obQuality: 3,
    fvgReliability: 3,
    followedPlan: 'Yes',
    biggestMistake: '',
    biggestSuccess: '',
    whatDifferently: '',
    lessonLearned: '',
    keyLevels: '',
    expectedBias: 'Neutral',
    scheduledNews: '',
    tradingGoals: '',
  });
  const [saving, setSaving] = useState(false);
  const [todayTrades, setTodayTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  const SETUPS = ['Order Block', 'FVG', 'OTE', 'Liquidity Grab', 'BOS Retest'];

  // Load draft from localStorage and fetch today's trades on mount
  useEffect(() => {
    const draft = localStorage.getItem('reflection_draft');
    if (draft) {
      try {
        setForm(JSON.parse(draft));
      } catch (e) {
        console.error('Failed to parse reflection draft:', e);
      }
    }

    async function fetchTodayTrades() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/trades?dateFrom=${todayStr}&dateTo=${todayStr}`);
        if (res.ok) {
          setTodayTrades(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch today\'s trades:', err);
      } finally {
        setLoadingTrades(false);
      }
    }
    fetchTodayTrades();
  }, []);

  // Update form state and auto-save draft to localStorage
  const updateForm = (updates: Partial<typeof form>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('reflection_draft', JSON.stringify(next));
      return next;
    });
  };

  const toggleSetup = (setup: string, field: 'setupsWorked' | 'setupsFailed') => {
    const list = form[field] as string[];
    const nextList = list.includes(setup)
      ? list.filter((s) => s !== setup)
      : [...list, setup];
    updateForm({ [field]: nextList });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/daily-log', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          setupsWorked: JSON.stringify(form.setupsWorked),
          setupsFailed: JSON.stringify(form.setupsFailed),
          date: new Date().toISOString().split('T')[0],
        }),
      });
      if (res.ok) {
        toast.success('Daily reflection saved!');
        localStorage.removeItem('reflection_draft');
      } else {
        toast.error('Failed to save reflection.');
      }
    } catch {
      toast.error('Failed to save reflection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">📝 Daily Reflection</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Complete this reflection at the end of each trading session. Draft is automatically saved.
        </p>
      </div>

      {/* Today's Trades Summary (CO8) */}
      {!loadingTrades && todayTrades.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-l-[var(--color-accent)] bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-navy-light)]">
          <h3 className="text-xs font-bold text-[var(--color-text-primary)] mb-3 uppercase tracking-wide">
            📊 Today&apos;s Trading Activity
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Trades Taken</span>
              <p className="text-lg font-bold text-white">{todayTrades.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Wins / Losses</span>
              <p className="text-lg font-bold text-white">
                <span className="text-buy">{todayTrades.filter(t => t.status === 'closed' && (t.actualPnlPct ?? 0) > 0).length}</span>
                {' / '}
                <span className="text-sell">{todayTrades.filter(t => t.status === 'closed' && (t.actualPnlPct ?? 0) <= 0).length}</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Net P&L</span>
              <p className={`text-lg font-bold ${
                todayTrades.reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0) >= 0 ? 'text-buy' : 'text-sell'
              }`}>
                {todayTrades.reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0) >= 0 ? '+' : ''}
                {todayTrades.reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0).toFixed(2)}%
              </p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Avg Setup Score</span>
              <p className="text-lg font-bold text-white">
                {(todayTrades.reduce((sum, t) => sum + t.checklistScore, 0) / todayTrades.length).toFixed(1)}/36
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Market Conditions */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Market Conditions
        </h2>
        <div>
          <label htmlFor="reflection-market-bias" className="form-label">Overall Market Bias Today</label>
          <select
            id="reflection-market-bias"
            className="form-input"
            value={form.marketBias}
            onChange={(e) => updateForm({ marketBias: e.target.value })}
          >
            <option>Strongly Bullish</option>
            <option>Bullish</option>
            <option>Neutral</option>
            <option>Bearish</option>
            <option>Strongly Bearish</option>
          </select>
        </div>
        <div>
          <label htmlFor="reflection-gold" className="form-label">Gold Behaviour</label>
          <textarea
            id="reflection-gold"
            className="form-input min-h-[60px]"
            placeholder="How did Gold move today?"
            value={form.goldBehaviour}
            onChange={(e) => updateForm({ goldBehaviour: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="reflection-crypto" className="form-label">Crypto Behaviour</label>
          <textarea
            id="reflection-crypto"
            className="form-input min-h-[60px]"
            placeholder="How did BTC/ETH behave?"
            value={form.cryptoBehaviour}
            onChange={(e) => updateForm({ cryptoBehaviour: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">Was today a good day to trade? ({form.goodDayToTrade}/5)</label>
          <input
            type="range"
            min="1"
            max="5"
            value={form.goodDayToTrade}
            onChange={(e) => updateForm({ goodDayToTrade: parseInt(e.target.value) })}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Strategy Review */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Strategy Review
        </h2>
        <div>
          <label className="form-label">Strategy Effectiveness ({form.strategyRating}/10)</label>
          <input
            type="range"
            min="1"
            max="10"
            value={form.strategyRating}
            onChange={(e) => updateForm({ strategyRating: parseInt(e.target.value) })}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="form-label">Setups that Worked</label>
          <div className="flex flex-wrap gap-1.5">
            {SETUPS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSetup(s, 'setupsWorked')}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                  form.setupsWorked.includes(s)
                    ? 'bg-[var(--color-buy)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label">Setups that Failed</label>
          <div className="flex flex-wrap gap-1.5">
            {SETUPS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSetup(s, 'setupsFailed')}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                  form.setupsFailed.includes(s)
                    ? 'bg-[var(--color-sell)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Personal Performance */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Personal Performance
        </h2>
        <div>
          <label className="form-label">Did I follow my trading plan?</label>
          <div className="flex gap-2">
            {['Yes', 'Mostly', 'No'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => updateForm({ followedPlan: opt })}
                className={`text-xs font-medium px-4 py-2 rounded-lg transition-all ${
                  form.followedPlan === opt
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="reflection-mistake" className="form-label">Biggest Mistake</label>
          <textarea
            id="reflection-mistake"
            className="form-input min-h-[60px]"
            value={form.biggestMistake}
            onChange={(e) => updateForm({ biggestMistake: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="reflection-success" className="form-label">Biggest Success</label>
          <textarea
            id="reflection-success"
            className="form-input min-h-[60px]"
            value={form.biggestSuccess}
            onChange={(e) => updateForm({ biggestSuccess: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="reflection-lesson" className="form-label">One Lesson Learned Today</label>
          <textarea
            id="reflection-lesson"
            className="form-input min-h-[60px]"
            placeholder="This will be saved to your Lessons database"
            value={form.lessonLearned}
            onChange={(e) => updateForm({ lessonLearned: e.target.value })}
          />
        </div>
      </div>

      {/* Tomorrow's Plan */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Tomorrow&apos;s Plan
        </h2>
        <div>
          <label htmlFor="reflection-levels" className="form-label">Key Levels to Watch</label>
          <textarea
            id="reflection-levels"
            className="form-input min-h-[60px]"
            value={form.keyLevels}
            onChange={(e) => updateForm({ keyLevels: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="reflection-expected-bias" className="form-label">Expected Bias</label>
          <select
            id="reflection-expected-bias"
            className="form-input"
            value={form.expectedBias}
            onChange={(e) => updateForm({ expectedBias: e.target.value })}
          >
            <option>Strongly Bullish</option>
            <option>Bullish</option>
            <option>Neutral</option>
            <option>Bearish</option>
            <option>Strongly Bearish</option>
          </select>
        </div>
        <div>
          <label htmlFor="reflection-goals" className="form-label">Trading Goals for Tomorrow</label>
          <textarea
            id="reflection-goals"
            className="form-input min-h-[60px]"
            value={form.tradingGoals}
            onChange={(e) => updateForm({ tradingGoals: e.target.value })}
          />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
        {saving ? 'Saving...' : '📝 Save Daily Reflection'}
      </button>
    </div>
  );
}
