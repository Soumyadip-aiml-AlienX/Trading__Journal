'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

declare global {
  interface Window {
    google?: any;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('Standard user');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
      const btnContainer = document.getElementById('google-signup-btn-container');
      if (btnContainer && window.google) {
        window.google.accounts.id.renderButton(
          btnContainer,
          { theme: 'outline', size: 'large', type: 'standard', width: 380 }
        );
      }
    }
  }, [googleInitialized, googleClientId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setLoading(true);
    setError(null);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName || 'Trader', email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('maven_logged_in', 'true');
        localStorage.setItem('user_name', data.user.name || 'Prop Trader Pro');
        localStorage.setItem('user_email', data.user.email || email);
        localStorage.setItem('user_role', accountType);
        window.location.href = '/';
      } else {
        setError(data.error || 'Failed to create account.');
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
      {/* Background Neon Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-yellow-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 my-8">
        {/* Logo Banner */}
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
            <Link
              href="/login"
              className="flex-1 py-4 text-center text-xs font-bold text-slate-400 hover:text-white border-b-2 border-transparent hover:bg-white/[0.01]"
            >
              Sign in
            </Link>
            <button
              type="button"
              className="flex-1 py-4 text-center text-xs font-bold text-white border-b-2 border-[#10b981] relative cursor-default"
            >
              Create account
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-medium leading-relaxed">
                ⚠️ {error}
              </div>
            )}

            {/* Account Type Selector Grid */}
            <div className="space-y-1.5">
              <label className="form-label text-[10px] font-bold tracking-wider text-white/50">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Administrator', label: 'Administrator', dotColor: 'bg-blue-500' },
                  { id: 'Moderator', label: 'Moderator', dotColor: 'bg-amber-600' },
                  { id: 'Standard user', label: 'Standard user', dotColor: 'bg-emerald-500' },
                  { id: 'Viewer', label: 'Viewer', dotColor: 'bg-purple-500' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAccountType(type.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left
                      ${accountType === type.id 
                        ? 'bg-slate-900/60 border-emerald-500/40 text-white' 
                        : 'bg-[#14151b] border-white/5 text-slate-400 hover:bg-slate-900/40 hover:border-white/10'
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${type.dotColor}`} />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* First Name & Last Name (Side by Side) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first-name" className="form-label text-[10px] font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                  First name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-sm">👤</span>
                  <input
                    id="first-name"
                    type="text"
                    required
                    className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 pl-8 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
                    placeholder="Ada"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="last-name" className="form-label text-[10px] font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                  Last name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-sm">👤</span>
                  <input
                    id="last-name"
                    type="text"
                    required
                    className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 pl-8 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
                    placeholder="Lovelace"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Work Email */}
            <div>
              <label htmlFor="email-input" className="form-label text-[10px] font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                Work email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">✉️</span>
                <input
                  id="email-input"
                  type="email"
                  required
                  className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 pl-8 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
                  placeholder="ada@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password-input" className="form-label text-[10px] font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">🔒</span>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 px-8 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-500 hover:text-white cursor-pointer select-none text-xs"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="form-label text-[10px] font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                Confirm password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">✔️</span>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 px-8 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2 text-slate-500 hover:text-white cursor-pointer select-none text-xs"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Terms of Service Checkbox */}
            <div className="flex items-start gap-2.5 py-1">
              <input
                id="agree-terms"
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded bg-slate-950/50 border-white/10 text-emerald-500 focus:ring-0 cursor-pointer w-4 h-4 mt-0.5"
              />
              <label htmlFor="agree-terms" className="text-[11px] text-[var(--color-text-secondary)] cursor-pointer select-none leading-relaxed">
                I agree to the <span className="text-emerald-400 hover:underline">Terms of Service</span> and <span className="text-emerald-400 hover:underline">Privacy Policy</span>
              </label>
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
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="px-3 text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          {/* Google Sign In/Up Button Container */}
          {googleClientId ? (
            <div className="flex flex-col items-center gap-2">
              <div id="google-signup-btn-container" className="w-full flex justify-center" />
              <p className="text-[9px] text-[var(--color-text-muted)]">
                Selecting your Google Account will register and sign you in.
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
          <div className="glass-card max-w-md w-full p-6 space-y-5 border border-yellow-500/20 shadow-2xl relative">
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
              <h3 className="text-base font-bold text-white">Choose an account</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">to continue to Maven Journal</p>
            </div>

            {/* List of Simulated Google Accounts */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {[
                { email: 'trader.maven@gmail.com', name: 'Maven Prop Trader', avatar: 'M' },
                { email: 'john.doe@gmail.com', name: 'John Doe', avatar: 'J' },
                { email: 'prop.trader.pro@gmail.com', name: 'Prop Trader Pro', avatar: 'P' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setShowConfigModal(false);
                    handleGoogleLoginSuccess(acc.email, acc.name);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-white/10 text-left transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500/20 to-amber-500/20 text-yellow-500 font-bold flex items-center justify-center text-xs border border-yellow-500/10">
                    {acc.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{acc.name}</div>
                    <div className="text-[10px] text-[var(--color-text-secondary)] truncate">{acc.email}</div>
                  </div>
                  <span className="text-[10px] text-yellow-500 font-bold">Select</span>
                </button>
              ))}
            </div>

            {/* Manual Entry Form */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <details className="group">
                <summary className="text-[11px] font-bold text-[var(--color-text-muted)] cursor-pointer select-none hover:text-white flex items-center gap-1 group-open:mb-3">
                  <span>➕</span> Use another account / Custom Google credentials
                </summary>
                <div className="space-y-3 pt-1">
                  <div>
                    <label htmlFor="modal-google-email" className="form-label">Google Account Email</label>
                    <input
                      id="modal-google-email"
                      type="email"
                      required
                      className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-9 rounded-lg"
                      placeholder="e.g., my.custom.account@gmail.com"
                      value={tempGoogleEmail}
                      onChange={(e) => setTempGoogleEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-google-name" className="form-label">Account Display Name</label>
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
                    <span>Select & Continue</span>
                  </button>
                </div>
              </details>

              <details className="group">
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
    </div>
  );
}
