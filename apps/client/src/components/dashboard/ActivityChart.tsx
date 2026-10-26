import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function ActivityChart({
  points,
  daily = false,
}: {
  points: { label: string; count: number }[];
  daily?: boolean;
}) {
  return (
    <div className="chart-container" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ left: -16, right: 16, top: 16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          />
          <Area
            isAnimationActive={false}
            type={daily ? 'linear' : 'monotone'}
            dataKey="count"
            name="Catches"
            stroke="var(--chart-primary)"
            fill="var(--chart-fill)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
