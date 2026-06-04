'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/shared/Toast';

interface SettingsData {
  accountSize: number;
  currentPhase: string;
  riskPerTrade: number;
  maxTradesPerDay: number;
  webhookUrl: string;
  screenshotPath: string;
  googleSheetId: string;
  notionApiKey: string;
  discordWebhook: string;
}

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsData>({
    accountSize: 100000,
    currentPhase: 'Phase 1',
    riskPerTrade: 1.5,
    maxTradesPerDay: 2,
    webhookUrl: 'http://localhost:3000/api/webhook/tradingview',
    screenshotPath: '',
    googleSheetId: '',
    notionApiKey: '',
    discordWebhook: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [hasGoogleCreds, setHasGoogleCreds] = useState(false);

  useEffect(() => {
    async function checkGoogleCreds() {
      try {
        const res = await fetch('/api/integrations/google');
        if (res.ok) {
          const data = await res.json();
          setHasGoogleCreds(data.hasCredentials);
        }
      } catch (err) {
        console.warn('Google credentials check failed:', err);
      }
    }
    checkGoogleCreds();
  }, []);

  const handleSyncGoogle = async () => {
    setSyncingGoogle(true);
    try {
      const res = await fetch('/api/integrations/google', { method: 'POST' });
      const data = await res.json();
      toast.success(data.message || 'Google Sheets sync completed!');
    } catch (err) {
      console.warn('Google Sheets sync failed:', err);
    } finally {
      setSyncingGoogle(false);
    }
  };

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data) setSettings(data);
        }
      } catch (err) {
        console.warn('Settings fetch failed:', err);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        toast.success('Settings saved successfully!');
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error('Failed to save settings.');
      }
    } catch (err) {
      console.warn('Settings save failed:', err);
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">⚙️ Settings</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-6">
          {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Settings'}
        </button>
      </div>

      {/* Account */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Account Configuration
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="setting-acct-size" className="form-label">Account Size ($)</label>
            <input
              id="setting-acct-size"
              type="number"
              className="form-input font-mono"
              value={settings.accountSize}
              onChange={(e) => setSettings({ ...settings, accountSize: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label htmlFor="setting-phase" className="form-label">Current Phase</label>
            <select
              id="setting-phase"
              className="form-input"
              value={settings.currentPhase}
              onChange={(e) => setSettings({ ...settings, currentPhase: e.target.value })}
            >
              <option>Phase 1</option>
              <option>Phase 2</option>
              <option>Funded</option>
            </select>
          </div>
          <div>
            <label htmlFor="setting-risk" className="form-label">Risk Per Trade (%)</label>
            <input
              id="setting-risk"
              type="number"
              step="0.1"
              className="form-input font-mono"
              value={settings.riskPerTrade}
              onChange={(e) => setSettings({ ...settings, riskPerTrade: parseFloat(e.target.value) || 1.5 })}
            />
          </div>
          <div>
            <label htmlFor="setting-max-trades" className="form-label">Max Trades Per Day</label>
            <input
              id="setting-max-trades"
              type="number"
              className="form-input font-mono"
              value={settings.maxTradesPerDay}
              onChange={(e) => setSettings({ ...settings, maxTradesPerDay: parseInt(e.target.value) || 2 })}
            />
          </div>
        </div>
      </div>

      {/* TradingView */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          TradingView Integration
        </h2>
        <div>
          <label htmlFor="setting-webhook" className="form-label">Webhook URL</label>
          <input
            id="setting-webhook"
            type="text"
            className="form-input font-mono text-xs"
            value={settings.webhookUrl || ''}
            onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
          />
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
            Set this URL as the webhook destination in your TradingView alerts.
          </p>
        </div>
      </div>

      {/* File Paths */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          File Paths
        </h2>
        <div>
          <label htmlFor="setting-screenshot-path" className="form-label">Screenshot Save Path</label>
          <input
            id="setting-screenshot-path"
            type="text"
            className="form-input font-mono text-xs"
            placeholder="e.g., C:\Users\Desktop\TradingJournal\screenshots"
            value={settings.screenshotPath || ''}
            onChange={(e) => setSettings({ ...settings, screenshotPath: e.target.value })}
          />
        </div>
      </div>

      {/* Integrations */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          External Integrations <span className="text-[var(--color-text-muted)] normal-case">(optional)</span>
        </h2>
        <div>
          <label htmlFor="setting-gsheet" className="form-label">Google Sheet ID</label>
          <input
            id="setting-gsheet"
            type="text"
            className="form-input font-mono text-xs"
            placeholder="From your Google Sheets URL"
            value={settings.googleSheetId || ''}
            onChange={(e) => setSettings({ ...settings, googleSheetId: e.target.value })}
          />
          <div className="mt-3 flex items-center justify-between text-[11px] bg-[var(--color-navy)] p-3 rounded-lg border border-[var(--color-border)]">
            <span className={hasGoogleCreds ? 'text-buy font-medium' : 'text-warn font-medium'}>
              {hasGoogleCreds ? '✅ google-credentials.json found' : '⚠️ google-credentials.json missing'}
            </span>
            <button
              onClick={handleSyncGoogle}
              disabled={syncingGoogle || !settings.googleSheetId || !hasGoogleCreds}
              className="btn-primary py-1 px-4 text-[10px] cursor-pointer"
            >
              {syncingGoogle ? 'Syncing...' : '🔄 Sync Google Sheets'}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="setting-notion" className="form-label">Notion API Key</label>
          <input
            id="setting-notion"
            type="password"
            className="form-input font-mono text-xs"
            placeholder="secret_..."
            value={settings.notionApiKey || ''}
            onChange={(e) => setSettings({ ...settings, notionApiKey: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="setting-discord" className="form-label">Discord Webhook URL</label>
          <input
            id="setting-discord"
            type="text"
            className="form-input font-mono text-xs"
            placeholder="https://discord.com/api/webhooks/..."
            value={settings.discordWebhook || ''}
            onChange={(e) => setSettings({ ...settings, discordWebhook: e.target.value })}
          />
        </div>
      </div>

      {/* Security & Session */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Security & Session
        </h2>
        <div className="flex items-center justify-between p-4 rounded-lg bg-red-950/10 border border-red-500/20">
          <div>
            <h4 className="text-xs font-bold text-white">Active Workspace Session</h4>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              Securely sign out of this device. All local changes are synced to your database context.
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('maven_logged_in');
              window.location.href = '/login';
            }}
            className="btn-primary bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-all border-none"
          >
            🚪 Sign Out of Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
