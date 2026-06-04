'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [googleInitialized, setGoogleInitialized] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempGoogleEmail, setTempGoogleEmail] = useState('');
  const [tempGoogleName, setTempGoogleName] = useState('');

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // JWT Decoder helper
  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleGoogleLoginSuccess = async (emailAddr: string, fullName: string, avatarUrl?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddr, name: fullName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('maven_logged_in', 'true');
        localStorage.setItem('user_name', data.user.name);
        localStorage.setItem('user_email', data.user.email);
        localStorage.setItem('user_login_type', 'google');
        localStorage.setItem('user_avatar', avatarUrl || 'https://lh3.googleusercontent.com/a/default-user=s96-c');
        localStorage.setItem('sync_source', 'Google Account Cloud Sync');
        window.location.href = '/';
      } else {
        setError(data.error || 'Failed to authenticate via Google.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Google Sign-In connection failure.');
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect to home
    if (localStorage.getItem('maven_logged_in') === 'true') {
      router.push('/');
    }

    if (!googleClientId) return;

    // Load Google script dynamically
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            const decoded = decodeJwt(response.credential);
            if (decoded && decoded.email) {
              handleGoogleLoginSuccess(decoded.email, decoded.name || 'Google User', decoded.picture);
            } else {
              setError('Failed to retrieve user profile from Google.');
            }
          },
        });
        setGoogleInitialized(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [router, googleClientId]);

  useEffect(() => {
    if (googleInitialized && googleClientId) {
      const btnContainer = document.getElementById('google-signin-btn-container');
      if (btnContainer && window.google) {
        window.google.accounts.id.renderButton(
          btnContainer,
          { theme: 'outline', size: 'large', type: 'standard', width: 380 }
        );
      }
    }
  }, [googleInitialized, googleClientId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('maven_logged_in', 'true');
        localStorage.setItem('user_name', data.userName || 'Prop Trader Pro');
        localStorage.setItem('user_email', data.email || email);
        window.location.href = '/';
      } else {
        setError(data.error || 'Invalid credentials.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure. Please check your network and try again.');
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#070709] bg-radial-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-yellow-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Animated Brand Logo / Title */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-500 shadow-lg shadow-yellow-500/20 mb-4 border border-yellow-400/20">
            <span className="text-3xl" role="img" aria-label="maven-logo">⚡</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Maven Journal
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5 font-medium">
            SMC & ICT Hybrid Trading Analytics Console
          </p>
        </div>

        {/* Glassmorphic Login Box */}
        <div className="glass-card p-6 sm:p-8 border border-white/5 relative overflow-hidden shadow-2xl rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
          
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span>🔐</span> Account Sign In
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-medium leading-relaxed">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label htmlFor="email-input" className="form-label text-white/70 font-semibold mb-1.5 block">
                Email Address
              </label>
              <input
                id="email-input"
                type="email"
                required
                className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-10 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password-input" className="form-label text-white/70 font-semibold block">
                  Security Password
                </label>
                <span className="text-[10px] text-yellow-500 hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <input
                id="password-input"
                type="password"
                required
                className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-10 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                id="remember-me"
                type="checkbox"
                defaultChecked
                className="rounded bg-slate-950/50 border-white/10 text-yellow-500 focus:ring-0 cursor-pointer w-4 h-4"
              />
              <label htmlFor="remember-me" className="text-[11px] text-[var(--color-text-muted)] cursor-pointer select-none">
                Keep me authenticated on this workstation
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-10 text-xs font-bold bg-gradient-to-r from-yellow-500 to-amber-500 border-none text-slate-950 hover:brightness-110 shadow-lg shadow-yellow-500/10 cursor-pointer flex items-center justify-center gap-2 rounded-lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Unlock Workspace</span> ➔
                </>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="px-3 text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          {/* Google Sign In Button / Container */}
          {googleClientId ? (
            <div className="flex flex-col items-center gap-2">
              <div id="google-signin-btn-container" className="w-full flex justify-center" />
              <p className="text-[9px] text-[var(--color-text-muted)]">
                Selecting your Google Account will authenticate you securely.
              </p>
            </div>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowConfigModal(true)}
              className="w-full h-10 text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 rounded-lg shadow-md cursor-pointer flex items-center justify-center gap-3 transition-colors border border-slate-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.73-4.94 3.73-8.55z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.24 14.56c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.39 7.17C.5 8.97 0 10.93 0 13s.5 4.03 1.39 5.83l3.85-3.27z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.34 0-5.86-1.81-6.76-4.51l-3.85 2.99C3.37 20.33 7.35 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">
              Don't have an account?{' '}
              <Link href="/register" className="text-yellow-500 hover:underline">
                Register Account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--color-text-muted)] mt-6">
          Maven Trading Journal utilizes client-side isolated keys to protect secure trading logs. 
          <br />© 2026 Maven Prop Firm Analytics.
        </p>
      </div>

      {/* Google Setup & Account Selector Dialog */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-6 border border-yellow-500/20 shadow-2xl relative">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 text-xs text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-overlay)] p-1 rounded"
              title="Close modal"
            >
              ✕
            </button>
            <div className="text-center space-y-2">
              <span className="text-3xl" role="img" aria-label="google-logo">🌐</span>
              <h3 className="text-base font-bold text-white">Google Integration Setup</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                To connect the official Google Account Selector popup, please add your Client ID:
              </p>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-lg border border-white/5 text-[10.5px] text-[var(--color-text-muted)] space-y-2 leading-relaxed">
              <p className="font-bold text-yellow-500/90 uppercase tracking-wider text-[9px]">How to Enable:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Go to Google Cloud Developer Console.</li>
                <li>Create an OAuth 2.0 Client ID for Web Applications.</li>
                <li>Add <code className="bg-white/5 px-1 py-0.5 rounded text-white font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID="..."</code> to your <code className="text-white font-mono">.env.local</code>.</li>
                <li>Restart your development server.</li>
              </ol>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-4">
              <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider block text-center">
                Simulated Google Account Login
              </span>
              <div className="space-y-3">
                <div>
                  <label htmlFor="modal-google-email" className="form-label">Google Account Email</label>
                  <input
                    id="modal-google-email"
                    type="email"
                    required
                    className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 rounded-lg"
                    placeholder="e.g., trader.joe@gmail.com"
                    value={tempGoogleEmail}
                    onChange={(e) => setTempGoogleEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="modal-google-name" className="form-label">Account User Name</label>
                  <input
                    id="modal-google-name"
                    type="text"
                    required
                    className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 rounded-lg"
                    placeholder="e.g., Trader Joe"
                    value={tempGoogleName}
                    onChange={(e) => setTempGoogleName(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  disabled={loading || !tempGoogleEmail}
                  onClick={() => {
                    setShowConfigModal(false);
                    handleGoogleLoginSuccess(tempGoogleEmail, tempGoogleName || 'Google Trader');
                  }}
                  className="btn-primary w-full h-9 text-xs font-bold bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 hover:brightness-110 shadow-lg shadow-yellow-500/10 cursor-pointer rounded-lg flex items-center justify-center"
                >
                  <span>Select & Continue</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
