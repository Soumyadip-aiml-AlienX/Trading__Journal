'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScreenshotUploader from '@/components/trades/ScreenshotUploader';
import { useToast } from '@/components/shared/Toast';
import TradingViewChart, { getTradingViewUrl } from '@/components/shared/TradingViewChart';

interface Trade {
  id: string;
  tradeCode: string;
  date: string;
  entryTime: string;
  exitTime: string | null;
  session: string;
  challengePhase: string;
  asset: string;
  direction: 'BUY' | 'SELL';
  setupTypes: string; // JSON array
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number | null;
  exitPrice: number | null;
  exitReason: string | null;
  actualPnlPct: number | null;
  riskPips: number | null;
  rr1: number | null;
  rr2: number | null;
  rr3: number | null;
  checklistScore: number;
  checklistItems: string; // JSON array of booleans
  preReasoning: string;
  postNotes: string | null;
  mistakes: string | null;
  partialClose: boolean;
  breakevenMoved: boolean;
  screenshots: string; // JSON string array
  emotionBefore: string; // JSON string array
  emotionAfter: string | null; // JSON string array
  disciplineRating: number | null;
  wouldRetake: string | null;
  revengeTradeFlag: boolean;
  fomoFlag: boolean;
  followedRules: boolean;
  brokenRule: string | null;
  pressureToTrade: boolean;
  status: string;
}

const GROUPS = [
  {
    badge: 'PRE-SESSION',
    steps: [
      { num: 1, title: 'Confirm it is NY Open session: 5:30 PM – 7:30 PM IST', path: undefined },
      { num: 2, title: 'Select the asset to analyse: XAUUSD or EURUSD', path: undefined },
      { num: 3, title: 'Check Forex Factory: no red news within 30 minutes of current IST time', path: undefined },
      { num: 4, title: 'Confirm: daily drawdown below 2% AND trades taken today below 2', path: undefined },
    ]
  },
  {
    badge: '1H',
    steps: [
      { num: 5, title: 'Open the 1H chart for the selected asset', path: undefined },
      { num: 6, title: 'Identify the most recent 1H Break of Structure (BOS)', path: undefined },
      { num: 7, title: 'Confirm and record the bias: BULLISH or BEARISH', path: undefined },
    ]
  },
  {
    badge: '1H',
    steps: [
      { num: 8, title: "Mark the most recent 1H Swing High — label '1H Swing High'", path: undefined },
      { num: 9, title: "Mark the most recent 1H Swing Low — label '1H Swing Low'", path: undefined },
      { num: 10, title: 'Note which liquidity level institutions will target first', path: undefined },
    ]
  },
  {
    badge: '15M',
    steps: [
      { num: 11, title: 'Switch to 15M chart', path: undefined },
      { num: 12, title: "Mark most recent 15M Swing High — label '15M Swing High'", path: undefined },
      { num: 13, title: "Mark most recent 15M Swing Low — label '15M Swing Low'", path: undefined },
      { num: 14, title: 'Confirm 15M structure agrees with 1H bias', path: undefined },
    ]
  },
  {
    badge: '15M',
    steps: [
      { num: 15, title: 'Focus on the 15M Swing Low area', path: 'bullish' },
      { num: 16, title: 'Search for Bullish Order Block in the swing low area', path: 'bullish' },
      { num: 17, title: 'Search for Bullish FVG in the swing low area', path: 'bullish' },
      { num: 18, title: 'If both exist: select the one closest to price as active zone', path: 'bullish' },
      { num: 19, title: 'Note if OB and FVG overlap', path: 'bullish' },
      { num: 15, title: 'Focus on the 15M Swing High area', path: 'bearish' },
      { num: 16, title: 'Search for Bearish Order Block in the swing high area', path: 'bearish' },
      { num: 17, title: 'Search for Bearish FVG in the swing high area', path: 'bearish' },
      { num: 18, title: 'If both exist: select the one closest to price as active zone', path: 'bearish' },
      { num: 19, title: 'Note if OB and FVG overlap', path: 'bearish' },
    ]
  },
  {
    badge: '15M',
    steps: [
      { num: 20, title: 'Draw shaded rectangle over the active OB or FVG zone on 15M', path: undefined },
      { num: 21, title: 'Set price alert at entry edge of the zone', path: undefined },
      { num: 22, title: 'Wait — do not act until price reaches the zone', path: undefined },
      { num: 23, title: 'Price entered zone — confirm visible reaction', path: undefined },
    ]
  },
  {
    badge: '1M',
    steps: [
      { num: 24, title: 'Switch to 1M chart ONLY after price enters and reacts inside zone', path: undefined },
      { num: 25, title: 'Identify the most recent minor 1M swing level in trade direction', path: undefined },
      { num: 26, title: 'Wait for the FIRST 1M candle BODY to close beyond the swing level', path: undefined },
      { num: 27, title: 'Wait for the SECOND consecutive 1M candle BODY to also close', path: undefined },
      { num: 28, title: 'Confirmed: two consecutive 1M body closes in trade direction', path: undefined },
    ]
  },
  {
    badge: 'ENTRY',
    steps: [
      { num: 29, title: 'Final confirmation: all prior steps verified', path: undefined },
      { num: 30, title: 'Enter at market on close of second confirming 1M candle', path: undefined },
      { num: 31, title: 'Place SL behind full zone with buffer', path: undefined },
      { num: 32, title: 'Verify risk is exactly 1% of account — set position size', path: undefined },
      { num: 33, title: 'Set TP1 at 1:1 RR', path: undefined },
      { num: 34, title: 'Set TP2 at exactly 1:5 RR', path: undefined },
      { num: 35, title: 'Screenshot: 1H, 15M and 1M chart with levels', path: undefined },
      { num: 36, title: 'Log trade in journal with exact IST entry time', path: undefined },
    ]
  }
];

