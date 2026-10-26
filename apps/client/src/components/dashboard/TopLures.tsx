import { Link } from 'react-router-dom';
import { ArrowUpRight, Fish } from 'lucide-react';
import type { Lure } from '@lurelog/shared';
import { Photo } from '../media/LureArt';
export function TopLures({ lures }: { lures: Lure[] }) {
  return (
    <section className="panel top-lures">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">PROVEN ON THE WATER</span>
          <h2>Top performing lures</h2>
        </div>
        <Link to="/lures?sort=catches" className="text-action">
          View all
          <ArrowUpRight size={16} />
        </Link>
      </div>
      {lures.length ? (
        <ol className="ranking-list">
          {lures.map((lure, index) => (
            <li key={lure._id}>
              <Link to={`/lures/${lure._id}`}>
                <span className="rank">{String(index + 1).padStart(2, '0')}</span>
                <span className="rank-image">
                  <Photo src={lure.image?.url} alt="" type={lure.type} />
                </span>
                <span className="rank-name">
                  <span className="brand">{lure.brand}</span>
                  <strong>{lure.name}</strong>
                  <small>
                    {lure.type} · {lure.lengthMm} mm
                  </small>
                </span>
                <span className="rank-count">
                  <Fish size={16} />
                  {lure.catchCount}
                  <span className="sr-only"> catches</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="inline-empty">
          Your most successful lures will appear here as you record catches.
        </div>
      )}
    </section>
  );
}
