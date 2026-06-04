'use client';

import { useEffect, useState } from 'react';

interface NewsEvent {
  title: string;
  country: string;
  date: string;
  time: string;
  impact: string;
  forecast: string;
  previous: string;
}

export default function NewsAlertsPage() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterImpact, setFilterImpact] = useState<string>('All');
  const [filterCurrency, setFilterCurrency] = useState<string>('All');
  const [mounted, setMounted] = useState(false);
  const [loginType, setLoginType] = useState('local');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setLoginType(localStorage.getItem('user_login_type') || 'local');
      setUserEmail(localStorage.getItem('user_email') || '');
    }
    async function fetchNews() {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          setEvents(await res.json());
        } else {
          setError('Failed to load news schedule.');
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Connection failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const currencies = ['All', ...new Set(events.map(e => e.country.toUpperCase()))].sort();
  const impacts = ['All', 'High', 'Medium', 'Low'];

  const filteredEvents = events.filter(e => {
    const matchesImpact = filterImpact === 'All' || e.impact === filterImpact;
    const matchesCurrency = filterCurrency === 'All' || e.country.toUpperCase() === filterCurrency;
    return matchesImpact && matchesCurrency;
  });

  const highImpactCount = events.filter(e => e.impact === 'High').length;

  const getImpactBadgeClass = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-red-500/20 font-bold';
      case 'medium':
        return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-orange-500/20';
      case 'low':
        return 'bg-yellow-950/40 text-yellow-500 border border-yellow-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border border-[var(--color-border)]';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">📰 Daily News Alerts</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Keep track of today&apos;s macroeconomic events. Remember: Maven Prop rules restrict trading 2 minutes before and after high-impact news!
          </p>
          {mounted && loginType === 'google' && (
            <p className="text-[10px] text-yellow-500 font-bold mt-1.5 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <span>Synced with Google Account ({userEmail})</span>
            </p>
          )}
        </div>
        <div className="text-xs font-mono text-[var(--color-text-muted)] bg-[var(--color-surface)] py-1.5 px-3 rounded-lg border border-[var(--color-border)] self-start">
          📅 Date: {mounted ? new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
        </div>
      </div>

      {/* Prop Firm Warning Banner */}
      {!loading && highImpactCount > 0 && (
        <div className="glass-card p-5 border-l-4 border-l-red-500 bg-gradient-to-r from-red-950/30 to-transparent animate-pulse-slow">
          <div className="flex items-start gap-3">
            <span className="text-2xl" role="img" aria-label="danger">⚠️</span>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                High Impact News Alert
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                There are <strong className="text-white font-bold">{highImpactCount} High-Impact</strong> economic reports scheduled for today. Double check release times. Close any running positions on affected currencies or metals 2 minutes before the release.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Row */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="filter-impact" className="form-label">Impact Level</label>
            <select
              id="filter-impact"
              className="form-input w-36 text-xs"
              value={filterImpact}
              onChange={(e) => setFilterImpact(e.target.value)}
            >
              {impacts.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filter-currency" className="form-label">Currency</label>
            <select
              id="filter-currency"
              className="form-input w-36 text-xs"
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
            >
              {currencies.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="ml-auto text-right text-[10px] text-[var(--color-text-muted)] font-mono">
            Showing {filteredEvents.length} events
          </div>
        </div>
      </div>

      {/* News Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--color-text-muted)]">
            <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Fetching today&apos;s news data...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400">
            <p className="text-2xl mb-2">📡</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-muted)]">
            <p className="text-3xl mb-3">☕</p>
            <p className="text-sm">No economic events scheduled matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-24">Time (EST)</th>
                  <th className="w-20">Currency</th>
                  <th className="w-28">Impact</th>
                  <th>Event Description</th>
                  <th className="w-24 font-mono text-right">Forecast</th>
                  <th className="w-24 font-mono text-right">Previous</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event, idx) => (
                  <tr key={idx} className={event.impact === 'High' ? 'bg-red-500/[0.02]' : ''}>
                    <td className="font-semibold">{event.time}</td>
                    <td className="font-bold tracking-wider text-[var(--color-text-primary)]">{event.country}</td>
                    <td>
                      <span className={`badge text-[9px] px-2 py-0.5 ${getImpactBadgeClass(event.impact)}`}>
                        {event.impact}
                      </span>
                    </td>
                    <td className="text-xs text-[var(--color-text-secondary)] font-medium">{event.title}</td>
                    <td className="font-mono text-right text-xs">{event.forecast || '—'}</td>
                    <td className="font-mono text-right text-xs text-[var(--color-text-muted)]">{event.previous || '—'}</td>
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
