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
          : 'h-[calc(100vh-120px)] space-y-4'
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

      {/* Header toolbar */}
      {!isFullscreen && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              📈 Interactive Charts
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Analyze live market price actions and indicators using advanced charting tools.
            </p>
            {mounted && loginType === 'google' && (
              <p className="text-[10px] text-yellow-500 font-bold mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                <span>Workspace Sync Active — Connected to Google Account ({userEmail})</span>
              </p>
            )}
          </div>

          {/* Toolbar Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Asset Switcher */}
            <div className="flex bg-[var(--color-navy)] rounded-lg p-0.5 border border-[var(--color-border)]">
              {SYMBOLS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSymbol(s.value)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                    symbol === s.value
                      ? 'bg-[var(--color-accent)] text-white shadow-md'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <span>{s.emoji}</span>
                  {s.value}
                </button>
              ))}
            </div>

            {/* Open in TradingView (external) */}
            <a
              href={getTradingViewUrl(symbol)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-[10px] py-1.5 px-3 flex items-center gap-1.5 hover:text-[var(--color-accent-light)] border border-[var(--color-border)] rounded-lg transition-all hover:border-[var(--color-accent)]"
            >
              <span>↗️</span> Open in TradingView
            </a>

            {/* Native Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-[10px] font-bold py-1.5 px-4 flex items-center gap-1.5 rounded-lg transition-all cursor-pointer btn-primary"
            >
              <span>📺</span> Fullscreen
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

