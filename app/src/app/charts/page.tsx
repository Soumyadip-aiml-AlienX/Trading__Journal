'use client';

import { useState, useRef, useEffect } from 'react';
import TradingViewChart, { getTradingViewUrl } from '@/components/shared/TradingViewChart';

const SYMBOLS = [
  { name: 'Gold',     value: 'XAUUSD', emoji: '🥇' },
  { name: 'Bitcoin',  value: 'BTCUSD', emoji: '₿' },
  { name: 'Ethereum', value: 'ETHUSD', emoji: 'Ξ' },
];

export default function ChartsPage() {
  const [symbol, setSymbol] = useState('XAUUSD');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loginType, setLoginType] = useState('local');
  const [userEmail, setUserEmail] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setLoginType(localStorage.getItem('user_login_type') || 'local');
      setUserEmail(localStorage.getItem('user_email') || '');
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col transition-all duration-300 relative ${
        isFullscreen
          ? 'fixed inset-0 z-[999] bg-[#0a0a0c] p-0 m-0 w-full h-full' 
          : 'h-[calc(100vh-110px)] space-y-1.5'
      }`}
    >
      {/* Floating Exit Button in Fullscreen Mode */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[9999] bg-red-600/85 hover:bg-red-700 text-white rounded-full px-4 py-2 text-[10px] font-bold shadow-2xl transition-all opacity-40 hover:opacity-100 cursor-pointer flex items-center gap-1.5 border border-red-500/30"
        >
          <span>📺</span> Exit Fullscreen (Esc)
        </button>
      )}
 
      {/* Header toolbar with unified glass design */}
      {!isFullscreen && (
        <div className="flex items-center justify-between gap-2 py-1 px-2.5 rounded-md glass-card bg-[var(--color-surface)]/65 border border-[var(--color-border)] shadow-sm min-h-[36px]">
          <div className="flex items-center gap-2">
            <h1 className="text-[11px] font-bold flex items-center gap-1 text-[var(--color-text-primary)]">
              📈 Interactive Charts
            </h1>
            {mounted && loginType === 'google' && (
              <span className="text-[8px] text-yellow-500 font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider hidden xs:inline-block">
                Sync Active
              </span>
            )}
          </div>
 
          {/* Toolbar Controls with matching heights and paddings */}
          <div className="flex items-center gap-1.5">
            {/* Asset Switcher */}
            <div className="flex bg-[var(--color-navy)] rounded-md p-0.5 border border-[var(--color-border)] h-6 items-center">
              {SYMBOLS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSymbol(s.value)}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 h-full ${
                    symbol === s.value
                      ? 'bg-[var(--color-accent)] text-white shadow-md'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <span>{s.emoji}</span>
                  <span className="hidden xxs:inline">{s.value}</span>
                </button>
              ))}
            </div>
 
            {/* Open in TradingView (external) */}
            <a
              href={getTradingViewUrl(symbol)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] font-bold text-[9px] px-2 flex items-center gap-1 border border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-md transition-all cursor-pointer hover:text-[var(--color-accent-light)] shadow-sm h-6"
            >
              <span>↗️</span> <span className="hidden xs:inline">TradingView</span>
            </a>
 
            {/* Native Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="bg-gradient-to-r from-[var(--color-accent)] to-[#2563EB] hover:brightness-110 text-white font-bold text-[9px] px-2.5 flex items-center gap-1 border border-transparent rounded-md transition-all cursor-pointer shadow-md h-6"
            >
              <span>📺</span> <span>Fullscreen</span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded Chart Wrapper — fills remaining height */}
      <div className="flex-1 relative w-full h-full">
        <TradingViewChart symbol={symbol} />
      </div>
    </div>
  );
}

