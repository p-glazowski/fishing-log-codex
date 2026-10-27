import { t, speciesLabel, useTranslation, countLabel, numberLabel } from '../../lib/i18n';
import { Link } from 'react-router-dom';
import { Fish, Plus, ArrowUpRight } from 'lucide-react';
import type { Lure, FishCatch } from '@lurelog/shared';
import { dateLabel, lureOf } from '../../lib/api';
import { Photo } from '../media/LureArt';
export function LureCard({ lure, headingLevel = 2 }: { lure: Lure; headingLevel?: 2 | 3 }) {
  useTranslation();

  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="lure-card">
      <Link
        to={`/lures/${lure._id}`}
        className="lure-image"
        aria-label={t('View {{brand}} {{name}}', { brand: lure.brand, name: lure.name })}
      >
        <Photo src={lure.image?.url} alt={lure.name} type={t(lure.type)} />
        <span className="image-tag">{t(lure.type)}</span>
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
          {numberLabel(lure.lengthMm)} mm <span>•</span>{' '}
          {lure.color || lure.buoyancy || t('Ready for the water')}
        </div>
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
  return (
    <article className={`catch-card ${list ? 'catch-row' : ''}`}>
      <Link
        className="catch-image"
        to={`/catches/${item._id}`}
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
        {datePlacement === 'photo' && (
          <time className="image-tag" dateTime={item.caughtAt}>
            {dateLabel(item.caughtAt)}
          </time>
        )}
      </Link>
      <div className="catch-body">
        {(!recent || item.location) && (
          <span className="brand">{item.location || t('On the water')}</span>
        )}
        <Link to={`/catches/${item._id}`}>
          <Heading>{speciesLabel(item.species)}</Heading>
        </Link>
        <p className="catch-measure">
          {item.lengthCm ? `${numberLabel(item.lengthCm)} cm` : t('Length unrecorded')}
          {item.weightKg ? ` · ${numberLabel(item.weightKg)} kg` : ''}
        </p>
        {lure && (
          <Link className="lure-link" to={`/lures/${lure._id}`}>
            <Fish size={14} />
            {lure.brand} {lure.name}
            {recent && lure.lengthMm != null ? ` · ${numberLabel(lure.lengthMm)} mm` : ''}
            <ArrowUpRight size={14} />
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
