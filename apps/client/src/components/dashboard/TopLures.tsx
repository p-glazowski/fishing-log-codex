import { t, numberLabel, countLabel, useTranslation } from '../../lib/i18n';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Lure } from '@lurelog/shared';
import { Photo } from '../media/LureArt';
export function TopLures({ lures }: { lures: Lure[] }) {
  useTranslation();

  return (
    <section className="panel top-lures">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{t('PROVEN ON THE WATER')}</span>
          <h2>{t('Top performing lures')}</h2>
        </div>
        <Link to="/lures?sort=catches" className="text-action">
          {t('View all')}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      {lures.length ? (
        <ol className="ranking-list">
          {lures.map((lure, index) => (
            <li key={lure._id}>
              <Link to={`/lures/${lure._id}`}>
                <span className="rank-image">
                  <Photo src={lure.image?.url} alt="" type={t(lure.type)} />
                  <span className="rank">{numberLabel(index + 1)}</span>
                </span>
                <span className="rank-name">
                  <span className="brand">{lure.brand}</span>
                  <strong>{lure.name}</strong>
                  <small>
                    {t(lure.type)} · {numberLabel(lure.lengthMm)} mm
                  </small>
                </span>
                <span className="rank-count">
                  <strong aria-hidden="true">{numberLabel(lure.catchCount ?? 0)}</strong>
                  <span className="sr-only">{countLabel(lure.catchCount ?? 0, 'catch')}</span>
                  <span aria-hidden="true">{t('catches')}</span>
                  <span className="rank-meter" aria-hidden="true">
                    <span
                      style={{
                        width: `${Math.min(100, ((lure.catchCount ?? 0) / Math.max(1, lures[0]?.catchCount ?? 0)) * 100)}%`,
                      }}
                    />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="inline-empty">
          {t('Your most successful lures will appear here as you record catches.')}
        </div>
      )}
    </section>
  );
}
