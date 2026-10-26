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
  const query = useQuery({
    queryKey: ['stats', 'activity', month],
    queryFn: () => api.activity(month),
  });
  const title = new Date(`${month}-01T00:00:00Z`).toLocaleDateString(undefined, {
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
    <section className="panel activity-panel" aria-label="Daily catch activity">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">YOUR MONTH, DAY BY DAY</span>
          <h2>Catch activity</h2>
          <p>Recorded catches by day · UTC</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
          Monthly view
        </Button>
      </div>
      <div className="activity-month-navigation">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous month"
          disabled={!activityMonthSchema.safeParse(previous).success}
          onClick={() => onMonthChange(previous)}
        >
          <ChevronLeft size={18} />
        </Button>
        <label>
          <span className="sr-only">Activity month</span>
          <input
            type="month"
            aria-label="Activity month"
            value={month}
            onChange={(event) => {
              if (activityMonthSchema.safeParse(event.target.value).success)
                onMonthChange(event.target.value);
            }}
          />
        </label>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next month"
          disabled={!activityMonthSchema.safeParse(next).success}
          onClick={() => onMonthChange(next)}
        >
          <ChevronRight size={18} />
        </Button>
      </div>
      {query.isPending ? (
        <div role="status" className="activity-message">
          Loading daily catches…
        </div>
      ) : query.isError ? (
        <div role="alert" className="activity-message">
          <p>Daily activity could not be loaded.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <p className="activity-total" role="status">
            <strong>
              {query.data.total} {query.data.total === 1 ? 'catch' : 'catches'}
            </strong>{' '}
            in {title}
          </p>
          <ActivityChart points={points} daily />
          {query.data.total === 0 && (
            <p className="chart-empty-note">
              No catches recorded in {title}. Try another month or log a catch.
            </p>
          )}
          <details className="chart-data">
            <summary>View daily catch totals</summary>
            <table>
              <caption>Daily catch totals · {title} · UTC</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Catches</th>
                </tr>
              </thead>
              <tbody>
                {query.data.days.map((day) => (
                  <tr key={day.date}>
                    <th scope="row">
                      {new Date(`${day.date}T00:00:00Z`).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        timeZone: 'UTC',
                      })}
                    </th>
                    <td>{day.count}</td>
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
