import { t, speciesLabel, numberLabel, getLocale, useTranslation } from '../../lib/i18n';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { useDelete } from './useDelete';
import { ArrowLeft, Pencil, Fish, Ruler, MapPin, Calendar, Weight } from 'lucide-react';
import { api, dateLabel, lureOf } from '../../lib/api';
import { PageHeading, Loading, Failure, ConfirmDelete } from '../../components/common';
export function CatchDetails() {
  useTranslation();

  const { id } = useParams();
  const query = useQuery({ queryKey: ['catch', id], queryFn: () => api.catch(id!) });
  const deletion = useDelete(`/catches/${id}`, '/catches');
  if (query.isLoading) return <Loading />;
  if (query.isError) return <Failure error={query.error} />;
  const item = query.data!;
  const lure = lureOf(item);
  return (
    <>
      <Link className="back-link" to="/catches">
        <ArrowLeft size={16} />
        {t('Back to journal')}
      </Link>
      <PageHeading
        eyebrow={t('A MEMORY FROM THE WATER')}
        title={speciesLabel(item.species)}
        description={dateLabel(item.caughtAt)}
      >
        <Button variant="outline" asChild>
          <Link to={`/catches/${id}/edit`}>
            <Pencil size={17} />
            {t('Edit catch')}
          </Link>
        </Button>
      </PageHeading>
      <div className="detail-grid catch-detail">
        <div className="detail-image">
          {item.photo ? (
            <img src={item.photo.url} alt={item.species} />
          ) : (
            <div className="fish-placeholder">
              <Fish size={90} />
              <span>{t('A memory worth keeping')}</span>
            </div>
          )}
        </div>
        <section className="panel specifications">
          <span className="eyebrow">{t('THE CATCH')}</span>
          <h2>{t('A day to remember')}</h2>
          <dl>
            {[
              [Calendar, t('Caught at'), new Date(item.caughtAt).toLocaleString(getLocale())],
              [MapPin, t('Location'), item.location],
              [Ruler, t('Length'), item.lengthCm ? `${numberLabel(item.lengthCm)} cm` : undefined],
              [Weight, t('Weight'), item.weightKg ? `${numberLabel(item.weightKg)} kg` : undefined],
            ].map(([Icon, k, v]) => {
              const I = Icon as typeof Fish;
              return v ? (
                <div key={String(k)}>
                  <dt>
                    <I size={16} />
                    {String(k)}
                  </dt>
                  <dd>{String(v)}</dd>
                </div>
              ) : null;
            })}
          </dl>
          {lure && (
            <Link className="lure-detail-link" to={`/lures/${lure._id}`}>
              <span className="brand">{t('THE LURE THAT MADE IT HAPPEN')}</span>
              <h3>
                {lure.brand} {lure.name} ↗
              </h3>
              <span>
                {t(lure.type)} · {numberLabel(lure.lengthMm)} mm
              </span>
            </Link>
          )}
        </section>
      </div>
      {(item.notes || item.weather || item.waterConditions) && (
        <section className="panel notes">
          <span className="eyebrow">{t('FIELD NOTES')}</span>
          {item.notes && <p>{item.notes}</p>}
          <dl>
            {item.weather && (
              <div>
                <dt>{t('Weather')}</dt>
                <dd>{item.weather}</dd>
              </div>
            )}
            {item.waterConditions && (
              <div>
                <dt>{t('Water conditions')}</dt>
                <dd>{item.waterConditions}</dd>
              </div>
            )}
          </dl>
        </section>
      )}
      <div className="danger-zone">
        <div>
          <strong>{t('Remove this memory')}</strong>
          <p>{t('This catch and its photo will be permanently deleted.')}</p>
        </div>
        <ConfirmDelete kind="catch" busy={deletion.isPending} onConfirm={() => deletion.mutate()} />
      </div>
    </>
  );
}
