'use client';

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { CHART_TOOLTIP_STYLE, SESSION_COLORS } from './ChartConfig';

interface SessionItem {
  name: string;
  value: number;
}

interface DashboardSessionChartProps {
  data: SessionItem[];
}

export default function DashboardSessionChart({ data }: DashboardSessionChartProps) {
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
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={SESSION_COLORS[index % SESSION_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
