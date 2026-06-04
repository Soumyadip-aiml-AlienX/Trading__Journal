'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DrawdownData {
  todayPnl: number;
  dailyUsed: number;
  dailyRemaining: number;
  overallUsed: number;
  tradesCount: number;
  maxTrades: number;
  phase: string;
  phaseProgress: number;
  phaseTarget: number;
  streak: number;
}

interface DrawdownContextType {
  data: DrawdownData;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultData: DrawdownData = {
  todayPnl: 0,
  dailyUsed: 0,
  dailyRemaining: 4,
  overallUsed: 0,
  tradesCount: 0,
  maxTrades: 2,
  phase: 'Phase 1',
  phaseProgress: 0,
  phaseTarget: 8,
  streak: 0,
};

const DrawdownContext = createContext<DrawdownContextType | undefined>(undefined);

export function DrawdownProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DrawdownData>(defaultData);
  const [loading, setLoading] = useState(true);

  async function fetchProgress() {
    try {
      const res = await fetch('/api/drawdown');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch drawdown progress:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProgress();
    
    // Poll every 10 seconds (standardized to Sidebar's rate for frequent updates)
    const interval = setInterval(fetchProgress, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DrawdownContext.Provider value={{ data, loading, refetch: fetchProgress }}>
      {children}
    </DrawdownContext.Provider>
  );
}

export function useDrawdown() {
  const context = useContext(DrawdownContext);
  if (!context) {
    throw new Error('useDrawdown must be used within a DrawdownProvider');
  }
  return context;
}
