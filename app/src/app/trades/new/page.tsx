'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { calculateRR, calculateRiskPips } from '@/lib/calculations';
import ScreenshotUploader from '@/components/trades/ScreenshotUploader';
import TradingViewChart, { getTradingViewUrl } from '@/components/shared/TradingViewChart';
import { useToast } from '@/components/shared/Toast';

interface ChecklistItem {
  id: number;
  points: number;
  title: string;
  note: string;
  badge: string;
  badgeColor: 'blue' | 'amber';
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 1,
    points: 1,
    title: 'NY Open session is active: 5:30 PM – 7:30 PM IST',
    note: 'Do not trade before 5:30 PM IST. If past 7:15 PM IST — skip the session.',
    badge: '1 pt',
    badgeColor: 'blue'
  },
  {
    id: 2,
    points: 1,
    title: 'No red news event within 30 minutes (Forex Factory — IST times)',
    note: 'Convert all news times to IST. Wait 30 min after any red release before trading.',
    badge: '1 pt',
    badgeColor: 'blue'
  },
  {
    id: 3,
    points: 1,
    title: 'Account OK: daily loss below 2% and fewer than 2 trades taken today',
    note: 'Two 1% losses = daily stop. If hit — close charts, no more trading today.',
    badge: '1 pt',
    badgeColor: 'blue'
  },
  {
    id: 4,
    points: 2,
    title: '1H bias confirmed — clear Break of Structure identified (bullish or bearish)',
    note: 'HH + HL + upside BOS = bullish · LH + LL + downside BOS = bearish · No BOS = skip.',
    badge: '2 pts',
    badgeColor: 'amber'
  },
  {
    id: 5,
    points: 1,
    title: '1H swing high and swing low marked on the chart',
    note: "Label '1H Swing High' (buy stops above) and '1H Swing Low' (sell stops below).",
    badge: '1 pt',
    badgeColor: 'blue'
  },
  {
    id: 6,
    points: 1,
    title: '15M structure confirmed and aligns with the 1H bias',
    note: 'Mark 15M swing high and low. Opposing 15M structure = skip this asset.',
    badge: '1 pt',
    badgeColor: 'blue'
  },
  {
    id: 7,
    points: 2,
    title: 'Valid OB or FVG found in the correct zone',
    note: 'Bullish bias → find OB or FVG in the 15M swing LOW area (discount zone). Bearish bias → find OB or FVG in the 15M swing HIGH area (premium zone). If both OB and FVG exist → select the one closest to current price. If neither found → skip this asset.',
    badge: '2 pts',
    badgeColor: 'amber'
  },
  {
    id: 8,
    points: 1,
    title: 'Price has reached the zone with a visible reaction (no full body close-through)',
    note: 'Full candle body through the far edge = zone invalidated. Wicks through are acceptable.',
    badge: '1 pt',
    badgeColor: 'blue'
  },
  {
    id: 9,
    points: 2,
    title: '1M bias change confirmed: two consecutive 1M candle bodies closed in trade direction',
    note: 'Wick-only closes do not count. Both bodies must close consecutively — this is the entry trigger.',
    badge: '2 pts',
    badgeColor: 'amber'
  },
  {
    id: 10,
    points: 1,
    title: 'Risk confirmed: SL behind zone with buffer, position sized to exactly 1% of account',
    note: 'XAUUSD: 2–3 pip buffer · EURUSD: 1–2 pip buffer · Lot size = Risk ÷ (SL pips × pip value).',
    badge: '1 pt',
    badgeColor: 'blue'
  }
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
  const [accountSize, setAccountSize] = useState<number>(100000);
  
  const [form, setForm] = useState<TradeFormData>({
    date: new Date().toISOString().split('T')[0],
    entryTime: '',
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
    checklistItems: new Array(10).fill(false),
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

  // Checklist specific states
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [skipped, setSkipped] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [completionTimeIST, setCompletionTimeIST] = useState('');
  const [formUnlocked, setFormUnlocked] = useState(false);

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
          setCheckInDone(!!(data && data.readinessScore !== null && data.readinessScore !== undefined));
        } else {
          setCheckInDone(false);
        }
      } catch {
        setCheckInDone(false);
      }
    }
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data && data.accountSize) {
            setAccountSize(data.accountSize);
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    checkAlerts();
    checkTodayCheckIn();
    loadSettings();

    // Load session states from localStorage
    const storedStart = localStorage.getItem('alienx_session_start_time');
    if (storedStart) {
      setSessionStartTime(parseInt(storedStart, 10));
    }
    const storedItems = localStorage.getItem('alienx_checklist_items');
    if (storedItems) {
      try {
        const parsed = JSON.parse(storedItems);
        if (Array.isArray(parsed) && parsed.length === 10) {
          setForm(prev => ({ ...prev, checklistItems: parsed }));
        }
      } catch {}
    }
    const storedDirection = localStorage.getItem('alienx_direction');
    if (storedDirection) {
      setForm(prev => ({ ...prev, direction: storedDirection as 'BUY' | 'SELL' }));
    }
    const storedSkipped = localStorage.getItem('alienx_skipped');
    if (storedSkipped === 'true') {
      setSkipped(true);
      setSkipReason(localStorage.getItem('alienx_skip_reason') || '');
    }
    const storedCompletion = localStorage.getItem('alienx_completion_time_ist');
    if (storedCompletion) {
      setCompletionTimeIST(storedCompletion);
      setForm(prev => ({ ...prev, entryTime: storedCompletion }));
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('alienx_checklist_items', JSON.stringify(form.checklistItems));
    localStorage.setItem('alienx_direction', form.direction);
  }, [form.checklistItems, form.direction]);

  // Session elapsed timer
  useEffect(() => {
    let interval: any;
    if (sessionStartTime && !skipped) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStartTime, skipped]);

  const handlePreFill = (alert: any) => {
    setForm((prev) => ({
      ...prev,
      asset: alert.ticker,
      direction: alert.action.toUpperCase(),
      entryPrice: alert.price?.toString() || '',
      stopLoss: alert.stopLoss?.toString() || '',
      tp1: alert.tp1?.toString() || '',
      tp2: alert.tp2?.toString() || '',
      session: alert.session || 'NY Open',
      setupTypes: alert.setup ? [alert.setup] : [],
    }));
  };

  const getChecklistScore = (items: boolean[]) => {
    const points = [1, 1, 1, 2, 1, 1, 2, 1, 2, 1];
    return items.reduce((sum, checked, idx) => sum + (checked ? points[idx] : 0), 0);
  };

  const checklistScore = getChecklistScore(form.checklistItems);
  const isComplete = checklistScore >= 9 && formUnlocked;

  // Automatically lock the form if score drops below 9
  useEffect(() => {
    if (checklistScore < 9) {
      setFormUnlocked(false);
    }
  }, [checklistScore]);

  // Checklist interaction handlers
  const handleCheckChange = useCallback((index: number, checked: boolean) => {
    setForm(prev => {
      const newItems = [...prev.checklistItems];
      newItems[index] = checked;
      
      // Start session timer if this is the first checkbox checked
      const isFirstCheck = checked && !prev.checklistItems.some(Boolean) && !sessionStartTime;
      if (isFirstCheck) {
        const now = Date.now();
        setSessionStartTime(now);
        localStorage.setItem('alienx_session_start_time', now.toString());
      }
      return { ...prev, checklistItems: newItems };
    });
  }, [sessionStartTime]);

  const handleOpenTradeEntry = () => {
    setFormUnlocked(true);
    if (!completionTimeIST) {
      const istStr = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      setCompletionTimeIST(istStr);
      localStorage.setItem('alienx_completion_time_ist', istStr);
      setForm(prev => ({ ...prev, entryTime: istStr }));
    }
  };

  const handleTriggerSkip = (reason: string) => {
    setSkipped(true);
    setSkipReason(reason);
    localStorage.setItem('alienx_skipped', 'true');
    localStorage.setItem('alienx_skip_reason', reason);
    toast.error(`Session Skipped: ${reason}`);
  };

  const handleNewSession = () => {
    localStorage.removeItem('alienx_session_start_time');
    localStorage.removeItem('alienx_checklist_items');
    localStorage.removeItem('alienx_direction');
    localStorage.removeItem('alienx_skipped');
    localStorage.removeItem('alienx_skip_reason');
    localStorage.removeItem('alienx_completion_time_ist');
    setSessionStartTime(null);
    setElapsedTime(0);
    setSkipped(false);
    setSkipReason('');
    setCompletionTimeIST('');
    setFormUnlocked(false);
    setForm(prev => ({
      ...prev,
      checklistItems: new Array(10).fill(false),
      entryPrice: '',
      stopLoss: '',
      tp1: '',
      tp2: '',
      preReasoning: '',
    }));
    toast.success('Checklist reset. New session started.');
  };

  const handleBiasChange = (newBias: 'BULLISH' | 'BEARISH') => {
    const newDirection = newBias === 'BULLISH' ? 'BUY' : 'SELL';
    const newItems = [...form.checklistItems];
    // Reset steps from Step 7 (index 6) onwards (since item 7 is index 6)
    for (let k = 6; k < 10; k++) {
      newItems[k] = false;
    }
    setForm(prev => ({ ...prev, direction: newDirection, checklistItems: newItems }));
  };

  // Position Sizing Lot Calculations
  const entry = parseFloat(form.entryPrice) || 0;
  const sl = parseFloat(form.stopLoss) || 0;
  const tp1 = parseFloat(form.tp1) || 0;
  const tp2 = parseFloat(form.tp2) || 0;
  const riskPips = entry && sl ? calculateRiskPips(entry, sl) : 0;
  const rr1 = entry && sl && tp1 ? calculateRR(entry, sl, tp1) : 0;
  const rr2 = entry && sl && tp2 ? calculateRR(entry, sl, tp2) : 0;

  // Auto-fill TP1 (1:1) and TP2 (1:5) when entry and SL are typed
  useEffect(() => {
    if (entry > 0 && sl > 0) {
      const diff = Math.abs(entry - sl);
      let targetTp1 = 0;
      let targetTp2 = 0;
      if (form.direction === 'BUY') {
        targetTp1 = entry + diff;
        targetTp2 = entry + diff * 5;
      } else {
        targetTp1 = entry - diff;
        targetTp2 = entry - diff * 5;
      }
      setForm(prev => ({
        ...prev,
        tp1: targetTp1.toFixed(prev.asset === 'EURUSD' ? 5 : 2),
        tp2: targetTp2.toFixed(prev.asset === 'EURUSD' ? 5 : 2),
      }));
    }
  }, [entry, sl, form.direction, form.asset]);

  const getLotSize = () => {
    if (!entry || !sl || entry === sl) return 0;
    const riskAmount = accountSize * 0.01; // exactly 1%
    const diff = Math.abs(entry - sl);
    let lotSize = 0;
    if (form.asset === 'XAUUSD') {
      lotSize = riskAmount / (diff * 100);
    } else if (form.asset === 'EURUSD') {
      lotSize = riskAmount / (diff * 100000);
    }
    return Math.floor(lotSize * 100) / 100; // never round up
  };

  const getZoneType = () => {
    const obSelected = form.setupTypes.includes('Order Block');
    const fvgSelected = form.setupTypes.includes('FVG');
    if (obSelected && fvgSelected) return 'OB + FVG Overlap';
    if (obSelected) return 'Order Block (OB)';
    if (fvgSelected) return 'Fair Value Gap (FVG)';
    return 'OB or FVG Zone';
  };

  const formatISTTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) + ' IST';
  };

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  const scoreColor = checklistScore >= 9 ? 'text-buy' : checklistScore >= 6 ? 'text-warn' : 'text-sell';

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
    if (checklistScore < 9) {
      toast.warning('Trade Entry Blocked: Score must be at least 9 points to unlock.');
      return;
    }

    if (!form.entryPrice || !form.stopLoss || !form.tp1 || !form.tp2 || !form.preReasoning) {
      toast.warning('Please fill in all required fields: Entry, SL, TP1, TP2, and Pre-Trade Reasoning.');
      return;
    }

    // Verify minimum RR check
    if (rr1 < 1) {
      toast.warning('Invalid Setup: TP1 must yield at least a 1:1 RR.');
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
        toast.success('Trade logged successfully in AlienX journal!');
        handleNewSession(); // clear checklist session
        router.push('/trades');
      } else {
        toast.error('Failed to save trade. Please check parameters.');
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
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span>AlienX Trading Journal — New Entry</span>
        </h1>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="btn-secondary text-xs">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={saving || !isComplete} 
            className={`btn-primary text-xs px-6 ${!isComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Saving...' : '💾 Log Trade'}
          </button>
        </div>
      </div>

      {/* Checklist Gatekeeper Control Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-[var(--color-border)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase">Establish Bias:</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={skipped}
              onClick={() => handleBiasChange('BULLISH')}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${form.direction === 'BUY' ? 'bg-buy text-white border border-buy shadow-lg shadow-buy/20' : 'bg-[var(--color-navy)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-white'}`}
            >
              🟢 BULLISH
            </button>
            <button
              type="button"
              disabled={skipped}
              onClick={() => handleBiasChange('BEARISH')}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${form.direction === 'SELL' ? 'bg-sell text-white border border-sell shadow-lg shadow-sell/20' : 'bg-[var(--color-navy)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-white'}`}
            >
              🔴 BEARISH
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-[var(--color-text-secondary)]">
          {sessionStartTime && (
            <div className="bg-[var(--color-surface)] px-3 py-1.5 rounded-lg border border-[var(--color-border)] flex items-center gap-2">
              <span>⏱️ Session Elapsed:</span>
              <span className="font-mono text-white text-sm">{formatElapsed(elapsedTime)}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">({formatISTTime(sessionStartTime)})</span>
            </div>
          )}
          <button
            onClick={handleNewSession}
            className="bg-slate-800 border border-[var(--color-border)] text-slate-300 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all"
          >
            🔄 New Session
          </button>
        </div>
      </div>

      {/* Progress & Verification Card */}
      <div className="glass-card p-5 border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Pre-Trade Checklist Progress</h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">Verify checklist criteria to score points and unlock trade logs.</p>
          </div>
          <span className={`text-xl font-bold font-mono ${scoreColor}`}>
            {checklistScore} / 13
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-[var(--color-navy)] h-2 rounded-full overflow-hidden border border-[var(--color-border)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
          <div
            className={`h-full transition-all duration-300 ${
              checklistScore >= 9 
                ? 'bg-buy shadow-[0_0_8px_rgba(29,158,117,0.5)]' 
                : checklistScore >= 6 
                ? 'bg-[var(--color-warning)]' 
                : 'bg-danger'
            }`}
            style={{ width: `${(checklistScore / 13) * 100}%` }}
          />
        </div>
      </div>

      {/* Lock/Unlock Gatekeeper Box */}
      <div className={`p-4 rounded-xl border transition-all duration-500 flex flex-col sm:flex-row items-center justify-between gap-4 ${
        checklistScore >= 9
          ? 'bg-buy/10 border-buy border-opacity-40 shadow-lg shadow-buy/5'
          : 'bg-[var(--color-surface)]/60 border-[var(--color-border)]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
            checklistScore >= 9 ? 'bg-buy text-white scale-110' : 'bg-slate-800 text-[var(--color-text-muted)]'
          }`}>
            {checklistScore >= 9 ? (
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className={`text-xs font-bold ${checklistScore >= 9 ? 'text-buy' : 'text-[var(--color-text-muted)]'}`}>
              {checklistScore >= 9 ? 'TRADE ENTRY UNLOCKED' : 'TRADE ENTRY LOCKED'}
            </h3>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-medium">
              {checklistScore >= 9
                ? 'trade entry unlocked'
                : `${9 - checklistScore} more points needed — do not open trade entry`}
            </p>
          </div>
        </div>
        
        <button
          type="button"
          disabled={checklistScore < 9}
          onClick={handleOpenTradeEntry}
          className={`px-6 py-2 rounded-lg font-bold text-xs transition-all duration-300 ${
            checklistScore >= 9
              ? 'bg-buy text-white hover:bg-buy-light shadow-lg shadow-buy/20 cursor-pointer'
              : 'bg-slate-800 text-[var(--color-text-muted)] cursor-not-allowed opacity-50'
          }`}
        >
          {formUnlocked ? '🔓 Trade Entry Opened' : '🔒 Open Trade Entry'}
        </button>
      </div>

      {/* Main Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHECKLIST_ITEMS.map((item, index) => {
          const isChecked = form.checklistItems[index] || false;
          const badgeClass = item.badgeColor === 'amber'
            ? 'bg-amber-950/45 text-amber-500 border border-amber-900/30'
            : 'bg-blue-950/40 text-blue-400 border border-blue-900/30';

          return (
            <div
              key={item.id}
              onClick={() => handleCheckChange(index, !isChecked)}
              className={`flex flex-col p-4 rounded-xl border transition-all duration-300 select-none cursor-pointer ${
                isChecked
                  ? 'bg-buy/10 border-buy border-opacity-40 text-[var(--color-text-primary)] shadow-[0_2px_12px_rgba(29,158,117,0.08)]'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-border-active)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0 ${
                  isChecked
                    ? 'bg-buy border-buy text-white'
                    : 'border-[var(--color-text-muted)]'
                }`}>
                  {isChecked && (
                    <svg className="w-3.5 h-3.5 stroke-current stroke-[3px]" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-bold leading-snug ${isChecked ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>
                      {item.title}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ${badgeClass}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                    {item.note}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skipped Banner Notice */}
      {skipped && (
        <div className="bg-red-950/65 border border-red-500/60 rounded-xl p-6 text-center space-y-3 shadow-2xl">
          <div className="text-4xl">🛑</div>
          <h3 className="text-base font-bold text-red-300">Session Skipped</h3>
          <p className="text-xs text-red-200 max-w-lg mx-auto">
            {skipReason}
          </p>
          <button
            onClick={handleNewSession}
            className="btn-secondary text-xs px-4 py-2 hover:bg-red-900/20"
          >
            Start New Session
          </button>
        </div>
      )}

      {/* Final Summary Card when complete */}
      {isComplete && (
        <div className="bg-buy/5 border border-buy border-opacity-45 rounded-xl p-5 shadow-[0_0_20px_rgba(29,158,117,0.1)] space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-buy border-opacity-25 pb-3">
            <h2 className="text-sm font-bold text-buy flex items-center gap-1.5">
              <span>✓ Strategy Checklist Complete</span>
            </h2>
            <span className="text-[10px] bg-buy text-white font-bold px-2 py-0.5 rounded-full">
              Trade Confirmed
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] block uppercase">Asset</span>
              <span className="font-bold text-white text-sm">{form.asset}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] block uppercase">Bias / Direction</span>
              <span className={`font-bold text-sm ${form.direction === 'BUY' ? 'text-buy' : 'text-sell'}`}>
                {form.direction === 'BUY' ? 'BULLISH (BUY)' : 'BEARISH (SELL)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] block uppercase">Zone Type</span>
              <span className="font-bold text-white text-sm">{getZoneType()}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] block uppercase">IST Entry Time</span>
              <span className="font-bold text-white text-sm font-mono">{completionTimeIST || 'Logged'} IST</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-buy border-opacity-25 pt-3">
            <div className="bg-black/20 p-2.5 rounded border border-[var(--color-border)]">
              <span className="text-[9px] text-[var(--color-text-muted)] block uppercase">Position Lot Size</span>
              <span className="font-bold text-white text-sm font-mono">
                {entry > 0 && sl > 0 ? getLotSize() : '0.00'} Lot (1% Fixed Risk)
              </span>
            </div>
            <div className="bg-black/20 p-2.5 rounded border border-[var(--color-border)]">
              <span className="text-[9px] text-[var(--color-text-muted)] block uppercase">Stop Loss</span>
              <span className="font-bold text-white text-sm font-mono">{sl > 0 ? sl : '0.00'}</span>
            </div>
            <div className="bg-black/20 p-2.5 rounded border border-[var(--color-border)]">
              <span className="text-[9px] text-[var(--color-text-muted)] block uppercase">Fixed TP2 (1:5 RR)</span>
              <span className="font-bold text-buy text-sm font-mono">{tp2 > 0 ? tp2 : '0.00'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the form, locked until checklist completed */}
      <div className="relative">
        {!isComplete && (
          <div className="absolute inset-0 bg-[#0a0a0c]/70 backdrop-blur-[2.5px] z-50 flex items-center justify-center rounded-xl p-4">
            <div className="glass-card p-6 border border-sell/25 max-w-sm text-center space-y-3 bg-black/60 shadow-2xl">
              <div className="text-3xl">🔒</div>
              <h3 className="text-sm font-bold text-sell">Trade Entry Form Locked</h3>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                Reach a minimum checklist score of 9 points and click &quot;Open Trade Entry&quot; to unlock entries, screenshots, and logs.
              </p>
            </div>
          </div>
        )}

        <div className={`transition-all duration-300 ${!isComplete ? 'opacity-20 pointer-events-none select-none' : ''}`}>
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
                <label className="form-label">Entry Time (IST) *</label>
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
                  <option>NY Open</option>
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
                  <option value="EURUSD">EURUSD</option>
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
                  step="0.00001"
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
                  step="0.00001"
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
                  step="0.00001"
                  className="form-input font-mono"
                  placeholder="0.00"
                  value={form.tp1}
                  onChange={(e) => setForm({ ...form, tp1: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">TP2 (1:5 RR) *</label>
                <input
                  type="number"
                  step="0.00001"
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
                  step="0.00001"
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
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase">SL size</div>
                  <div className="text-sm font-bold font-mono">
                    {riskPips.toFixed(form.asset === 'EURUSD' ? 5 : 2)} pts
                  </div>
                </div>
                <div className="bg-[var(--color-surface)] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase">RR to TP1</div>
                  <div className={`text-sm font-bold font-mono ${rr1 >= 1.0 ? 'text-buy' : rr1 > 0 ? 'text-sell' : ''}`}>
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
                  <div className="text-sm font-bold font-mono">1.00%</div>
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
                  step="0.00001"
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
