'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDrawdown } from '@/context/DrawdownContext';

const navItems = [
  { href: '/',            label: 'Dashboard',       icon: '📊' },
  { href: '/trades/new',  label: 'New Trade',        icon: '➕' },
  { href: '/trades',      label: 'Trade Log',        icon: '📋' },
  { href: '/charts',      label: 'Charts',           icon: '📈' },
  { href: '/performance', label: 'Performance',      icon: '🏆' },
  { href: '/psychology',  label: 'Psychology',        icon: '🧠' },
  { href: '/risk',        label: 'Risk Monitor',     icon: '⚠️' },
  { href: '/reflection',  label: 'Daily Reflection', icon: '📝' },
  { href: '/lessons',     label: 'Lessons DB',       icon: '🎓' },
  { href: '/alerts',      label: 'Alerts Log',       icon: '🔔' },
  { href: '/news',        label: 'News Alerts',      icon: '📰' },
  { href: '/export',      label: 'PDF Export',       icon: '📄' },
  { href: '/settings',    label: 'Settings',         icon: '⚙️' },
];

// External link that opens TradingView directly in the browser
const externalLinks = [
  { 
    href: 'https://www.tradingview.com/chart/', 
    label: 'TradingView', 
    icon: '↗️',
    title: 'Open TradingView.com in browser'
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  isCollapsed = false,
  onToggle = () => {},
  isMobileOpen = false,
  onMobileClose = () => {},
}: SidebarProps) {
  const pathname = usePathname();
  const { data } = useDrawdown();
  const [showCelebration, setShowCelebration] = useState(false);
  const [dismissedCelebration, setDismissedCelebration] = useState(false);
  const [userName, setUserName] = useState('Trader');
  const [userEmail, setUserEmail] = useState('');
  const [loginType, setLoginType] = useState('local');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('user_name') || 'Prop Trader Pro');
      setUserEmail(localStorage.getItem('user_email') || 'trader@maven.com');
      setLoginType(localStorage.getItem('user_login_type') || 'local');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('maven_logged_in');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_login_type');
    localStorage.removeItem('user_avatar');
    window.location.href = '/login';
  };

  useEffect(() => {
    if (!data) return;

    // Trigger celebration if target is reached and not already dismissed/celebrated
    const hasReachedTarget = data.phaseProgress >= data.phaseTarget;
    const wasCelebrated = sessionStorage.getItem('phase_celebrated');
    
    if (hasReachedTarget && !wasCelebrated && !dismissedCelebration) {
      setTimeout(() => setShowCelebration(true), 0);
      sessionStorage.setItem('phase_celebrated', 'true');
    }
  }, [data, dismissedCelebration]);

  const phase = data?.phase || 'Phase 1';
  const phasePnl = data?.phaseProgress || 0;
  const phaseTarget = data?.phaseTarget || 8;
  const progressPct = Math.max(0, Math.min(100, (phasePnl / phaseTarget) * 100));
  const streak = data?.streak ?? 0;

  const isPhase2 = phase === 'Phase 2';

  const getPhaseColor = () => {
    return isPhase2 ? 'text-[var(--color-phase2-light)]' : 'text-[var(--color-phase1-light)]';
  };

  const getProgressFillClass = () => {
    return isPhase2 ? 'progress-fill phase2' : 'progress-fill';
  };

  return (
    <>
      <aside className={`fixed left-0 top-0 h-dvh bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col z-40 select-none transition-all duration-300
        ${isCollapsed ? 'w-[70px]' : 'w-[240px]'}
        max-md:w-[240px] max-md:z-50 max-md:shadow-2xl
        ${isMobileOpen ? 'max-md:translate-x-0' : 'max-md:translate-x-[-100%]'}
      `}>
        {/* Logo */}
        <div className={`px-4 py-5 border-b border-[var(--color-border)] flex items-center max-md:justify-between ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-phase2)] flex items-center justify-center text-white font-bold text-sm">
              MJ
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="max-md:block">
                <h1 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">
                  Maven Journal
                </h1>
                <p className="text-[10px] text-[var(--color-text-muted)] font-medium tracking-wider uppercase">
                  SMC + ICT Hybrid
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggle}
              className="max-md:hidden text-xs text-[var(--color-text-muted)] hover:text-white p-1 hover:bg-[var(--color-surface-overlay)] rounded cursor-pointer transition-colors"
              title="Collapse Menu"
              aria-label="Collapse sidebar"
            >
              ◀
            </button>
          )}
          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden text-sm text-[var(--color-text-muted)] hover:text-white p-1.5 hover:bg-[var(--color-surface-overlay)] rounded cursor-pointer transition-colors"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Expand Trigger for Collapsed State */}
        {isCollapsed && (
          <div className="py-2 text-center border-b border-[var(--color-border)] max-md:hidden">
            <button
              type="button"
              onClick={onToggle}
              className="text-xs text-[var(--color-text-muted)] hover:text-white p-2 hover:bg-[var(--color-surface-overlay)] rounded cursor-pointer transition-colors"
              title="Expand Menu"
              aria-label="Expand sidebar"
            >
              ▶
            </button>
          </div>
        )}

        {/* User Profile Summary */}
        <div className={`p-4 border-b border-[var(--color-border)] flex items-center gap-3 ${
          isCollapsed ? 'justify-center' : ''
        }`}>
          {/* Avatar Container */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md border border-white/10">
              {userName ? userName.charAt(0) : 'U'}
            </div>
            {loginType === 'google' && (
              <span 
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-[#0a0a0c] flex items-center justify-center text-[9px] shadow-sm font-bold text-slate-900 select-none" 
                title="Synced with Google Account"
              >
                G
              </span>
            )}
          </div>

          {(!isCollapsed || isMobileOpen) && (
            <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                  {userName}
                </h4>
                <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                  {userEmail}
                </p>
                {loginType === 'google' && (
                  <div className="flex items-center gap-1.5 mt-1 text-[8px] font-bold text-yellow-500 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                    <span>Google Cloud Active</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-[var(--color-text-muted)] hover:text-red-400 p-1 hover:bg-[var(--color-surface-overlay)] rounded cursor-pointer transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                🚪
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-none">
          {navItems.map((item) => {
            // Precise active-state matching to avoid prefix collisions
            // e.g. /trades/new must NOT also highlight /trades (Trade Log)
            const isActive = (() => {
              if (item.href === '/') return pathname === '/';
              if (item.href === '/trades/new') return pathname === '/trades/new';
              if (item.href === '/trades') {
                return pathname === '/trades' || (pathname.startsWith('/trades/') && !pathname.startsWith('/trades/new'));
              }
              return pathname === item.href || pathname.startsWith(item.href + '/');
            })();

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`nav-link ${isActive ? 'active' : ''} ${
                  isCollapsed ? 'justify-center px-0' : ''
                } max-md:justify-start max-md:px-4`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="text-base" role="img" aria-hidden="true">{item.icon}</span>
                {(!isCollapsed || isMobileOpen) && <span className="max-md:inline">{item.label}</span>}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="!my-2 border-t border-[var(--color-border)] opacity-40" />

          {/* External Links (Open in Browser) */}
          {externalLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onMobileClose}
              className={`nav-link hover:!text-[var(--color-accent-light)] ${
                isCollapsed ? 'justify-center px-0' : ''
              } max-md:justify-start max-md:px-4`}
              title={isCollapsed ? item.label : item.title}
            >
              <span className="text-base" aria-hidden="true">{item.icon}</span>
              {(!isCollapsed || isMobileOpen) && (
                <span className="flex items-center gap-1 max-md:inline-flex">
                  {item.label}
                  <span className="text-[8px] opacity-50 ml-0.5">↗</span>
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Phase Badge */}
        {isCollapsed && !isMobileOpen ? (
          <div className="px-2 py-4 border-t border-[var(--color-border)] text-center flex flex-col items-center max-md:hidden">
            <span
              className={`text-xs font-bold font-mono px-2 py-1 rounded bg-[var(--color-navy)] border border-[var(--color-border)] ${getPhaseColor()}`}
              title={`${phase}: ${phasePnl >= 0 ? '+' : ''}${phasePnl.toFixed(2)}% / ${phaseTarget.toFixed(2)}%`}
            >
              {phase === 'Phase 1' ? 'P1' : phase === 'Phase 2' ? 'P2' : 'FD'}
            </span>
          </div>
        ) : (
          <div className="px-4 py-4 border-t border-[var(--color-border)] max-md:block">
            <div className="glass-card p-3">
              <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                Current Phase
              </div>
              <div className={`text-sm font-bold ${getPhaseColor()}`}>
                {phase}
              </div>
              <div className="progress-bar mt-2">
                <div className={getProgressFillClass()} style={{ width: `${progressPct}%` }} />
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)] mt-1 flex justify-between font-mono">
                <span>{phasePnl >= 0 ? '+' : ''}{phasePnl.toFixed(2)}%</span>
                <span>/ {phaseTarget.toFixed(2)}%</span>
              </div>
            </div>

            {/* CO2: Daily Streak Counter */}
            {streak > 0 && (
              <div className="mt-2 flex items-center justify-between px-1">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                  Trading Streak
                </span>
                <span
                  className="flex items-center gap-1 text-xs font-bold text-amber-400"
                  title={`${streak} consecutive trading day${streak !== 1 ? 's' : ''}`}
                >
                  <span aria-hidden="true">🔥</span>
                  {streak}d
                </span>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Full-Screen Celebration Overlay */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="glass-card max-w-md w-full p-8 text-center space-y-6 border border-yellow-500/30 shadow-2xl relative animate-bounce-slow">
            <span className="text-6xl animate-pulse block">🎉</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-200">
                Prop Phase Achieved!
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Congratulations! You reached your {phase} profit target of <strong className="text-white font-bold">{phaseTarget}%</strong>. Your current performance stands at <strong className="text-buy font-bold">{phasePnl.toFixed(2)}%</strong>!
              </p>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-lg border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Please contact Maven Prop Firm to verify your account, close any remaining open orders, and request access to the next evaluation stage.
              </p>
            </div>
            <button
              onClick={() => {
                setShowCelebration(false);
                setDismissedCelebration(true);
              }}
              className="btn-primary w-full py-2.5 text-xs font-bold bg-gradient-to-r from-yellow-500 to-amber-500 border-none text-slate-950 hover:brightness-110 shadow-lg cursor-pointer"
            >
              Continue to Journal
            </button>
          </div>
        </div>
      )}
    </>
  );
}
