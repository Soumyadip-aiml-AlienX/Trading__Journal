'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, ReferenceLine,
} from 'recharts';
import { CHART_TOOLTIP_STYLE, PERFORMANCE_COLORS } from './ChartConfig';

interface EquityCurveItem {
  trade: string;
  pnl: number;
}

interface PerformanceEquityChartProps {
  data: EquityCurveItem[];
}

export function PerformanceEquityChart({ data }: PerformanceEquityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
        <XAxis dataKey="trade" tick={{ fontSize: 11, fill: '#7C8FA8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#7C8FA8' }} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <ReferenceLine y={8} stroke="#1B4F8A" strokeDasharray="5 5" />
        <ReferenceLine y={-4} stroke="#E24B4A" strokeDasharray="5 5" />
        <Line
          type="monotone"
          dataKey="pnl"
          stroke="var(--color-accent, #3B82F6)"
          strokeWidth={2}
          dot={{ fill: 'var(--color-accent, #3B82F6)', r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface SessionItem {
  name: string;
  value: number;
}

interface PerformanceSessionChartProps {
  data: SessionItem[];
}

export function PerformanceSessionChart({ data }: PerformanceSessionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PERFORMANCE_COLORS[i % PERFORMANCE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
