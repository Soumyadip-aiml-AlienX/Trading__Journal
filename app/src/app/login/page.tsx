'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@maven.com');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect to home
    if (localStorage.getItem('maven_logged_in') === 'true') {
      router.push('/');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate network delay
    setTimeout(() => {
      if (email === 'demo@maven.com' && password === 'admin') {
        localStorage.setItem('maven_logged_in', 'true');
        // Add default profile info if not present
        localStorage.setItem('user_name', 'Prop Trader Pro');
        window.location.href = '/';
      } else {
        setError('Invalid email or password. Use demo@maven.com / admin to login.');
        setLoading(false);
      }
    }, 800);
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
        <div className="glass-card p-8 border border-white/5 relative overflow-hidden shadow-2xl rounded-2xl">
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

          {/* Google Sign In Button */}
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setError(null);
              setTimeout(() => {
                localStorage.setItem('maven_logged_in', 'true');
                localStorage.setItem('user_name', 'John Doe');
                localStorage.setItem('user_email', 'john.doe@gmail.com');
                localStorage.setItem('user_login_type', 'google');
                localStorage.setItem('user_avatar', 'https://lh3.googleusercontent.com/a/default-user=s96-c');
                // Sync notification settings
                localStorage.setItem('sync_source', 'Google Account Cloud Sync');
                window.location.href = '/';
              }, 1200);
            }}
            className="w-full h-10 text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 rounded-lg shadow-md cursor-pointer flex items-center justify-center gap-3 transition-colors border border-slate-200"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Syncing Google Data...</span>
              </>
            ) : (
              <>
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
              </>
            )}
          </button>

          {/* Quick Helper Credentials Banner */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <span className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider block mb-2">
              Demo Credentials
            </span>
            <div className="inline-flex flex-wrap justify-center gap-x-4 gap-y-1 bg-white/[0.02] border border-white/5 py-2 px-3 rounded-lg text-[10px] font-mono text-yellow-500/90">
              <div><span className="text-[var(--color-text-muted)]">User:</span> demo@maven.com</div>
              <div><span className="text-[var(--color-text-muted)]">Pass:</span> admin</div>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--color-text-muted)] mt-6">
          Maven Trading Journal utilizes client-side isolated keys to protect secure trading logs. 
          <br />© 2026 Maven Prop Firm Analytics.
        </p>
      </div>
    </div>
  );
}
