import { t, numberLabel, useTranslation, countLabel } from '../../lib/i18n';
import { Link } from 'react-router-dom';
import { Fish, BookOpen, Shapes, Trophy, ArrowUpRight } from 'lucide-react';
import type { Stats } from '@lurelog/shared';
export function StatsCards({ stats }: { stats: Stats }) {
  useTranslation();

  const top = stats.topLures[0];
  return (
    <dl className="stats-grid">
      <div className="stat-card">
        <dt>
          <Fish size={18} />
          {t('Lures in your collection')}
        </dt>
        <dd>{numberLabel(stats.totalLures)}</dd>
        <small>{t('Ready for the next trip')}</small>
      </div>
      <div className="stat-card">
        <dt>
          <BookOpen size={18} />
          {t('Catches recorded')}
        </dt>
        <dd>{numberLabel(stats.totalCatches)}</dd>
        <small>{t('Your all-time fishing record')}</small>
      </div>
      <div className="stat-card">
        <dt>
          <Shapes size={18} />
          {t('Species caught')}
        </dt>
        <dd>{numberLabel(stats.uniqueSpecies)}</dd>
        <small>{t('Across all your catches')}</small>
      </div>
      <div className="stat-card stat-featured">
        <dt>
          <Trophy size={18} />
          {t('Most successful lure')}
        </dt>
        <dd className="stat-text">
          {top ? (
            <Link to={`/lures/${top._id}`}>
              {top.name}
              <ArrowUpRight size={17} />
            </Link>
          ) : (
            t('Still to be discovered')
          )}
        </dd>
        <small>
          {top ? countLabel(top.catchCount ?? 0, 'catch') : t('Log a catch to find your favorite')}
        </small>
      </div>
    </dl>
  );
}
