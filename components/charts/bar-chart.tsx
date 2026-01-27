'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface BarChartProps {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  xAxisKey: string;
  color?: string;
  label?: string;
}

export function BarChart({
  data,
  dataKey,
  xAxisKey,
  color = '#3b82f6',
  label,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey={xAxisKey}
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        {label && <Legend />}
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} name={label} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
