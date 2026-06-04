'use client';

import { useState, useEffect, useMemo } from 'react';

interface TradingViewChartProps {
  symbol: string;
  theme?: 'light' | 'dark';
  interval?: string;
  timezone?: string;
  style?: string;
  locale?: string;
}

// Normalise ticker symbols for TradingView feeds
const SYMBOL_MAP: Record<string, string> = {
  'XAUUSD': 'OANDA:XAUUSD',
  'BTCUSD': 'COINBASE:BTCUSD',
  'ETHUSD': 'COINBASE:ETHUSD',
};

function normalizeSymbol(symbol: string): string {
  return SYMBOL_MAP[symbol.toUpperCase()] || symbol;
}

/**
 * Embeds a live TradingView Advanced Chart via a local HTML page
 * that hosts the official TradingView embed widget script.
 * Symbol/theme/interval are passed as URL query parameters.
 */
export default function TradingViewChart({
  symbol,
  theme = 'dark',
  interval = '15',
  timezone = 'exchange',
  style = '1',
  locale = 'en',
}: TradingViewChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizedSymbol = normalizeSymbol(symbol);

  // Build the local iframe URL with query params
  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams({
      symbol: normalizedSymbol,
      theme,
      interval,
      timezone,
      style,
      locale,
    });
    return `/tradingview-widget.html?${params.toString()}`;
  }, [normalizedSymbol, theme, interval, timezone, style, locale]);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[300px] bg-[#131722] border border-[var(--color-border)] rounded-xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--color-text-muted)] text-xs">Loading Chart...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] bg-[#131722] border border-[var(--color-border)] rounded-xl overflow-hidden relative">
      <iframe
        key={iframeSrc}
        src={iframeSrc}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        allowFullScreen
        allow="clipboard-write"
      />
    </div>
  );
}

// Utility to generate external TradingView Chart URL
export function getTradingViewUrl(symbol: string): string {
  const sym = normalizeSymbol(symbol);
  return `https://www.tradingview.com/chart/?symbol=${sym}`;
}

