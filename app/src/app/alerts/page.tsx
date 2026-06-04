'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTradingViewUrl } from '@/components/shared/TradingViewChart';

interface WebhookAlert {
  id: string;
  ticker: string;
  action: 'BUY' | 'SELL';
  price: number;
  stopLoss: number | null;
  tp1: number | null;
  tp2: number | null;
  session: string | null;
  setup: string | null;
  status: 'pending' | 'converted' | 'ignored';
  receivedAt: string;
}

export default function AlertsDashboardPage() {
  const [alerts, setAlerts] = useState<WebhookAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/webhook/tradingview?all=true');
        if (res.ok) {
          setAlerts(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  const handleIgnore = async (id: string) => {
    try {
      const res = await fetch(`/api/webhook/tradingview?id=${id}&status=ignored`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'ignored' } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stats calculations
  const total = alerts.length;
  const pending = alerts.filter((a) => a.status === 'pending').length;
  const converted = alerts.filter((a) => a.status === 'converted').length;
  const ignored = alerts.filter((a) => a.status === 'ignored').length;
  
  const conversionRate = total > 0 ? (converted / total) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return 'bg-emerald-950/40 text-[#1dd1a1] border border-emerald-900/30';
      case 'ignored':
        return 'bg-slate-800 text-slate-400 border border-[var(--color-border)]';
      default:
        return 'bg-blue-950/40 text-blue-400 border border-blue-900/30';
    }
  };

  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [testPayload, setTestPayload] = useState({
    ticker: 'XAUUSD',
    action: 'BUY' as 'BUY' | 'SELL',
    price: '2045.50',
    stopLoss: '2038.00',
    tp1: '2055.00',
    tp2: '2065.00',
    setup: 'SMC Bullish Orderblock (H4)'
  });
  const [sendingTest, setSendingTest] = useState(false);

  const handleSendTestSignal = async () => {
    setSendingTest(true);
    try {
      const res = await fetch('/api/webhook/tradingview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: testPayload.ticker,
          action: testPayload.action,
          price: parseFloat(testPayload.price) || 0,
          stopLoss: testPayload.stopLoss ? parseFloat(testPayload.stopLoss) : null,
          tp1: testPayload.tp1 ? parseFloat(testPayload.tp1) : null,
          tp2: testPayload.tp2 ? parseFloat(testPayload.tp2) : null,
          setup: testPayload.setup,
        }),
      });

      if (res.ok) {
        // Refresh alerts list
        const resAlerts = await fetch('/api/webhook/tradingview?all=true');
        if (resAlerts.ok) {
          setAlerts(await resAlerts.json());
        }
        setIsTesterOpen(false);
      } else {
        console.error('Failed to send test signal');
      }
    } catch (err) {
      console.error('Error sending test signal:', err);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">🔔 TradingView Alerts Log</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Review incoming signals sent from your TradingView charts via webhooks.
          </p>
        </div>
        <button
          onClick={() => setIsTesterOpen(true)}
          className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer self-start"
        >
          <span>🔧</span> Send Test Signal
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Total Received
          </div>
          <div className="text-xl font-bold">{total}</div>
        </div>
        <div className="metric-card">
          <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Conversion Rate
          </div>
          <div className="text-xl font-bold text-[var(--color-accent-light)]">
            {conversionRate.toFixed(1)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Pending Alerts
          </div>
          <div className="text-xl font-bold text-blue-400">{pending}</div>
        </div>
        <div className="metric-card">
          <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Ignored Alerts
          </div>
          <div className="text-xl font-bold text-slate-400">{ignored}</div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--color-text-muted)]">
            <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-muted)]">
            <p className="text-3xl mb-3">🔔</p>
            <p className="text-sm">No TradingView alerts received yet.</p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
              Configure the webhook endpoint in Settings to receive signals.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Received At</th>
                  <th>Asset</th>
                  <th>Direction</th>
                  <th>Alert Price</th>
                  <th>Setup Signal</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      {new Date(alert.receivedAt).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-[var(--color-text-muted)] font-mono block">
                        {new Date(alert.receivedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="font-semibold">
                      <span className="flex items-center gap-1">
                        {alert.ticker}
                        <a
                          href={getTradingViewUrl(alert.ticker)}
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
                      <span
                        className={`badge ${alert.action === 'BUY' ? 'badge-buy' : 'badge-sell'}`}
                      >
                        {alert.action}
                      </span>
                    </td>
                    <td className="font-mono">{alert.price.toFixed(2)}</td>
                    <td className="text-xs max-w-[150px] truncate" title={alert.setup || ''}>
                      {alert.setup || '—'}
                    </td>
                    <td>{alert.session || '—'}</td>
                    <td>
                      <span className={`badge text-[9px] px-2 py-0.5 ${getStatusBadge(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      {alert.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Link
                            href="/trades/new"
                            className="bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-accent-light)] px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap"
                          >
                            ⚡ Convert
                          </Link>
                          <button
                            onClick={() => handleIgnore(alert.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Ignore
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--color-text-muted)] italic">
                          Closed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Webhook Signal Tester Modal */}
      {isTesterOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-all"
            onClick={() => setIsTesterOpen(false)}
            role="presentation"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Webhook Signal Tester"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md p-4"
          >
            <div className="glass-card p-6 border border-white/10 shadow-2xl relative rounded-2xl bg-[#0d0e12]/95">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent" />
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>🔧</span> Webhook Signal Tester
                </h3>
                <button
                  onClick={() => setIsTesterOpen(false)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-white p-1 hover:bg-[var(--color-surface-overlay)] rounded transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed bg-[var(--color-surface)] p-2.5 rounded-lg border border-[var(--color-border)]">
                  Simulate an incoming Webhook Alert from your TradingView charts. This triggers a POST request to your endpoint, allowing you to test alert routing in real time.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="test-ticker" className="form-label text-white/70">Ticker Symbol</label>
                    <select
                      id="test-ticker"
                      className="form-input text-xs"
                      value={testPayload.ticker}
                      onChange={(e) => setTestPayload({ ...testPayload, ticker: e.target.value })}
                    >
                      <option>XAUUSD</option>
                      <option>BTCUSD</option>
                      <option>ETHUSD</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="test-action" className="form-label text-white/70">Action / Direction</label>
                    <select
                      id="test-action"
                      className="form-input text-xs"
                      value={testPayload.action}
                      onChange={(e) => setTestPayload({ ...testPayload, action: e.target.value as 'BUY' | 'SELL' })}
                    >
                      <option>BUY</option>
                      <option>SELL</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="test-price" className="form-label text-white/70">Alert Price</label>
                    <input
                      id="test-price"
                      type="number"
                      step="any"
                      className="form-input text-xs"
                      value={testPayload.price}
                      onChange={(e) => setTestPayload({ ...testPayload, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="test-sl" className="form-label text-white/70">Stop Loss</label>
                    <input
                      id="test-sl"
                      type="number"
                      step="any"
                      className="form-input text-xs"
                      value={testPayload.stopLoss}
                      onChange={(e) => setTestPayload({ ...testPayload, stopLoss: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="test-tp1" className="form-label text-white/70">Take Profit 1</label>
                    <input
                      id="test-tp1"
                      type="number"
                      step="any"
                      className="form-input text-xs"
                      value={testPayload.tp1}
                      onChange={(e) => setTestPayload({ ...testPayload, tp1: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="test-tp2" className="form-label text-white/70">Take Profit 2</label>
                    <input
                      id="test-tp2"
                      type="number"
                      step="any"
                      className="form-input text-xs"
                      value={testPayload.tp2}
                      onChange={(e) => setTestPayload({ ...testPayload, tp2: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="test-setup" className="form-label text-white/70">Setup Description</label>
                  <input
                    id="test-setup"
                    type="text"
                    className="form-input text-xs"
                    value={testPayload.setup}
                    onChange={(e) => setTestPayload({ ...testPayload, setup: e.target.value })}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendTestSignal}
                  disabled={sendingTest}
                  className="btn-primary w-full py-2.5 text-xs font-bold bg-gradient-to-r from-yellow-500 to-amber-500 border-none text-slate-950 hover:brightness-110 shadow-lg cursor-pointer flex items-center justify-center gap-2 rounded-lg"
                >
                  {sendingTest ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting Signal...</span>
                    </>
                  ) : (
                    <>
                      <span>Transmit Webhook Signal</span> ➔
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
