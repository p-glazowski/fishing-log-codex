import { useState } from 'react';
import { ActivityChart } from './ActivityChart';
import { DailyCatchActivity } from './DailyCatchActivity';
import { Button } from '../ui/button';
import type { Stats } from '@lurelog/shared';
export function CatchActivity({ stats }: { stats: Stats }) {
  const [daily, setDaily] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [period, setPeriod] = useState('year');
  const year = new Date().getUTCFullYear();
  const chart = Array.from({ length: period === 'year' ? 12 : 24 }, (_, i) => {
    const date = new Date(Date.UTC(year - (period === 'year' ? 0 : 1), i, 1));
    const key = date.toISOString().slice(0, 7);
    return {
      key,
      label: date.toLocaleDateString(undefined, {
        month: 'short',
        ...(period === 'year' ? {} : { year: '2-digit' }),
        timeZone: 'UTC',
      }),
      count: stats.activity.find((point) => point.month === key)?.count ?? 0,
    };
  });
  if (daily)
    return (
      <DailyCatchActivity month={month} onMonthChange={setMonth} onBack={() => setDaily(false)} />
    );
  return (
    <section className="panel activity-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">YOUR SEASON, AT A GLANCE</span>
          <h2>Catch activity</h2>
          <p>Recorded catches by month</p>
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
      <ActivityChart points={chart} />
      <div className="activity-explore">
        <Button
          variant="outline"
          onClick={() => {
            setMonth(new Date().toISOString().slice(0, 7));
            setDaily(true);
          }}
        >
          Explore month
        </Button>
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
              <tr key={point.key}>
                <th scope="row">
                  <button
                    className="activity-month-link"
                    onClick={() => {
                      setMonth(point.key);
                      setDaily(true);
                    }}
                  >
                    {point.label}
                  </button>
                </th>
                <td>{point.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
