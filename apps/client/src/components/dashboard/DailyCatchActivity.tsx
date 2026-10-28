import { t, getLocale, useTranslation, countLabel } from '../../lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { activityMonthSchema } from '@lurelog/shared';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { ActivityChart } from './ActivityChart';

function shiftMonth(month: string, offset: number) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
export function DailyCatchActivity({
  month,
  onMonthChange,
  onBack,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  onBack: () => void;
}) {
  useTranslation();

  const query = useQuery({
    queryKey: ['stats', 'activity', month],
    queryFn: () => api.activity(month),
  });
  const title = new Date(`${month}-01T00:00:00Z`).toLocaleDateString(getLocale(), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const points =
    query.data?.days.map((day) => ({
      label: String(Number(day.date.slice(-2))),
      count: day.count,
    })) ?? [];
  const previous = shiftMonth(month, -1),
    next = shiftMonth(month, 1);
  return (
    <section className="panel activity-panel" aria-label={t('Daily catch activity')}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{t('YOUR MONTH, DAY BY DAY')}</span>
          <h2>{t('Catch activity')}</h2>
          <p>{t('Recorded catches by day · local time')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
          {t('Monthly view')}
        </Button>
      </div>
      <div className="activity-month-navigation">
        <Button
          variant="outline"
          size="icon"
          aria-label={t('Previous month')}
          disabled={!activityMonthSchema.safeParse(previous).success}
          onClick={() => onMonthChange(previous)}
        >
          <ChevronLeft size={18} />
        </Button>
        <span className="activity-month-title" aria-live="polite">
          {title}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label={t('Next month')}
          disabled={!activityMonthSchema.safeParse(next).success}
          onClick={() => onMonthChange(next)}
        >
          <ChevronRight size={18} />
        </Button>
      </div>
      {query.isPending ? (
        <div role="status" className="activity-message">
          {t('Loading daily catches…')}
        </div>
      ) : query.isError ? (
        <div role="alert" className="activity-message">
          <p>{t('Daily activity could not be loaded.')}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            {t('Try again')}
          </Button>
        </div>
      ) : (
        <>
          <p className="activity-total" role="status">
            <strong>{countLabel(query.data.total, 'catch')}</strong>{' '}
            {t('in {{month}}', { month: title })}
          </p>
          <ActivityChart points={points} daily />
          {query.data.total === 0 && (
            <p className="chart-empty-note">
              {t('No catches recorded in')} {title}. {t('Try another month or log a catch.')}
            </p>
          )}
          <details className="chart-data">
            <summary>{t('View daily catch totals')}</summary>
            <table>
              <caption>
                {t('Daily catch totals ·')} {title}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t('Day')}</th>
                  <th scope="col">{t('Catches')}</th>
                </tr>
              </thead>
              <tbody>
                {query.data.days.map((day) => (
                  <tr key={day.date}>
                    <th scope="row">
                      {new Date(`${day.date}T00:00:00Z`).toLocaleDateString(getLocale(), {
                        day: 'numeric',
                        month: 'short',
                        timeZone: 'UTC',
                      })}
                    </th>
                    <td className={day.count > 0 ? 'activity-count-positive' : undefined}>
                      {day.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
