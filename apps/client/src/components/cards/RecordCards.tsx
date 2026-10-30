import { t, speciesLabel, useTranslation, countLabel, numberLabel } from '../../lib/i18n';
import { Link, useLocation } from 'react-router-dom';
import { Fish, Plus, ArrowUpRight } from 'lucide-react';
import type { Lure, FishCatch } from '@lurelog/shared';
import { dateLabel, lureOf } from '../../lib/api';
import { Photo } from '../media/LureArt';
export function LureCard({ lure, headingLevel = 2 }: { lure: Lure; headingLevel?: 2 | 3 }) {
  useTranslation();
  const location = useLocation();

  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="lure-card">
      <div className="lure-image">
        <Photo src={lure.image?.url} alt={lure.name} type={t(lure.type)} />
        <span className="image-tag">{t(lure.type)}</span>
      </div>
      <div className="lure-body">
        <span className="brand">{lure.brand}</span>
        <div className="lure-meta">
          <Link
            className="lure-card-link"
            to={`/lures/${lure._id}`}
            state={{ returnTo: location.pathname + location.search }}
            aria-label={t('View {{brand}} {{name}}', { brand: lure.brand, name: lure.name })}
          >
            <Heading>{lure.name}</Heading>
          </Link>
          <span className="lure-size">{numberLabel(lure.lengthMm)} mm</span>
        </div>
        {(lure.color || lure.buoyancy) && (
          <div className="spec-line">{lure.color || t(lure.buoyancy!)}</div>
        )}
        <div className="card-bottom">
          <span>
            <Fish size={15} />
            <strong>{countLabel(lure.catchCount ?? 0, 'catch')}</strong>
          </span>
          <Link className="text-action" to={`/lures/${lure._id}/catches/new`}>
            <Plus size={15} />
            {t('Log catch')}
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
  datePlacement = 'photo',
  recent = false,
}: {
  item: FishCatch;
  datePlacement?: 'photo' | 'footer';
  recent?: boolean;
  list?: boolean;
  headingLevel?: 2 | 3;
}) {
  useTranslation();

  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const lure = lureOf(item);
  const location = useLocation();
  const state = { returnTo: location.pathname + location.search };
  return (
    <article
      className={`catch-card ${list ? 'catch-row' : ''} ${recent ? 'recent-catch-card' : ''}`}
    >
      <Link
        className="catch-image"
        to={`/catches/${item._id}`}
        state={state}
        aria-label={t('View {{species}} catch from {{date}}', {
          species: speciesLabel(item.species),
          date: dateLabel(item.caughtAt),
        })}
      >
        {item.photo ? (
          <img
            src={item.photo.url}
            alt={speciesLabel(item.species)}
            loading="lazy"
            style={{
              objectPosition: `${item.photoPosition?.x ?? 50}% ${item.photoPosition?.y ?? 50}%`,
            }}
          />
        ) : (
          <div className="fish-placeholder">
            <Fish size={54} />
            <span>{t('No photo added')}</span>
          </div>
        )}
        {!recent && datePlacement === 'photo' && (
          <time className="image-tag" dateTime={item.caughtAt}>
            {dateLabel(item.caughtAt)}
          </time>
        )}
      </Link>
      <div className="catch-body">
        {item.location && <span className="brand">{item.location}</span>}
        <div className="recent-catch-title">
          <Link to={`/catches/${item._id}`} state={state}>
            <Heading>{speciesLabel(item.species)}</Heading>
          </Link>
          {recent && (
            <time className="recent-catch-date" dateTime={item.caughtAt}>
              {dateLabel(item.caughtAt)}
            </time>
          )}
        </div>
        <p className="catch-measure">
          {item.lengthCm ? `${numberLabel(item.lengthCm)} cm` : t('Length unrecorded')}
          {item.weightKg ? ` · ${numberLabel(item.weightKg)} kg` : ''}
        </p>
        {lure && (
          <Link className="lure-link" to={`/lures/${lure._id}`} state={state}>
            <Fish size={14} />
            {recent ? (
              <span className="recent-lure-details">
                <span>
                  {lure.brand} {lure.name}
                </span>{' '}
                {lure.lengthMm != null && (
                  <span className="recent-lure-size">{numberLabel(lure.lengthMm)} mm</span>
                )}
              </span>
            ) : (
              <span>
                {lure.brand} {lure.name}
                {lure.lengthMm != null && ` · ${numberLabel(lure.lengthMm)} mm`}
              </span>
            )}
            {!recent && <ArrowUpRight size={14} />}
          </Link>
        )}
        {datePlacement === 'footer' && (
          <time className="catch-date" dateTime={item.caughtAt}>
            {dateLabel(item.caughtAt)}
          </time>
        )}
      </div>
    </article>
  );
}
