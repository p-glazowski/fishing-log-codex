import { Link } from 'react-router-dom';
import { Fish, BookOpen, Shapes, Trophy, ArrowUpRight } from 'lucide-react';
import type { Stats } from '@lurelog/shared';
export function StatsCards({ stats }: { stats: Stats }) {
  const top = stats.topLures[0];
  return (
    <dl className="stats-grid">
      <div className="stat-card">
        <dt>
          <Fish size={18} />
          Lures in your collection
        </dt>
        <dd>{stats.totalLures}</dd>
        <small>Ready for the next trip</small>
      </div>
      <div className="stat-card">
        <dt>
          <BookOpen size={18} />
          Catches recorded
        </dt>
        <dd>{stats.totalCatches}</dd>
        <small>Your all-time fishing record</small>
      </div>
      <div className="stat-card">
        <dt>
          <Shapes size={18} />
          Species caught
        </dt>
        <dd>{stats.uniqueSpecies}</dd>
        <small>Across all your catches</small>
      </div>
      <div className="stat-card stat-featured">
        <dt>
          <Trophy size={18} />
          Most successful lure
        </dt>
        <dd className="stat-text">
          {top ? (
            <Link to={`/lures/${top._id}`}>
              {top.name}
              <ArrowUpRight size={17} />
            </Link>
          ) : (
            'Still to be discovered'
          )}
        </dd>
        <small>
          {top ? `${top.catchCount} recorded catches` : 'Log a catch to find your favorite'}
        </small>
      </div>
    </dl>
  );
}
