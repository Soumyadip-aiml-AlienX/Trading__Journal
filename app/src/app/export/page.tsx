'use client';

import { useState } from 'react';
import { useToast } from '@/components/shared/Toast';

interface Trade {
  id: string;
  tradeCode: string;
  date: string;
  session: string;
  asset: string;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  exitPrice: number | null;
  exitReason: string | null;
  actualPnlPct: number | null;
  riskPips: number | null;
  rr1: number | null;
  checklistScore: number;
  status: string;
  setupTypes: string;
  screenshots: string;
  preReasoning: string | null;
  postNotes: string | null;
  challengePhase: string;
  emotionBefore: string;
  emotionAfter: string;
  disciplineRating: number | null;
  revengeTradeFlag: boolean;
  fomoFlag: boolean;
  followedRules: boolean;
  brokenRule: string | null;
}

interface DailyLog {
  id: string;
  date: string;
  readinessScore: number;
  mentalState: number;
  physicalState: string;
  marketConfidence: number;
  sleepQuality: string;
  distractionLevel: string;
  challengePhase: string;
  lessonLearned: string | null;
  marketBias: string | null;
  biggestSuccess: string | null;
  biggestMistake: string | null;
  tomorrowPlan: string | null;
}

export default function ExportPage() {
  const toast = useToast();
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyStart, setWeeklyStart] = useState(() =>
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [weeklyEnd, setWeeklyEnd] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [exportingDaily, setExportingDaily] = useState(false);
  const [exportingWeekly, setExportingWeekly] = useState(false);
  const [exportingCsv, setExportingCsv] = useState<string | null>(null);

  const handleExportDaily = async () => {
    setExportingDaily(true);
    try {
      const tradesRes = await fetch(`/api/trades?dateFrom=${dailyDate}&dateTo=${dailyDate}`);
      const trades: Trade[] = await tradesRes.json();
      
      const logRes = await fetch(`/api/daily-log?date=${dailyDate}`);
      const dailyLog: DailyLog | null = await logRes.json();
      
      if ((!trades || trades.length === 0) && !dailyLog) {
        toast.warning('No trades or reflection logged for this date.');
        return;
      }
      
      const { generateDailyPDF } = await import('@/lib/pdf-generator');
      await generateDailyPDF(dailyDate, trades, dailyLog);
      toast.success('Daily PDF generated successfully!');
    } catch (err) {
      console.error('Failed to export daily PDF:', err);
      toast.error('Error generating PDF report.');
    } finally {
      setExportingDaily(false);
    }
  };

  const handleExportWeekly = async () => {
    setExportingWeekly(true);
    try {
      const tradesRes = await fetch(`/api/trades?dateFrom=${weeklyStart}&dateTo=${weeklyEnd}`);
      const trades: Trade[] = await tradesRes.json();
      
      const logsRes = await fetch(`/api/daily-log?dateFrom=${weeklyStart}&dateTo=${weeklyEnd}`);
      const dailyLogs: DailyLog[] = await logsRes.json();
      
      if ((!trades || trades.length === 0) && (!dailyLogs || dailyLogs.length === 0)) {
        toast.warning('No trading activity or logs found in this date range.');
        return;
      }
      
      const { generateWeeklyPDF } = await import('@/lib/pdf-generator');
      await generateWeeklyPDF(weeklyStart, weeklyEnd, trades, dailyLogs);
      toast.success('Weekly PDF rollup generated successfully!');
    } catch (err) {
      console.error('Failed to export weekly PDF:', err);
      toast.error('Error generating weekly rollup.');
    } finally {
      setExportingWeekly(false);
    }
  };

  const downloadCSV = (data: any[], headers: string[], filename: string) => {
    if (data.length === 0) {
      toast.warning('No data available to export.');
      return;
    }

    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV downloaded successfully!');
  };

  const handleExportCsvData = async (type: 'raw' | 'monthly' | 'setups' | 'psychology') => {
    setExportingCsv(type);
    try {
      const tradesRes = await fetch('/api/trades');
      const trades: Trade[] = await tradesRes.json();
      
      if (!trades || trades.length === 0) {
        toast.warning('No trades logged in the database yet.');
        return;
      }

      const closedTrades = trades.filter(t => t.status === 'closed' && t.actualPnlPct !== null);

      if (type === 'raw') {
        const headers = [
          'tradeCode', 'date', 'session', 'challengePhase', 'asset', 'direction',
          'entryPrice', 'stopLoss', 'tp1', 'tp2', 'tp3', 'exitPrice', 'exitReason',
          'actualPnlPct', 'riskPips', 'rr1', 'rr2', 'checklistScore', 'partialClose',
          'breakevenMoved', 'emotionBefore', 'emotionAfter', 'disciplineRating',
          'revengeTradeFlag', 'fomoFlag', 'followedRules', 'brokenRule', 'status'
        ];
        
        const formatted = trades.map(t => ({
          ...t,
          date: new Date(t.date).toLocaleDateString(),
          emotionBefore: JSON.parse(t.emotionBefore || '[]').join('; '),
          emotionAfter: t.emotionAfter ? JSON.parse(t.emotionAfter).join('; ') : '',
        }));

        downloadCSV(formatted, headers, 'MAVEN_TRADES_RAW.csv');
      } 
      
      else if (type === 'monthly') {
        // Group by month
        const monthlyGroups: Record<string, Trade[]> = {};
        closedTrades.forEach(t => {
          const m = new Date(t.date).toISOString().substring(0, 7); // YYYY-MM
          if (!monthlyGroups[m]) monthlyGroups[m] = [];
          monthlyGroups[m].push(t);
        });

        const data = Object.entries(monthlyGroups).map(([month, items]) => {
          const wins = items.filter(t => (t.actualPnlPct ?? 0) > 0).length;
          const losses = items.filter(t => (t.actualPnlPct ?? 0) < 0).length;
          const pnl = items.reduce((s, t) => s + (t.actualPnlPct ?? 0), 0);
          
          return {
            Month: month,
            TotalTrades: items.length,
            Wins: wins,
            Losses: losses,
            WinRate: items.length > 0 ? `${((wins / items.length) * 100).toFixed(1)}%` : '0%',
            NetPnl: `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`,
          };
        });

        downloadCSV(data, ['Month', 'TotalTrades', 'Wins', 'Losses', 'WinRate', 'NetPnl'], 'MAVEN_METRICS_MONTHLY.csv');
      } 
      
      else if (type === 'setups') {
        // Group by setup type
        const setupMap: Record<string, Trade[]> = {};
        closedTrades.forEach(t => {
          const setups: string[] = JSON.parse(t.setupTypes || '[]');
          setups.forEach(setup => {
            if (!setupMap[setup]) setupMap[setup] = [];
            setupMap[setup].push(t);
          });
        });

        const data = Object.entries(setupMap).map(([setup, items]) => {
          const wins = items.filter(t => (t.actualPnlPct ?? 0) > 0).length;
          const pnl = items.reduce((s, t) => s + (t.actualPnlPct ?? 0), 0);
          
          return {
            SetupType: setup,
            TotalTrades: items.length,
            Wins: wins,
            WinRate: items.length > 0 ? `${((wins / items.length) * 100).toFixed(1)}%` : '0%',
            NetPnl: `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`,
            AvgChecklistScore: (items.reduce((s, t) => s + t.checklistScore, 0) / items.length).toFixed(1),
          };
        });

        downloadCSV(data, ['SetupType', 'TotalTrades', 'Wins', 'WinRate', 'NetPnl', 'AvgChecklistScore'], 'MAVEN_SETUP_EFFECTIVENESS.csv');
      } 
      
      else if (type === 'psychology') {
        // Group by emotion
        const emotionMap: Record<string, Trade[]> = {};
        closedTrades.forEach(t => {
          const emotions: string[] = JSON.parse(t.emotionBefore || '[]');
          emotions.forEach(emo => {
            if (!emotionMap[emo]) emotionMap[emo] = [];
            emotionMap[emo].push(t);
          });
        });

        const data = Object.entries(emotionMap).map(([emotion, items]) => {
          const wins = items.filter(t => (t.actualPnlPct ?? 0) > 0).length;
          const fomoCount = items.filter(t => t.fomoFlag).length;
          const revengeCount = items.filter(t => t.revengeTradeFlag).length;
          const avgDiscipline = items.filter(t => t.disciplineRating !== null)
            .reduce((s, t) => s + (t.disciplineRating ?? 0), 0) / (items.filter(t => t.disciplineRating !== null).length || 1);

          return {
            EmotionBefore: emotion,
            TotalTrades: items.length,
            WinRate: `${((wins / items.length) * 100).toFixed(1)}%`,
            AvgDiscipline: avgDiscipline.toFixed(1),
            FomoTrades: fomoCount,
            RevengeTrades: revengeCount,
          };
        });

        downloadCSV(data, ['EmotionBefore', 'TotalTrades', 'WinRate', 'AvgDiscipline', 'FomoTrades', 'RevengeTrades'], 'MAVEN_PSYCHOLOGY_CORRELATION.csv');
      }

    } catch (err) {
      console.error(err);
      toast.error('Error exporting CSV.');
    } finally {
      setExportingCsv(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">📄 Reports & Exports</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Generate professional daily trading reports, weekly rollup PDFs, and analytical CSV files.
        </p>
      </div>

      {/* PDF Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          PDF Report Generation
        </h2>
        
        {/* Daily Export Card */}
        <div className="glass-card p-5 flex flex-col md:flex-row gap-5 items-center justify-between">
          <div className="space-y-2 text-center md:text-left flex-1">
            <h3 className="text-xs font-bold text-[var(--color-text-primary)]">Export Daily Journal</h3>
            <p className="text-[11px] text-[var(--color-text-secondary)] max-w-sm">
              Generate a complete PDF report with trade details, screenshots, and daily reflection.
            </p>
            <div className="pt-2 flex items-center gap-2 justify-center md:justify-start">
              <label className="form-label mb-0 text-[10px]">Select Date:</label>
              <input
                type="date"
                className="form-input text-xs w-36 font-mono py-1 px-2"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              onClick={handleExportDaily}
              disabled={exportingDaily}
              className="btn-primary px-6 py-2 text-xs min-w-[150px] cursor-pointer"
            >
              {exportingDaily ? 'Generating...' : '📥 Daily PDF'}
            </button>
          </div>
        </div>

        {/* Weekly Rollup Card */}
        <div className="glass-card p-5 flex flex-col md:flex-row gap-5 items-center justify-between">
          <div className="space-y-2 text-center md:text-left flex-1">
            <h3 className="text-xs font-bold text-[var(--color-text-primary)]">Weekly Rollup Summary</h3>
            <p className="text-[11px] text-[var(--color-text-secondary)] max-w-sm">
              Combined weekly summary with weekly stats, logs, and top lessons.
            </p>
            <div className="pt-2 flex flex-wrap gap-3 items-center justify-center md:justify-start">
              <div className="flex items-center gap-1.5">
                <label className="form-label mb-0 text-[10px]">Start:</label>
                <input
                  type="date"
                  className="form-input text-xs w-36 font-mono py-1 px-2"
                  value={weeklyStart}
                  onChange={(e) => setWeeklyStart(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="form-label mb-0 text-[10px]">End:</label>
                <input
                  type="date"
                  className="form-input text-xs w-36 font-mono py-1 px-2"
                  value={weeklyEnd}
                  onChange={(e) => setWeeklyEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={handleExportWeekly}
              disabled={exportingWeekly}
              className="btn-secondary px-6 py-2 text-xs min-w-[150px] cursor-pointer"
            >
              {exportingWeekly ? 'Generating...' : '📥 Weekly PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* CSV Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          CSV Data Exports
        </h2>

        <div className="glass-card p-5 grid grid-cols-2 gap-4">
          {/* Raw Trades */}
          <div className="border border-[var(--color-border)] rounded-lg p-4 flex flex-col justify-between space-y-3 bg-[var(--color-surface)]">
            <div>
              <h4 className="text-xs font-bold text-[var(--color-text-primary)]">All Trades (Raw Logs)</h4>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                Full export of all logged trades with complete parameter values, checklist scores, and notes.
              </p>
            </div>
            <button
              onClick={() => handleExportCsvData('raw')}
              disabled={exportingCsv !== null}
              className="btn-secondary text-[11px] py-1.5 w-full cursor-pointer"
            >
              {exportingCsv === 'raw' ? 'Exporting...' : '📥 Export Raw CSV'}
            </button>
          </div>

          {/* Monthly Metrics */}
          <div className="border border-[var(--color-border)] rounded-lg p-4 flex flex-col justify-between space-y-3 bg-[var(--color-surface)]">
            <div>
              <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Monthly Metrics Summary</h4>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                Aggregated monthly statistics including win rates, total trades count, and net P&L percentage.
              </p>
            </div>
            <button
              onClick={() => handleExportCsvData('monthly')}
              disabled={exportingCsv !== null}
              className="btn-secondary text-[11px] py-1.5 w-full cursor-pointer"
            >
              {exportingCsv === 'monthly' ? 'Exporting...' : '📥 Export Monthly Metrics'}
            </button>
          </div>

          {/* Setup Effectiveness */}
          <div className="border border-[var(--color-border)] rounded-lg p-4 flex flex-col justify-between space-y-3 bg-[var(--color-surface)]">
            <div>
              <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Setup Effectiveness</h4>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                Statistics on OB, FVG, OTE, etc. setups to analyze which patterns are most profitable.
              </p>
            </div>
            <button
              onClick={() => handleExportCsvData('setups')}
              disabled={exportingCsv !== null}
              className="btn-secondary text-[11px] py-1.5 w-full cursor-pointer"
            >
              {exportingCsv === 'setups' ? 'Exporting...' : '📥 Export Setup Stats'}
            </button>
          </div>

          {/* Psychology Correlation */}
          <div className="border border-[var(--color-border)] rounded-lg p-4 flex flex-col justify-between space-y-3 bg-[var(--color-surface)]">
            <div>
              <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Psychology Correlation</h4>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                Correlation between pre-trade emotions, win rate, FOMO counts, and discipline ratings.
              </p>
            </div>
            <button
              onClick={() => handleExportCsvData('psychology')}
              disabled={exportingCsv !== null}
              className="btn-secondary text-[11px] py-1.5 w-full cursor-pointer"
            >
              {exportingCsv === 'psychology' ? 'Exporting...' : '📥 Export Psychology Stats'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
