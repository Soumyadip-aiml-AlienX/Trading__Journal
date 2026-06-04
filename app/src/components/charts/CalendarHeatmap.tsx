'use client';

import { useState } from 'react';
import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

interface DailyStat {
  date: string;
  pnl: number;
  count: number;
}

interface CalendarHeatmapProps {
  dailyStats: DailyStat[];
}

export default function CalendarHeatmap({ dailyStats }: CalendarHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: Date;
    pnl: number;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Generate date range: 26 weeks ago to today
  const today = new Date();
  const startDate = startOfWeek(subDays(today, 26 * 7));
  const days = eachDayOfInterval({ start: startDate, end: today });

  const getPnlColor = (pnl: number, count: number) => {
    if (count === 0) return 'bg-slate-800/40 hover:border-slate-600';
    if (pnl > 0) {
      if (pnl >= 3.0) return 'bg-[#1dd1a1] border border-[#25c992]'; // High win
      if (pnl >= 1.0) return 'bg-[#10b981]'; // Med win
      return 'bg-[#064e3b]'; // Low win
    } else if (pnl < 0) {
      if (pnl <= -3.0) return 'bg-[#ff6b6b] border border-[#f06564]'; // High loss
      if (pnl <= -1.0) return 'bg-[#ef4444]'; // Med loss
      return 'bg-[#7f1d1d]'; // Low loss
    }
    return 'bg-slate-700'; // Flat/Breakeven
  };

  const handleMouseEnter = (e: React.MouseEvent, date: Date, stat: DailyStat) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();

    setHoveredDay({
      date,
      pnl: stat.pnl,
      count: stat.count,
      x: rect.left - (parentRect?.left ?? 0) + rect.width / 2,
      y: rect.top - (parentRect?.top ?? 0) - 45,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  // Group days by week for header labeling
  const months: Array<{ label: string; index: number }> = [];
  let prevMonth = '';

  days.forEach((day, index) => {
    if (day.getDay() === 0) { // Only check at the start of a week
      const currentMonth = format(day, 'MMM');
      if (currentMonth !== prevMonth) {
        months.push({ label: currentMonth, index: Math.floor(index / 7) });
        prevMonth = currentMonth;
      }
    }
  });

  return (
    <div className="glass-card p-5 relative">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
        📅 Daily Performance Heatmap
      </h3>

      <div className="relative overflow-x-auto pb-2 scrollbar-thin">
        {/* Month Labels */}
        <div className="flex text-[10px] text-[var(--color-text-muted)] h-5 pl-7 relative select-none" style={{ width: `${27 * 16}px` }}>
          {months.map((m, idx) => (
            <div
              key={idx}
              className="absolute"
              style={{ left: `${28 + m.index * 15.5}px` }}
            >
              {m.label}
            </div>
          ))}
        </div>

        <div className="flex gap-2 relative">
          {/* Day of Week Labels */}
          <div className="flex flex-col justify-between text-[9px] text-[var(--color-text-muted)] h-[106px] w-5 py-0.5 select-none font-semibold">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          {/* Grid Container */}
          <div className="grid grid-flow-col grid-rows-7 gap-[3.5px] relative h-[106px]">
            {days.map((day, idx) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const stat = dailyStats.find((s) => s.date === dayStr) || { date: dayStr, pnl: 0, count: 0 };
              const colorClass = getPnlColor(stat.pnl, stat.count);

              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-sm transition-all duration-150 cursor-pointer heatmap-cell relative ${colorClass}`}
                  onMouseEnter={(e) => handleMouseEnter(e, day, stat)}
                  onMouseLeave={handleMouseLeave}
                />
              );
            })}

            {/* Custom Tooltip */}
            {hoveredDay && (
              <div
                className="absolute z-10 bg-[#1A2844] border border-[var(--color-border)] rounded-md px-2.5 py-1.5 text-[10px] text-[var(--color-text-primary)] shadow-xl pointer-events-none transform -translate-x-1/2 flex flex-col gap-0.5"
                style={{ left: hoveredDay.x, top: hoveredDay.y }}
              >
                <div className="font-semibold">{format(hoveredDay.date, 'EEEE, MMM d, yyyy')}</div>
                {hoveredDay.count > 0 ? (
                  <div className="flex justify-between gap-4">
                    <span>Trades: <strong className="text-[var(--color-text-primary)]">{hoveredDay.count}</strong></span>
                    <span>P&L: <strong className={hoveredDay.pnl >= 0 ? 'text-buy' : 'text-sell'}>
                      {hoveredDay.pnl >= 0 ? '+' : ''}{hoveredDay.pnl.toFixed(2)}%
                    </strong></span>
                  </div>
                ) : (
                  <span className="text-[var(--color-text-muted)]">No trades logged</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-[var(--color-text-muted)]">
        <span>Loss</span>
        <div className="w-2.5 h-2.5 bg-[#ff6b6b] rounded-sm" />
        <div className="w-2.5 h-2.5 bg-[#ef4444] rounded-sm" />
        <div className="w-2.5 h-2.5 bg-[#7f1d1d] rounded-sm" />
        <div className="w-2.5 h-2.5 bg-slate-800/40 rounded-sm" />
        <div className="w-2.5 h-2.5 bg-[#064e3b] rounded-sm" />
        <div className="w-2.5 h-2.5 bg-[#10b981] rounded-sm" />
        <div className="w-2.5 h-2.5 bg-[#1dd1a1] rounded-sm" />
        <span>Win</span>
      </div>
    </div>
  );
}
