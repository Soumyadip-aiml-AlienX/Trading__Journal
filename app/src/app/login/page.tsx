'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [showPassword, setShowPassword] = useState(false);

  const [googleInitialized, setGoogleInitialized] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempGoogleEmail, setTempGoogleEmail] = useState('');
  const [tempGoogleName, setTempGoogleName] = useState('');

  // Password reset state variables
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetName, setResetName] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);


  const googleClientId = 
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && 
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== 'undefined' && 
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.trim() !== '' 
      ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID 
      : null;

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
  }, [router]);

  useEffect(() => {
    if (!mounted || !googleClientId) return;

    const initGoogle = () => {
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

        const btnContainer = document.getElementById('google-signin-btn-container');
        if (btnContainer) {
          window.google.accounts.id.renderButton(
            btnContainer,
            { theme: 'outline', size: 'large', type: 'standard', width: 380 }
          );
        }
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [mounted, googleClientId]);

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          name: resetName,
          newPassword: resetNewPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResetSuccess('Password reset successfully! You can now sign in.');
        setResetEmail('');
        setResetName('');
        setResetNewPassword('');
        // Autofill login email
        setEmail(resetEmail);
      } else {
        setResetError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      setResetError('Connection failure. Please check your network and try again.');
    } finally {
      setResetLoading(false);
    }
  };


  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#070709] bg-radial-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-yellow-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 my-8">
        {/* Animated Brand Logo / Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-500 shadow-lg shadow-yellow-500/20 mb-3 border border-yellow-400/20">
            <span className="text-2xl" role="img" aria-label="maven-logo">⚡</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Maven Journal
          </h1>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1 font-medium">
            SMC & ICT Hybrid Trading Analytics Console
          </p>
        </div>

        {/* Tabbed Container Box */}
        <div className="glass-card overflow-hidden shadow-2xl rounded-2xl bg-[#0f1015]/95 border border-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
          
          {/* Tabs */}
          <div className="flex border-b border-white/5 bg-[#14151b]">
            <button
              type="button"
              className="flex-1 py-4 text-center text-xs font-bold text-white border-b-2 border-[#10b981] relative cursor-default"
            >
              Sign in
            </button>
            <Link
              href="/register"
              className="flex-1 py-4 text-center text-xs font-bold text-slate-400 hover:text-white border-b-2 border-transparent hover:bg-white/[0.01]"
            >
              Create account
            </Link>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Google Sign In Container (Centered, No GitHub) */}
            <div className="w-full flex justify-center">
              {googleClientId ? (
                <div className="w-full flex flex-col items-center gap-1.5">
                  <div id="google-signin-btn-container" className="w-full flex justify-center" />
                </div>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowConfigModal(true)}
                  className="w-full h-11 text-xs font-bold bg-[#14151b] hover:bg-slate-900/60 text-white rounded-lg shadow-md cursor-pointer flex items-center justify-center gap-3 transition-colors border border-white/10"
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
            </div>

            {/* Divider */}
            <div className="flex items-center">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="px-3 text-[10px] text-[var(--color-text-muted)] font-medium lowercase">or sign in with email</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-medium leading-relaxed">
                  ⚠️ {error}
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email-input" className="form-label text-[10px] font-bold tracking-wider text-white/50">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-sm">✉️</span>
                  <input
                    id="email-input"
                    type="email"
                    required
                    style={{ paddingLeft: '2.25rem' }}
                    className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password-input" className="form-label text-[10px] font-bold tracking-wider text-white/50">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-sm">🔒</span>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}
                    className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-slate-500 hover:text-white cursor-pointer select-none text-xs"
                  >
                    {showPassword ? '👁' : '👁️‍🗨️'}
                  </button>
                </div>
                <div className="text-right mt-1.5">
                  <span
                    onClick={() => {
                      setShowResetModal(true);
                      setResetError(null);
                      setResetSuccess(null);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </span>
                </div>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 text-xs font-bold bg-[#10b981] hover:bg-[#059669] border-none text-slate-950 hover:brightness-110 shadow-lg cursor-pointer flex items-center justify-center gap-2 rounded-lg transition-colors text-white"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>
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
          <div className="glass-card max-w-md w-full p-6 space-y-5 border border-yellow-500/20 shadow-2xl relative bg-[#0f1015]">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 text-xs text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-overlay)] p-1 rounded cursor-pointer"
              title="Close modal"
            >
              ✕
            </button>
            
            {/* Google Header Logo */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md mb-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              </div>
              <h3 className="text-base font-bold text-white">Sign in with Google</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Enter your details to synchronize your trading logs</p>
            </div>

            {/* Custom Google Sign-In Form */}
            <div className="space-y-4 pt-2">
              <div>
                <label htmlFor="modal-google-email" className="form-label text-[10px] font-bold tracking-wider text-white/50">Google Account Email</label>
                <input
                  id="modal-google-email"
                  type="email"
                  required
                  className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 rounded-lg"
                  placeholder="e.g., your.name@gmail.com"
                  value={tempGoogleEmail}
                  onChange={(e) => setTempGoogleEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="modal-google-name" className="form-label text-[10px] font-bold tracking-wider text-white/50">Account Display Name</label>
                <input
                  id="modal-google-name"
                  type="text"
                  required
                  className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 rounded-lg"
                  placeholder="e.g., Alex Mercer"
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
                className="btn-primary w-full h-9 text-xs font-bold bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 hover:brightness-110 shadow-lg cursor-pointer rounded-lg flex items-center justify-center"
              >
                <span>Sign in with Google</span>
              </button>

              <details className="group pt-2 border-t border-white/5">
                <summary className="text-[10px] text-[var(--color-text-muted)] hover:text-white cursor-pointer select-none flex items-center gap-1">
                  <span>⚙️</span> Developer instructions (Official Google OAuth)
                </summary>
                <div className="mt-2 bg-slate-950/50 p-3 rounded-lg border border-white/5 text-[10px] text-[var(--color-text-muted)] space-y-1.5 leading-relaxed">
                  <p className="font-bold text-yellow-500/90 uppercase tracking-wider text-[8px]">Steps to enable real popup:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Create OAuth Client ID on Google Cloud Console.</li>
                    <li>Add <code className="bg-white/5 px-1 py-0.5 rounded text-white font-mono text-[9px]">NEXT_PUBLIC_GOOGLE_CLIENT_ID="..."</code> to <code className="text-white font-mono text-[9px]">.env.local</code>.</li>
                    <li>Restart dev server.</li>
                  </ol>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Reset Dialog */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-5 border border-yellow-500/20 shadow-2xl relative bg-[#0f1015]">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 right-4 text-xs text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-overlay)] p-1 rounded cursor-pointer"
              title="Close modal"
            >
              ✕
            </button>
            
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10 shadow-md mb-2">
                <span className="text-xl">🔑</span>
              </div>
              <h3 className="text-base font-bold text-white">Reset Password</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Verify your email and display name to set a new password</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-medium leading-relaxed">
                  ⚠️ {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs font-medium leading-relaxed">
                  ✅ {resetSuccess}
                </div>
              )}

              <div>
                <label htmlFor="reset-email" className="form-label text-[10px] font-bold tracking-wider text-white/50">Registered Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 rounded-lg"
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="reset-name" className="form-label text-[10px] font-bold tracking-wider text-white/50">Account Display Name</label>
                <input
                  id="reset-name"
                  type="text"
                  required
                  className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 rounded-lg"
                  placeholder="e.g., Alex Mercer"
                  value={resetName}
                  onChange={(e) => setResetName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="reset-password" className="form-label text-[10px] font-bold tracking-wider text-white/50">New Password</label>
                <input
                  id="reset-password"
                  type="password"
                  required
                  className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 rounded-lg"
                  placeholder="••••••••"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full h-9 text-xs font-bold bg-[#10b981] hover:bg-[#059669] text-white shadow-lg cursor-pointer rounded-lg flex items-center justify-center gap-2"
              >
                {resetLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