const getChecklistNames = (direction: 'BUY' | 'SELL') => {
  const names: string[] = [];
  const biasPath = direction === 'BUY' ? 'bullish' : 'bearish';
  GROUPS.forEach(group => {
    group.steps.forEach(step => {
      if (!step.path || step.path === biasPath) {
        names.push(`Step ${step.num} [${group.badge}]: ${step.title}`);
      }
    });
  });
  return names;
};

const EMOTIONS = ['Confident', 'Anxious', 'FOMO', 'Patient', 'Greedy', 'Uncertain', 'Calm'];

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLiveChart, setShowLiveChart] = useState(false);

  // Form states for closing or editing trade
  const [exitPrice, setExitPrice] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [partialClose, setPartialClose] = useState(false);
  const [breakevenMoved, setBreakevenMoved] = useState(false);
  const [postNotes, setPostNotes] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [emotionAfter, setEmotionAfter] = useState<string[]>([]);
  const [disciplineRating, setDisciplineRating] = useState(0);
  const [wouldRetake, setWouldRetake] = useState('');
  
  // Extra states for general editing
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [tp1, setTp1] = useState('');
  const [tp2, setTp2] = useState('');
  const [tp3, setTp3] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);

  useEffect(() => {
    async function fetchTrade() {
      try {
        const res = await fetch(`/api/trades/${id}`);
        if (res.ok) {
          const data: Trade = await res.json();
          setTrade(data);
          
          // Pre-populate fields
          setExitPrice(data.exitPrice?.toString() ?? '');
          setExitTime(data.exitTime ? new Date(data.exitTime).toTimeString().slice(0, 5) : '');
          setExitReason(data.exitReason ?? '');
          setPartialClose(data.partialClose);
          setBreakevenMoved(data.breakevenMoved);
          setPostNotes(data.postNotes ?? '');
          setMistakes(data.mistakes ?? '');
          setEmotionAfter(data.emotionAfter ? JSON.parse(data.emotionAfter) : []);
          setDisciplineRating(data.disciplineRating ?? 0);
          setWouldRetake(data.wouldRetake ?? '');
          
          setEntryPrice(data.entryPrice.toString());
          setStopLoss(data.stopLoss.toString());
          setTp1(data.tp1.toString());
          setTp2(data.tp2.toString());
          setTp3(data.tp3?.toString() ?? '');
          setScreenshots(data.screenshots ? JSON.parse(data.screenshots) : []);
        } else {
          toast.error('Trade not found');
          router.push('/trades');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrade();
  }, [id, router]);

  const handleCloseOrUpdate = async () => {
    if (!trade) return;
    
    setSaving(true);
    try {
      const parsedSetupTypes = JSON.parse(trade.setupTypes);
      const parsedChecklistItems = JSON.parse(trade.checklistItems);
      const parsedEmotionBefore = JSON.parse(trade.emotionBefore);

      const payload = {
        ...trade,
        entryPrice: parseFloat(entryPrice),
        stopLoss: parseFloat(stopLoss),
        tp1: parseFloat(tp1),
        tp2: parseFloat(tp2),
        tp3: tp3 ? parseFloat(tp3) : null,
        exitPrice: exitPrice ? parseFloat(exitPrice) : null,
        exitTime: exitTime ? `${trade.date.split('T')[0]}T${exitTime}:00Z` : null,
        exitReason: exitReason || null,
        partialClose,
        breakevenMoved,
        postNotes: postNotes || null,
        mistakes: mistakes || null,
        emotionBefore: parsedEmotionBefore,
        emotionAfter: emotionAfter.length > 0 ? emotionAfter : null,
        disciplineRating: disciplineRating || null,
        wouldRetake: wouldRetake || null,
        screenshots,
        setupTypes: parsedSetupTypes,
        checklistItems: parsedChecklistItems,
      };

      const res = await fetch(`/api/trades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setTrade(updated);
        setIsEditing(false);
        toast.success('Trade updated successfully!');
      } else {
        toast.error('Failed to update trade.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating trade.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trade permanently?')) return;

    try {
      const res = await fetch(`/api/trades/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Trade deleted successfully.');
        router.push('/trades');
      } else {
        toast.error('Failed to delete trade.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting trade.');
    }
  };

  const toggleEmotionAfter = (emotion: string) => {
    setEmotionAfter((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trade) return null;

  const parsedSetupTypes: string[] = JSON.parse(trade.setupTypes);
  const parsedChecklistItems: boolean[] = JSON.parse(trade.checklistItems);
  const parsedEmotionBefore: string[] = JSON.parse(trade.emotionBefore);
  const parsedScreenshots: string[] = JSON.parse(trade.screenshots);

  const isTradeOpen = trade.status === 'open';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/trades" className="btn-secondary text-xs px-3 py-1.5">
            ← Back to Log
          </Link>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <span>Trade {trade.tradeCode}</span>
              <span className={`badge ${trade.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                {trade.direction}
              </span>
              <span className={`badge ${isTradeOpen ? 'badge-open' : 'badge-closed'}`}>
                {trade.status}
              </span>
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowLiveChart(!showLiveChart)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
              showLiveChart
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                : 'bg-[var(--color-navy)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            <span>{showLiveChart ? '❌ Hide Chart' : '📊 Live Chart'}</span>
          </button>
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} className="btn-secondary text-xs px-4 py-1.5">
                ✏️ Edit Trade
              </button>
              <button onClick={handleDelete} className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 font-medium px-4 py-1.5 rounded-lg text-xs cursor-pointer">
                🗑️ Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="btn-secondary text-xs px-4 py-1.5">
                Cancel
              </button>
              <button onClick={handleCloseOrUpdate} disabled={saving} className="btn-primary text-xs px-5 py-1.5">
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-5">
        {/* Left Columns - Metrics & Notes */}
        <div className="col-span-2 space-y-5">
          {/* Prices & Outcomes */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
              Trade Parameters
            </h3>
            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block mb-1">ASSET</span>
                <span className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  {trade.asset}
                  <a
                    href={getTradingViewUrl(trade.asset)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in TradingView"
                    className="text-xs opacity-55 hover:opacity-100 transition-opacity hover:text-[var(--color-accent-light)]"
                  >
                    ↗️
                  </a>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block mb-1">DATE / TIME</span>
                <span className="text-xs font-medium text-[var(--color-text-primary)] block">
                  {new Date(trade.date).toLocaleDateString()}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                  {new Date(trade.entryTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block mb-1">SESSION</span>
                <span className="text-xs font-bold text-[var(--color-text-primary)]">{trade.session}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block mb-1">CHALLENGE PHASE</span>
                <span className="text-xs font-bold text-[var(--color-text-primary)]">{trade.challengePhase}</span>
              </div>
            </div>

            <hr className="border-[var(--color-border)] my-4" />

            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="form-label">Entry Price</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className="form-input font-mono"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                  />
                ) : (
                  <span className="text-sm font-mono font-bold">{trade.entryPrice.toFixed(2)}</span>
                )}
              </div>
              <div>
                <label className="form-label">Stop Loss</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className="form-input font-mono text-sell"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                  />
                ) : (
                  <span className="text-sm font-mono font-semibold text-sell">{trade.stopLoss.toFixed(2)}</span>
                )}
              </div>
              <div>
                <label className="form-label">TP1</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className="form-input font-mono"
                    value={tp1}
                    onChange={(e) => setTp1(e.target.value)}
                  />
                ) : (
                  <span className="text-sm font-mono">{trade.tp1.toFixed(2)}</span>
                )}
              </div>
              <div>
                <label className="form-label">TP2</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className="form-input font-mono"
                    value={tp2}
                    onChange={(e) => setTp2(e.target.value)}
                  />
                ) : (
                  <span className="text-sm font-mono">{trade.tp2.toFixed(2)}</span>
                )}
              </div>
              <div>
                <label className="form-label">TP3</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className="form-input font-mono"
                    placeholder="Optional"
                    value={tp3}
                    onChange={(e) => setTp3(e.target.value)}
                  />
                ) : (
                  <span className="text-sm font-mono">{trade.tp3?.toFixed(2) ?? '—'}</span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3 bg-[var(--color-navy)] rounded-lg p-3">
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block">RISK PIPS</span>
                <span className="text-xs font-mono font-bold">{(trade.riskPips ?? 0).toFixed(2)} pts</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block">RR TO TP1</span>
                <span className="text-xs font-mono font-bold">1:{(trade.rr1 ?? 0).toFixed(1)}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block">RR TO TP2</span>
                <span className="text-xs font-mono font-bold">1:{(trade.rr2 ?? 0).toFixed(1)}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block">PNL PERCENT</span>
                <span className={`text-xs font-mono font-bold ${trade.status === 'closed' ? ((trade.actualPnlPct ?? 0) >= 0 ? 'text-buy' : 'text-sell') : 'text-[var(--color-text-muted)]'}`}>
                  {trade.status === 'closed'
                    ? `${(trade.actualPnlPct ?? 0) >= 0 ? '+' : ''}${(trade.actualPnlPct ?? 0).toFixed(2)}%`
                    : 'OPEN'}
                </span>
              </div>
            </div>
          </div>

          {/* Collapsible Live TradingView Chart */}
          {showLiveChart && (
            <div className="glass-card p-5 h-[480px] border border-[var(--color-accent)] border-opacity-35 animate-fade-in relative z-20">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold flex items-center gap-1.5 text-[var(--color-text-primary)]">
                  🖥️ Live Interactive Chart: {trade.asset}
                </span>
                <a
                  href={getTradingViewUrl(trade.asset)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent-light)] hover:underline font-bold text-[10px] flex items-center gap-0.5"
                >
                  ↗️ Open Full Page
                </a>
              </div>
              <div className="h-[400px] relative">
                <TradingViewChart symbol={trade.asset} />
              </div>
            </div>
          )}

          {/* Trade Outcome form (rendered when open, or editing) */}
          {(isTradeOpen || isEditing) && (
            <div className="glass-card p-5 border-[var(--color-accent-light)] border-opacity-30">
              <h3 className="text-xs font-semibold text-[var(--color-accent-light)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>🚪 Trade Outcome / Close Trade</span>
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Exit Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="form-input font-mono"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Exit Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={exitTime}
                    onChange={(e) => setExitTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Exit Reason *</label>
                  <select
                    className="form-input"
                    value={exitReason}
                    onChange={(e) => setExitReason(e.target.value)}
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
              </div>

              <div className="flex gap-4 mt-3">
                <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partialClose}
                    onChange={(e) => setPartialClose(e.target.checked)}
                    className="accent-[var(--color-accent)]"
                  />
                  Partial Close
                </label>
                <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={breakevenMoved}
                    onChange={(e) => setBreakevenMoved(e.target.checked)}
                    className="accent-[var(--color-accent)]"
                  />
                  BE Moved
                </label>
              </div>

              {/* Post trade psychology */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="form-label">Emotion After Exit</label>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOTIONS.map((emotion) => (
                      <button
                        key={emotion}
                        type="button"
                        onClick={() => toggleEmotionAfter(emotion)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                          emotionAfter.includes(emotion)
                            ? 'bg-purple-600 text-white'
                            : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                        }`}
                      >
                        {emotion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Discipline Rating (1-5)</label>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${disciplineRating >= star ? 'filled' : ''}`}
                          onClick={() => setDisciplineRating(star)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Would you retake this trade?</label>
                    <select
                      className="form-input"
                      value={wouldRetake}
                      onChange={(e) => setWouldRetake(e.target.value)}
                    >
                      <option value="">Select...</option>
                      <option>Yes</option>
                      <option>No</option>
                      <option>Maybe</option>
                    </select>
                  </div>
                </div>
              </div>

              {isTradeOpen && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleCloseOrUpdate}
                    disabled={saving || !exitPrice || !exitReason}
                    className="btn-buy text-xs px-6 py-2"
                  >
                    {saving ? 'Closing...' : 'Close Trade Out'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Screenshots Gallery */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
              Screenshots Gallery
            </h3>
            {isEditing ? (
              <ScreenshotUploader screenshots={screenshots} onChange={(urls) => setScreenshots(urls)} />
            ) : parsedScreenshots.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {parsedScreenshots.map((url, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-[var(--color-border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Screenshot ${idx + 1}`} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-6">No screenshots uploaded for this trade.</p>
            )}
          </div>

          {/* Notes */}
          <div className="glass-card p-5 space-y-4">
            <div>
              <h4 className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                Pre-Trade Reasoning
              </h4>
              <p className="text-xs bg-[var(--color-navy)] rounded-lg p-3 border border-[var(--color-border)] whitespace-pre-wrap leading-relaxed text-[var(--color-text-primary)]">
                {trade.preReasoning}
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                Post-Trade Notes
              </h4>
              {isEditing ? (
                <textarea
                  className="form-input min-h-[80px]"
                  value={postNotes}
                  onChange={(e) => setPostNotes(e.target.value)}
                />
              ) : trade.postNotes ? (
                <p className="text-xs bg-[var(--color-navy)] rounded-lg p-3 border border-[var(--color-border)] whitespace-pre-wrap leading-relaxed">
                  {trade.postNotes}
                </p>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)] italic">No post-trade notes logged.</p>
              )}
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                Mistakes Identified
              </h4>
              {isEditing ? (
                <textarea
                  className="form-input min-h-[60px]"
                  value={mistakes}
                  onChange={(e) => setMistakes(e.target.value)}
                />
              ) : trade.mistakes ? (
                <p className="text-xs bg-[var(--color-sell-bg)] text-sell border border-red-900/30 rounded-lg p-3 whitespace-pre-wrap">
                  {trade.mistakes}
                </p>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)] italic">No mistakes logged.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Checklist & Psychology */}
        <div className="space-y-5">
          {/* Confluences Checklist */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4 flex justify-between items-center">
              <span>SMC Confluences</span>
              <span className={`text-sm font-bold ${trade.checklistScore === 36 ? 'text-buy' : 'text-sell'}`}>
                {trade.checklistScore}/36
              </span>
            </h3>
            
            <div className="space-y-1">
              {getChecklistNames(trade.direction).map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-1 text-xs">
                  <span className={`text-sm ${parsedChecklistItems[i] ? 'text-buy' : 'text-[var(--color-text-muted)]'}`}>
                    {parsedChecklistItems[i] ? '✓' : '✗'}
                  </span>
                  <span className={parsedChecklistItems[i] ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-muted)]'}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Psychology Setup */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Psychology Tracking
            </h3>

            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] block mb-1">SETUP TYPES</span>
              <div className="flex flex-wrap gap-1">
                {parsedSetupTypes.map((setup) => (
                  <span key={setup} className="text-[9px] font-bold bg-[var(--color-surface-overlay)] text-[var(--color-accent-light)] border border-[var(--color-border)] px-2 py-0.5 rounded">
                    {setup}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] block mb-1">EMOTION BEFORE ENTRY</span>
              <div className="flex flex-wrap gap-1">
                {parsedEmotionBefore.map((emotion) => (
                  <span key={emotion} className="text-[9px] font-bold bg-blue-950/40 text-blue-400 border border-blue-900/30 px-2 py-0.5 rounded">
                    {emotion}
                  </span>
                ))}
              </div>
            </div>

            {trade.emotionAfter && (
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block mb-1">EMOTION AFTER EXIT</span>
                <div className="flex flex-wrap gap-1">
                  {(JSON.parse(trade.emotionAfter) as string[]).map((emotion) => (
                    <span key={emotion} className="text-[9px] font-bold bg-purple-950/40 text-purple-400 border border-purple-900/30 px-2 py-0.5 rounded">
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-[var(--color-border)]" />

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">🔥 Revenge Trade:</span>
                <span className={trade.revengeTradeFlag ? 'text-sell font-bold' : 'text-[var(--color-text-muted)]'}>
                  {trade.revengeTradeFlag ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">😰 FOMO Entry:</span>
                <span className={trade.fomoFlag ? 'text-warn font-bold' : 'text-[var(--color-text-muted)]'}>
                  {trade.fomoFlag ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">😤 Pressure to Trade:</span>
                <span className={trade.pressureToTrade ? 'text-warn font-bold' : 'text-[var(--color-text-muted)]'}>
                  {trade.pressureToTrade ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">🛡️ Followed Plan Rules:</span>
                  <span className={trade.followedRules ? 'text-buy font-bold' : 'text-sell font-bold'}>
                    {trade.followedRules ? 'YES' : 'NO'}
                  </span>
                </div>
                {!trade.followedRules && trade.brokenRule && (
                  <div className="bg-[var(--color-sell-bg)] text-sell border border-red-900/20 text-[10px] p-2 rounded mt-1">
                    Broke: {trade.brokenRule}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
