'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { CHART_TOOLTIP_STYLE } from './ChartConfig';

interface EquityCurveItem {
  trade: string;
  pnl: number;
}

interface DashboardEquityChartProps {
  data: EquityCurveItem[];
}

export default function DashboardEquityChart({ data }: DashboardEquityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
        <XAxis dataKey="trade" tick={{ fontSize: 11, fill: '#7C8FA8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#7C8FA8' }} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <ReferenceLine y={8} stroke="#1B4F8A" strokeDasharray="5 5" label={{ value: 'Target 8%', fill: '#1B4F8A', fontSize: 10 }} />
        <ReferenceLine y={-4} stroke="#E24B4A" strokeDasharray="5 5" label={{ value: 'DD Limit -4%', fill: '#E24B4A', fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="pnl"
          stroke="var(--color-accent, #3B82F6)"
          strokeWidth={2}
          dot={{ fill: 'var(--color-accent, #3B82F6)', r: 3 }}
          activeDot={{ r: 5, stroke: 'var(--color-accent-light, #60A5FA)', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
