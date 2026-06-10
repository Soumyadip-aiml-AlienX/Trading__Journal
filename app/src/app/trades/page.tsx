'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTradingViewUrl } from '@/components/shared/TradingViewChart';
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
  rr1: number | null;
  checklistScore: number;
  status: string;
}

export default function TradeLogPage() {
  const toast = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    asset: '',
    session: '',
    direction: '',
    status: '',
  });

  // CSV Import states
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState({
    date: '',
    asset: '',
    direction: '',
    entryPrice: '',
    stopLoss: '',
    tp1: '',
    tp2: '',
    exitPrice: '',
  });
  const [importing, setImporting] = useState(false);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error('CSV file must contain a header row and at least one data row.');
        return;
      }

      // Basic CSV splitter that respects quoted values
      const parseCsvLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map((val) => val.replace(/^"|"$/g, '').trim());
      };

      const headers = parseCsvLine(lines[0]);
      const rows = lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        return row;
      });

      setCsvHeaders(headers);
      setCsvData(rows);

      // Auto-detect header mappings
      const findHeader = (keywords: string[]) => {
        return headers.find((h) => 
          keywords.some((k) => h.toLowerCase().includes(k))
        ) || '';
      };

      setMappings({
        date: findHeader(['date', 'time', 'created']),
        asset: findHeader(['asset', 'symbol', 'ticker', 'pair']),
        direction: findHeader(['direction', 'type', 'side', 'action']),
        entryPrice: findHeader(['entry', 'price', 'open price', 'buy price']),
        stopLoss: findHeader(['stop', 'sl', 'stop loss']),
        tp1: findHeader(['tp1', 'tp', 'take profit', 'limit']),
        tp2: findHeader(['tp2', 'take profit 2']),
        exitPrice: findHeader(['exit', 'close price', 'sell price']),
      });
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (csvData.length === 0) return;
    setImporting(true);

    try {
      const tradesToImport = csvData.map((row) => {
        const directionRaw = row[mappings.direction] || 'BUY';
        const direction = directionRaw.toUpperCase().includes('SELL') ? 'SELL' : 'BUY';

        return {
          date: row[mappings.date] ? new Date(row[mappings.date]).toISOString() : new Date().toISOString(),
          entryTime: row[mappings.date] ? new Date(row[mappings.date]).toISOString() : new Date().toISOString(),
          asset: (row[mappings.asset] || 'XAUUSD').toUpperCase().replace(/USD$/, '') + 'USD',
          direction,
          entryPrice: parseFloat(row[mappings.entryPrice]) || 0,
          stopLoss: parseFloat(row[mappings.stopLoss]) || 0,
          tp1: parseFloat(row[mappings.tp1]) || 0,
          tp2: parseFloat(row[mappings.tp2]) || 0,
          exitPrice: row[mappings.exitPrice] ? parseFloat(row[mappings.exitPrice]) : null,
          exitReason: row[mappings.exitPrice] ? 'CSV Import' : null,
          preReasoning: 'CSV Imported Trade',
        };
      });

      const res = await fetch('/api/trades/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: tradesToImport }),
      });

      if (res.ok) {
        toast.success(`Successfully imported ${tradesToImport.length} trades!`);
        setShowCsvImport(false);
        setCsvFile(null);
        setCsvData([]);
        
        // Trigger page re-fetch
        setFilters((prev) => ({ ...prev }));
      } else {
        toast.error('Failed to import trades.');
      }
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Error during import.');
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    async function fetchTrades() {
      try {
        const params = new URLSearchParams();
        if (filters.asset) params.set('asset', filters.asset);
        if (filters.session) params.set('session', filters.session);
        if (filters.direction) params.set('direction', filters.direction);
        if (filters.status) params.set('status', filters.status);

        const res = await fetch(`/api/trades?${params.toString()}`);
        if (res.ok) setTrades(await res.json());
      } catch (err) {
        console.warn('Trades fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrades();
  }, [filters]);

  const totalPnl = trades
    .filter((t) => t.status === 'closed' && t.actualPnlPct !== null)
    .reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Trade Log</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsvImport(!showCsvImport)}
            className={`btn-secondary text-xs flex items-center gap-1.5 cursor-pointer`}
          >
            📥 Import CSV
          </button>
          <Link href="/trades/new" className="btn-primary text-xs">
            ➕ New Trade
          </Link>
        </div>
      </div>

      {/* CSV Import Drawer */}
      {showCsvImport && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            CSV Trade Importer
          </h3>
          <div className="grid grid-cols-3 gap-5 items-start">
            <div className="space-y-3">
              <div>
                <label className="form-label">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="form-input text-xs"
                />
              </div>
              {csvFile && (
                <div className="text-[10px] text-[var(--color-text-muted)]">
                  Loaded {csvData.length} rows from <strong className="text-[var(--color-text-secondary)]">{csvFile.name}</strong>
                </div>
              )}
            </div>
            
            {csvHeaders.length > 0 && (
              <div className="col-span-2 grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Date Column</label>
                  <select
                    className="form-input text-xs"
                    value={mappings.date}
                    onChange={(e) => setMappings({ ...mappings, date: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {csvHeaders.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Asset Column</label>
                  <select
                    className="form-input text-xs"
                    value={mappings.asset}
                    onChange={(e) => setMappings({ ...mappings, asset: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {csvHeaders.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Direction Column</label>
                  <select
                    className="form-input text-xs"
                    value={mappings.direction}
                    onChange={(e) => setMappings({ ...mappings, direction: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {csvHeaders.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Entry Price Column</label>
                  <select
                    className="form-input text-xs"
                    value={mappings.entryPrice}
                    onChange={(e) => setMappings({ ...mappings, entryPrice: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {csvHeaders.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Stop Loss Column</label>
                  <select
                    className="form-input text-xs"
                    value={mappings.stopLoss}
                    onChange={(e) => setMappings({ ...mappings, stopLoss: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {csvHeaders.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">TP1 Column</label>
                  <select
                    className="form-input text-xs"
                    value={mappings.tp1}
                    onChange={(e) => setMappings({ ...mappings, tp1: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {csvHeaders.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {csvData.length > 0 && (
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => {
                  setCsvFile(null);
                  setCsvData([]);
                  setCsvHeaders([]);
                  setShowCsvImport(false);
                }}
                className="btn-secondary px-4 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={importing || !mappings.entryPrice || !mappings.asset || !mappings.date}
                className="btn-primary px-5 py-1.5"
              >
                {importing ? 'Importing...' : `Import ${csvData.length} Trades`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex gap-3 items-end">
          <div>
            <label className="form-label">Asset</label>
            <select
              className="form-input w-36"
              value={filters.asset}
              onChange={(e) => setFilters({ ...filters, asset: e.target.value })}
            >
              <option value="">All Assets</option>
              <option value="XAUUSD">XAUUSD</option>
              <option value="BTCUSD">BTCUSD</option>
              <option value="ETHUSD">ETHUSD</option>
            </select>
          </div>
          <div>
            <label className="form-label">Session</label>
            <select
              className="form-input w-36"
              value={filters.session}
              onChange={(e) => setFilters({ ...filters, session: e.target.value })}
            >
              <option value="">All Sessions</option>
              <option>London Open</option>
              <option>NY Open</option>
              <option>NY Lunch</option>
              <option>Late NY</option>
            </select>
          </div>
          <div>
            <label className="form-label">Direction</label>
            <select
              className="form-input w-28"
              value={filters.direction}
              onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
            >
              <option value="">All</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-input w-28"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Total P&amp;L</div>
            <div className={`text-lg font-bold font-mono ${totalPnl >= 0 ? 'text-buy' : 'text-sell'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Trade Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--color-text-muted)]">Loading trades...</div>
        ) : trades.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm text-[var(--color-text-muted)]">No trades match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="data-table min-w-[1000px] lg:min-w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Session</th>
                  <th>Asset</th>
                  <th>Dir</th>
                  <th>Entry</th>
                  <th>SL</th>
                  <th>TP1</th>
                  <th>TP2</th>
                  <th>Exit</th>
                  <th>Reason</th>
                  <th>RR</th>
                  <th>P&amp;L</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr
                    key={trade.id}
                    className={
                      trade.status === 'closed'
                        ? (trade.actualPnlPct ?? 0) > 0
                          ? 'row-win'
                          : 'row-loss'
                        : ''
                    }
                  >
                    <td className="font-mono font-semibold text-[var(--color-accent-light)] hover:underline">
                      <Link href={`/trades/detail?id=${trade.id}`}>
                        {trade.tradeCode}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap">
                      {new Date(trade.date).toLocaleDateString()}
                    </td>
                    <td>{trade.session}</td>
                    <td className="font-semibold">
                      <span className="flex items-center gap-1">
                        {trade.asset}
                        <a
                          href={getTradingViewUrl(trade.asset)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in TradingView"
                          className="text-[10px] opacity-40 hover:opacity-100 transition-opacity hover:text-[var(--color-accent-light)]"
                        >
                          ↗️
                        </a>
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${trade.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="font-mono">{trade.entryPrice.toFixed(2)}</td>
                    <td className="font-mono text-sell">{trade.stopLoss.toFixed(2)}</td>
                    <td className="font-mono">{trade.tp1.toFixed(2)}</td>
                    <td className="font-mono">{trade.tp2.toFixed(2)}</td>
                    <td className="font-mono">
                      {trade.exitPrice?.toFixed(2) ?? '—'}
                    </td>
                    <td>{trade.exitReason ?? '—'}</td>
                    <td className="font-mono">
                      {trade.rr1 ? `1:${trade.rr1.toFixed(1)}` : '—'}
                    </td>
                    <td
                      className={`font-mono font-semibold ${
                        (trade.actualPnlPct ?? 0) >= 0 ? 'text-buy' : 'text-sell'
                      }`}
                    >
                      {trade.actualPnlPct !== null
                        ? `${trade.actualPnlPct >= 0 ? '+' : ''}${trade.actualPnlPct.toFixed(2)}%`
                        : '—'}
                    </td>
                    <td>
                      <span
                        className={`font-mono font-semibold ${
                          trade.checklistScore >= 9
                            ? 'text-buy'
                            : trade.checklistScore >= 6
                            ? 'text-[var(--color-warning)]'
                            : 'text-sell'
                        }`}
                      >
                        {trade.checklistScore}/13
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${trade.status === 'open' ? 'badge-open' : 'badge-closed'}`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
