import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Stats } from '@lurelog/shared';
export function CatchActivity({ stats }: { stats: Stats }) {
  const [period, setPeriod] = useState('year');
  const year = new Date().getUTCFullYear();
  const chart = Array.from({ length: period === 'year' ? 12 : 24 }, (_, i) => {
    const date = new Date(Date.UTC(year - (period === 'year' ? 0 : 1), i, 1));
    const key = date.toISOString().slice(0, 7);
    return {
      month: date.toLocaleDateString(undefined, {
        month: 'short',
        ...(period === 'year' ? {} : { year: '2-digit' }),
        timeZone: 'UTC',
      }),
      count: stats.activity.find((point) => point.month === key)?.count ?? 0,
    };
  });
  return (
    <section className="panel activity-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">YOUR SEASON, AT A GLANCE</span>
          <h2>Catch activity</h2>
          <p>Recorded catches by month · UTC</p>
        </div>
        <select
          aria-label="Chart period"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        >
          <option value="year">This year</option>
          <option value="two">Last 2 calendar years</option>
        </select>
      </div>
      <div className="chart-container" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chart} margin={{ left: -16, right: 16, top: 16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
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
              type="monotone"
              dataKey="count"
              name="Catches"
              stroke="var(--chart-primary)"
              fill="var(--chart-fill)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {!stats.totalCatches && (
        <p className="chart-empty-note">Log your first catch to start your activity record.</p>
      )}
      <details className="chart-data">
        <summary>View activity data</summary>
        <table>
          <caption>Monthly catch totals</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Catches</th>
            </tr>
          </thead>
          <tbody>
            {chart.map((point) => (
              <tr key={point.month}>
                <th scope="row">{point.month}</th>
                <td>{point.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
