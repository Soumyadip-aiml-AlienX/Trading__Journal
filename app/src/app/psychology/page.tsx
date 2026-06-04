'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateReadinessScore } from '@/lib/calculations';
import { useToast } from '@/components/shared/Toast';

export default function PsychologyPage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    mentalState: 7,
    physicalState: 'Well Rested',
    marketConfidence: 7,
    distractionLevel: 'Fully Focused',
    sleepQuality: 'Good',
    personalStress: false,
    stressDetails: '',
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('psychology_draft');
    if (draft) {
      try {
        setForm(JSON.parse(draft));
      } catch (e) {
        console.error('Failed to parse psychology draft:', e);
      }
    }
  }, []);

  // Update form state and auto-save draft to localStorage
  const updateForm = (updates: Partial<typeof form>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('psychology_draft', JSON.stringify(next));
      return next;
    });
  };

  const readiness = calculateReadinessScore(
    form.mentalState,
    form.physicalState,
    form.marketConfidence,
    form.distractionLevel,
    form.sleepQuality,
    form.personalStress
  );

  const readinessColor =
    readiness >= 7 ? 'text-buy' : readiness >= 5 ? 'text-[var(--color-warning)]' : 'text-sell';

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          readinessScore: readiness,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      if (res.ok) {
        toast.success('Pre-session check-in saved! You are ready to trade.');
        localStorage.removeItem('psychology_draft');
        router.refresh();
      } else {
        toast.error('Failed to save check-in.');
      }
    } catch {
      toast.error('Failed to save check-in.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">🧠 Pre-Session Check-In</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Complete this check-in before your first trade each day. Draft is automatically saved.
        </p>
      </div>

      {/* Readiness Score */}
      <div className="glass-card p-6 text-center">
        <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Overall Trading Readiness
        </div>
        <div className={`text-5xl font-bold ${readinessColor}`}>
          {readiness.toFixed(1)}
        </div>
        <div className="text-xs text-[var(--color-text-muted)] mt-1">out of 10</div>
        {readiness < 4 && (
          <div className="mt-3 text-xs text-sell bg-[var(--color-sell-bg)] rounded-lg px-4 py-2 inline-block">
            🚫 Not recommended to trade today
          </div>
        )}
        {readiness >= 4 && readiness < 6 && (
          <div className="mt-3 text-xs text-[var(--color-warning)] bg-[var(--color-warning-bg)] rounded-lg px-4 py-2 inline-block">
            ⚠️ Consider paper trading today
          </div>
        )}
        {readiness >= 7 && (
          <div className="mt-3 text-xs text-buy bg-[var(--color-buy-bg)] rounded-lg px-4 py-2 inline-block">
            ✅ Good to trade
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="glass-card p-5 space-y-5">
        {/* Mental State */}
        <div>
          <label className="form-label">Mental State ({form.mentalState}/10)</label>
          <input
            type="range"
            min="1"
            max="10"
            value={form.mentalState}
            onChange={(e) => updateForm({ mentalState: parseInt(e.target.value) })}
            className="w-full accent-[var(--color-accent)]"
          />
          <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
            <span>Very Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Physical State */}
        <div>
          <label className="form-label">Physical State</label>
          <div className="flex gap-2">
            {['Well Rested', 'Slightly Tired', 'Fatigued'].map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => updateForm({ physicalState: state })}
                className={`text-xs font-medium px-4 py-2 rounded-lg transition-all ${
                  form.physicalState === state
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        {/* Market Confidence */}
        <div>
          <label className="form-label">Market Confidence ({form.marketConfidence}/10)</label>
          <input
            type="range"
            min="1"
            max="10"
            value={form.marketConfidence}
            onChange={(e) => updateForm({ marketConfidence: parseInt(e.target.value) })}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>

        {/* Distraction Level */}
        <div>
          <label htmlFor="psych-distraction" className="form-label">Distraction Level</label>
          <select
            id="psych-distraction"
            className="form-input"
            value={form.distractionLevel}
            onChange={(e) => updateForm({ distractionLevel: e.target.value })}
          >
            <option>Fully Focused</option>
            <option>Minor Distractions</option>
            <option>Significant Distractions</option>
          </select>
        </div>

        {/* Sleep Quality */}
        <div>
          <label className="form-label">Sleep Quality Last Night</label>
          <div className="flex gap-2">
            {['Excellent', 'Good', 'Poor'].map((quality) => (
              <button
                key={quality}
                type="button"
                onClick={() => updateForm({ sleepQuality: quality })}
                className={`text-xs font-medium px-4 py-2 rounded-lg transition-all ${
                  form.sleepQuality === quality
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }`}
              >
                {quality}
              </button>
            ))}
          </div>
        </div>

        {/* Personal Stress */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.personalStress}
              onChange={(e) => updateForm({ personalStress: e.target.checked })}
              className="accent-[var(--color-warning)]"
            />
            <span className="text-sm text-[var(--color-text-secondary)]">Any personal stress today?</span>
          </label>
          {form.personalStress && (
            <textarea
              id="psych-stress-details"
              className="form-input mt-2 min-h-[60px]"
              placeholder="Describe what's on your mind..."
              value={form.stressDetails}
              onChange={(e) => updateForm({ stressDetails: e.target.value })}
            />
          )}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
        {saving ? 'Saving...' : '✅ Complete Check-In'}
      </button>
    </div>
  );
}
