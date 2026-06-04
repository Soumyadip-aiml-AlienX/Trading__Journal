'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem('maven_logged_in') === 'true') {
      router.push('/');
    }
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('maven_logged_in', 'true');
        localStorage.setItem('user_name', data.user.name || 'Prop Trader Pro');
        localStorage.setItem('user_email', data.user.email || email);
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

      <div className="w-full max-w-md relative z-10">
        {/* Logo Banner */}
        <div className="text-center mb-8">
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

        {/* Form Container */}
        <div className="glass-card p-8 border border-white/5 relative overflow-hidden shadow-2xl rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
          
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span>📝</span> Create Trading Account
          </h2>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-medium leading-relaxed">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label htmlFor="name-input" className="form-label text-white/70 font-semibold mb-1.5 block">
                Full Name
              </label>
              <input
                id="name-input"
                type="text"
                required
                className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-10 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
              <label htmlFor="password-input" className="form-label text-white/70 font-semibold mb-1.5 block">
                Security Password
              </label>
              <input
                id="password-input"
                type="password"
                required
                minLength={6}
                className="form-input w-full bg-slate-950/50 border-white/10 text-xs h-10 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-10 text-xs font-bold bg-gradient-to-r from-yellow-500 to-amber-500 border-none text-slate-950 hover:brightness-110 shadow-lg shadow-yellow-500/10 cursor-pointer flex items-center justify-center gap-2 rounded-lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span> ➔
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">
              Already have an account?{' '}
              <Link href="/login" className="text-yellow-500 hover:underline">
                Sign In
              </Link>
            </p>
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
