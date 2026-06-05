'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // CO1: Restore step from localStorage on mount
  useEffect(() => {
    const savedStep = localStorage.getItem('onboarding_step');
    if (savedStep) {
      const parsed = parseInt(savedStep, 10);
      if (parsed >= 1 && parsed <= 5) {
        setTimeout(() => setStep(parsed), 0);
      }
    }
  }, []);

  // Persist step whenever it changes
  const goToStep = (nextStep: number) => {
    setStep(nextStep);
    localStorage.setItem('onboarding_step', String(nextStep));
  };

  const [form, setForm] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('onboarding_form');
      if (saved) {
        try { return JSON.parse(saved); } catch { /* use defaults */ }
      }
    }
    return {
      accountSize: '100000',
      currentPhase: 'Phase 1',
      riskPerTrade: '1.5',
      maxTradesPerDay: '2',
      screenshotPath: '',
      googleSheetId: '',
      notionApiKey: '',
      discordWebhook: '',
    };
  });

  // Persist step and form state on change
  useEffect(() => {
    localStorage.setItem('onboarding_step', String(step));
  }, [step]);

  useEffect(() => {
    localStorage.setItem('onboarding_form', JSON.stringify(form));
  }, [form]);

  const nextStep = () => goToStep(step + 1);
  const prevStep = () => goToStep(step - 1);

  // Focus trap that dynamically recalculates on step change
  useEffect(() => {
    const wizardElement = document.getElementById('onboarding-wizard-container');
    if (!wizardElement) return;

    const focusableElements = wizardElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    
    // Autofocus the first input or button in the step
    setTimeout(() => {
      if (focusableElements.length > 0) {
        // Prefer input if available, otherwise first element
        const inputs = wizardElement.querySelectorAll('input, select');
        if (inputs.length > 0) {
          (inputs[0] as HTMLElement).focus();
        } else {
          firstElement?.focus();
        }
      }
    }, 50);

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentFocusables = wizardElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (currentFocusables.length === 0) return;

      const currFirst = currentFocusables[0] as HTMLElement;
      const currLast = currentFocusables[currentFocusables.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === currFirst) {
          e.preventDefault();
          currLast?.focus();
        }
      } else {
        if (document.activeElement === currLast) {
          e.preventDefault();
          currFirst?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [step]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountSize: parseFloat(form.accountSize) || 100000,
          currentPhase: form.currentPhase,
          riskPerTrade: parseFloat(form.riskPerTrade) || 1.5,
          maxTradesPerDay: parseInt(form.maxTradesPerDay) || 2,
          webhookUrl: 'http://localhost:3000/api/webhook/tradingview',
          screenshotPath: form.screenshotPath || null,
          googleSheetId: form.googleSheetId || null,
          notionApiKey: form.notionApiKey || null,
          discordWebhook: form.discordWebhook || null,
        }),
      });

      if (res.ok) {
        // Clean up onboarding persistence (CO1)
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('onboarding_form');
        toast.success('Journal settings initialized successfully!');
        onComplete();
      } else {
        toast.error('Failed to save settings. Please try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving setup settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div
        id="onboarding-wizard-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="glass-card max-w-md w-full p-6 space-y-6 border border-[var(--color-accent)] border-opacity-35 shadow-2xl"
      >
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">
            <span>Setup Journal</span>
            <span>Step {step} of 5</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-phase2)] h-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Account Size */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 id="onboarding-title" className="text-sm font-bold text-[var(--color-text-primary)]">💰 Step 1: Account Size</h2>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                Enter your initial account balance. This is critical for calculating risk percentages and lots sizing.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="onboard-acct-size" className="form-label">Initial Balance ($) *</label>
                <input
                  id="onboard-acct-size"
                  type="number"
                  className="form-input font-mono"
                  value={form.accountSize}
                  onChange={(e) => setForm({ ...form, accountSize: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="onboard-risk-trade" className="form-label">Default Risk Per Trade (%)</label>
                <input
                  id="onboard-risk-trade"
                  type="number"
                  step="0.1"
                  className="form-input font-mono"
                  value={form.riskPerTrade}
                  onChange={(e) => setForm({ ...form, riskPerTrade: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Current Phase */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 id="onboarding-title" className="text-sm font-bold text-[var(--color-text-primary)]">🎯 Step 2: Challenge Phase</h2>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                Select your current Maven Prop challenge phase. We enforce specific rules depending on this.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="onboard-phase" className="form-label">Prop Challenge Phase *</label>
                <select
                  id="onboard-phase"
                  className="form-input"
                  value={form.currentPhase}
                  onChange={(e) => setForm({ ...form, currentPhase: e.target.value })}
                >
                  <option>Phase 1</option>
                  <option>Phase 2</option>
                  <option>Funded</option>
                </select>
              </div>
              <div>
                <label htmlFor="onboard-max-trades" className="form-label">Max Trades Per Day</label>
                <input
                  id="onboard-max-trades"
                  type="number"
                  className="form-input font-mono"
                  value={form.maxTradesPerDay}
                  onChange={(e) => setForm({ ...form, maxTradesPerDay: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Webhook URL instructions */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 id="onboarding-title" className="text-sm font-bold text-[var(--color-text-primary)]">🔌 Step 3: TradingView Webhook</h2>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                You can receive instant trade alerts from TradingView Pine Script alerts.
              </p>
            </div>
            <div className="bg-slate-900 border border-[var(--color-border)] rounded-lg p-3 space-y-2">
              <span className="text-[9px] text-[var(--color-text-muted)] font-bold uppercase block">Webhook Endpoint URL</span>
              <code className="text-[10px] text-[var(--color-accent-light)] font-mono select-all break-all block">
                http://localhost:3000/api/webhook/tradingview
              </code>
              <p className="text-[9px] text-[var(--color-text-muted)] mt-1 leading-normal">
                For live TradingView alerts to reach your local app, run a tunnel (e.g. ngrok) pointing to port 3000 and use the public tunnel URL.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Screenshots Folder */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 id="onboarding-title" className="text-sm font-bold text-[var(--color-text-primary)]">📂 Step 4: Screenshot Paths</h2>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                Define the local path where you save your chart screenshots (optional).
              </p>
            </div>
            <div>
              <label htmlFor="onboard-screenshots" className="form-label">Local Screenshot Save Folder</label>
              <input
                id="onboard-screenshots"
                type="text"
                placeholder="e.g. C:\Users\SOUMYADIP\Desktop\Trades\Screenshots"
                className="form-input text-xs"
                value={form.screenshotPath}
                onChange={(e) => setForm({ ...form, screenshotPath: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 5: Integrations */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 id="onboarding-title" className="text-sm font-bold text-[var(--color-text-primary)]">🔗 Step 5: External API Integrations</h2>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                Optional: Connect to Google Sheets, Notion, or Discord for automated syncing and logs (can be skipped).
              </p>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label htmlFor="onboard-gsheet" className="form-label">Google Sheet ID</label>
                <input
                  id="onboard-gsheet"
                  type="text"
                  placeholder="Paste spreadsheet ID here"
                  className="form-input text-xs"
                  value={form.googleSheetId}
                  onChange={(e) => setForm({ ...form, googleSheetId: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="onboard-notion" className="form-label">Notion API Key</label>
                <input
                  id="onboard-notion"
                  type="password"
                  placeholder="secret_..."
                  className="form-input text-xs"
                  value={form.notionApiKey}
                  onChange={(e) => setForm({ ...form, notionApiKey: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="onboard-discord" className="form-label">Discord Webhook URL</label>
                <input
                  id="onboard-discord"
                  type="text"
                  placeholder="https://discord.com/..."
                  className="form-input text-xs"
                  value={form.discordWebhook}
                  onChange={(e) => setForm({ ...form, discordWebhook: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between items-center pt-2">
          {step > 1 ? (
            <button onClick={prevStep} className="btn-secondary text-xs px-4 py-1.5 cursor-pointer">
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {(step === 4 || step === 5) && (
              <button
                type="button"
                onClick={() => {
                  if (step === 4) {
                    setForm({ ...form, screenshotPath: '' });
                    nextStep();
                  } else {
                    setForm({
                      ...form,
                      googleSheetId: '',
                      notionApiKey: '',
                      discordWebhook: '',
                    });
                    setTimeout(() => handleSubmit(), 0);
                  }
                }}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 transition-colors cursor-pointer"
              >
                Skip
              </button>
            )}

            {step < 5 ? (
              <button onClick={nextStep} className="btn-primary text-xs px-5 py-1.5 cursor-pointer">
                Next
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving} className="btn-buy text-xs px-6 py-1.5 cursor-pointer">
                {saving ? 'Saving...' : 'Finish Setup 🚀'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
