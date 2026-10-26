import { Link } from 'react-router-dom';
import { Fish, Plus, ArrowUpRight } from 'lucide-react';
import type { Lure, FishCatch } from '@lurelog/shared';
import { dateLabel, lureOf } from '../../lib/api';
import { Photo } from '../media/LureArt';
export function LureCard({ lure, headingLevel = 2 }: { lure: Lure; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="lure-card">
      <Link
        to={`/lures/${lure._id}`}
        className="lure-image"
        aria-label={`View ${lure.brand} ${lure.name}`}
      >
        <Photo src={lure.image?.url} alt={lure.name} type={lure.type} />
        <span className="image-tag">{lure.type}</span>
        <span className="image-arrow">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="lure-body">
        <span className="brand">{lure.brand}</span>
        <Link to={`/lures/${lure._id}`}>
          <Heading>{lure.name}</Heading>
        </Link>
        <div className="spec-line">
          {lure.lengthMm} mm <span>•</span> {lure.color || lure.buoyancy || 'Ready for the water'}
        </div>
        <div className="card-bottom">
          <span>
            <Fish size={15} />
            <strong>{lure.catchCount ?? 0}</strong> catches
          </span>
          <Link className="text-action" to={`/lures/${lure._id}/catches/new`}>
            <Plus size={15} /> Log catch
          </Link>
        </div>
      </div>
    </article>
  );
}
export function CatchCard({
  item,
  list = false,
  headingLevel = 2,
}: {
  item: FishCatch;
  list?: boolean;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const lure = lureOf(item);
  return (
    <article className={`catch-card ${list ? 'catch-row' : ''}`}>
      <Link
        className="catch-image"
        to={`/catches/${item._id}`}
        aria-label={`View ${item.species} catch from ${dateLabel(item.caughtAt)}`}
      >
        {item.photo ? (
          <img src={item.photo.url} alt={item.species} loading="lazy" />
        ) : (
          <div className="fish-placeholder">
            <Fish size={54} />
            <span>No photo added</span>
          </div>
        )}
        <span className="image-tag">{dateLabel(item.caughtAt)}</span>
      </Link>
      <div className="catch-body">
        <span className="brand">{item.location || 'On the water'}</span>
        <Link to={`/catches/${item._id}`}>
          <Heading>{item.species}</Heading>
        </Link>
        <p className="catch-measure">
          {item.lengthCm ? `${item.lengthCm} cm` : 'Length unrecorded'}
          {item.weightKg ? ` · ${item.weightKg} kg` : ''}
        </p>
        {lure && (
          <Link className="lure-link" to={`/lures/${lure._id}`}>
            <Fish size={14} />
            {lure.brand} {lure.name}
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    </article>
  );
}
