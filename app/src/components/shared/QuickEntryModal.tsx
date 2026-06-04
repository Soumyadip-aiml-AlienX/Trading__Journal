'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/shared/Toast';

export default function QuickEntryModal() {
  const router = useRouter();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    asset: 'XAUUSD',
    direction: 'BUY' as 'BUY' | 'SELL',
    entryPrice: '',
    stopLoss: '',
    tp1: '',
    tp2: '',
  });

  // Global key listener for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl+Shift+N or Cmd+Shift+N is pressed
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      
      // Ctrl+Shift+E: Export Page
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        router.push('/export');
      }

      // Ctrl+Shift+D: Daily Reflection
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        router.push('/reflection');
      }

      // Ctrl+Shift+R: Risk Monitor
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        router.push('/risk');
      }
      
      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Focus trap when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const modalElement = document.getElementById('quick-entry-modal-container');
    if (!modalElement) return;

    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the first element when opening
    setTimeout(() => {
      firstElement?.focus();
    }, 50);

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.entryPrice || !form.stopLoss || !form.tp1) {
      toast.warning('Please fill entry price, SL, and TP1.');
      return;
    }

    setSaving(true);
    try {
      const nowStr = new Date().toISOString();
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: nowStr.split('T')[0],
          entryTime: nowStr,
          session: 'NY Open',
          challengePhase: 'Phase 1',
          asset: form.asset,
          direction: form.direction,
          entryPrice: parseFloat(form.entryPrice),
          stopLoss: parseFloat(form.stopLoss),
          tp1: parseFloat(form.tp1),
          tp2: form.tp2 ? parseFloat(form.tp2) : parseFloat(form.tp1) * 1.01, // fallback
          preReasoning: 'Quick Entry draft',
          checklistItems: new Array(11).fill(false),
          emotionBefore: ['Calm'],
        }),
      });

      if (res.ok) {
        setForm({
          asset: 'XAUUSD',
          direction: 'BUY',
          entryPrice: '',
          stopLoss: '',
          tp1: '',
          tp2: '',
        });
        setIsOpen(false);
        router.refresh();
        // Redirect to trade details page to fill remaining data
        const createdTrade = await res.json();
        toast.success('Quick trade draft created!');
        router.push(`/trades/${createdTrade.id}`);
      } else {
        toast.error('Failed to save quick trade.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving quick trade.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div
        id="quick-entry-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-entry-title"
        className="glass-card max-w-sm w-full p-5 space-y-4 border border-[var(--color-accent)] border-opacity-30 shadow-2xl relative"
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3.5 right-3.5 text-xs text-[var(--color-text-muted)] hover:text-white cursor-pointer"
        >
          ✕ Close (Esc)
        </button>

        <div>
          <h2 id="quick-entry-title" className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <span>⚡ Quick Trade Entry</span>
          </h2>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            Create a draft trade quickly. You will be redirected to complete the checklist and notes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Asset & Dir */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="quick-asset" className="form-label">Asset</label>
              <select
                id="quick-asset"
                className="form-input text-xs"
                value={form.asset}
                onChange={(e) => setForm({ ...form, asset: e.target.value })}
              >
                <option value="XAUUSD">XAUUSD (Gold)</option>
                <option value="BTCUSD">BTCUSD</option>
                <option value="ETHUSD">ETHUSD</option>
              </select>
            </div>
            <div>
              <label className="form-label">Direction</label>
              <div className="toggle-group text-[10px]">
                <button
                  type="button"
                  className={`toggle-option flex-1 py-1 px-3 ${form.direction === 'BUY' ? 'active-buy' : ''}`}
                  onClick={() => setForm({ ...form, direction: 'BUY' })}
                >
                  BUY
                </button>
                <button
                  type="button"
                  className={`toggle-option flex-1 py-1 px-3 ${form.direction === 'SELL' ? 'active-sell' : ''}`}
                  onClick={() => setForm({ ...form, direction: 'SELL' })}
                >
                  SELL
                </button>
              </div>
            </div>
          </div>

          {/* Price Levels */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="quick-entry" className="form-label">Entry</label>
              <input
                id="quick-entry"
                type="number"
                step="0.01"
                required
                className="form-input text-xs font-mono"
                placeholder="0.00"
                value={form.entryPrice}
                onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="quick-sl" className="form-label">Stop Loss</label>
              <input
                id="quick-sl"
                type="number"
                step="0.01"
                required
                className="form-input text-xs font-mono"
                placeholder="0.00"
                value={form.stopLoss}
                onChange={(e) => setForm({ ...form, stopLoss: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="quick-tp1" className="form-label">TP1</label>
              <input
                id="quick-tp1"
                type="number"
                step="0.01"
                required
                className="form-input text-xs font-mono"
                placeholder="0.00"
                value={form.tp1}
                onChange={(e) => setForm({ ...form, tp1: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full text-xs py-2 mt-2"
          >
            {saving ? 'Creating Draft...' : '⚡ Quick Save & Edit'}
          </button>
        </form>
      </div>
    </div>
  );
}
