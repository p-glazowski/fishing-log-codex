import { t, getLocale, useTranslation } from '../../lib/i18n';
import { useState } from 'react';
import { ActivityChart } from './ActivityChart';
import { DailyCatchActivity } from './DailyCatchActivity';
import { Button } from '../ui/button';
import { FilterSelect } from '../ui/filter-select';
import type { Stats } from '@lurelog/shared';
export function CatchActivity({ stats }: { stats: Stats }) {
  useTranslation();

  const [daily, setDaily] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [period, setPeriod] = useState('year');
  const year = new Date().getUTCFullYear();
  const chart = Array.from({ length: period === 'year' ? 12 : 24 }, (_, i) => {
    const date = new Date(Date.UTC(year - (period === 'year' ? 0 : 1), i, 1));
    const key = date.toISOString().slice(0, 7);
    return {
      key,
      label: date.toLocaleDateString(getLocale(), {
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
          <span className="eyebrow">{t('YOUR SEASON, AT A GLANCE')}</span>
          <h2>{t('Catch activity')}</h2>
          <p>{t('Recorded catches by month')}</p>
        </div>
        <FilterSelect
          aria-label={t('Chart period')}
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        >
          <option value="year">{t('This year')}</option>
          <option value="two">{t('Last 2 calendar years')}</option>
        </FilterSelect>
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
          {t('Explore month')}
        </Button>
      </div>
      {!stats.totalCatches && (
        <p className="chart-empty-note">
          {t('Log your first catch to start your activity record.')}
        </p>
      )}
      <details className="chart-data">
        <summary>{t('View activity data')}</summary>
        <table>
          <caption>{t('Monthly catch totals')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('Month')}</th>
              <th scope="col">{t('Catches')}</th>
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
                <td className={point.count > 0 ? 'activity-count-positive' : undefined}>
                  {point.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
