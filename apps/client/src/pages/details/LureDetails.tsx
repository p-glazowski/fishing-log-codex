import { t, numberLabel, useTranslation } from '../../lib/i18n';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { useDelete } from './useDelete';
import { Plus, ArrowLeft, Pencil, Fish, Ruler } from 'lucide-react';
import { api, dateLabel } from '../../lib/api';
import {
  PageHeading,
  Loading,
  Failure,
  Photo,
  ConfirmDelete,
  CatchCard,
  Empty,
} from '../../components/common';
export function LureDetails() {
  useTranslation();

  const { id } = useParams();
  const query = useQuery({ queryKey: ['lure', id], queryFn: () => api.lure(id!) });
  const catches = useQuery({
    queryKey: ['lure-catches', id],
    queryFn: () => api.catches(`lure=${id}&limit=100`),
  });
  const deletion = useDelete(`/lures/${id}`, '/lures');
  if (query.isLoading) return <Loading />;
  if (query.isError) return <Failure error={query.error} />;
  const lure = query.data!;
  const all = catches.data?.data ?? [];
  return (
    <>
      <Link className="back-link" to="/lures">
        <ArrowLeft size={16} />
        {t('Back to collection')}
      </Link>
      <PageHeading
        eyebrow={lure.brand}
        title={lure.name}
        description={t('{{type}} · Added {{date}}', {
          type: t(lure.type),
          date: dateLabel(lure.createdAt),
        })}
      >
        <Button asChild>
          <Link to={`/lures/${id}/catches/new`}>
            <Plus size={17} />
            {t('Log a catch')}
          </Link>
        </Button>
      </PageHeading>
      <div className="detail-grid">
        <div className="detail-image">
          <Photo src={lure.image?.url} alt={lure.name} type={lure.type} />
        </div>
        <section className="panel specifications">
          <span className="eyebrow">{t('IN YOUR TACKLE BOX')}</span>
          <h2>{t('The details')}</h2>
          <dl>
            {[
              [t('Brand'), lure.brand],
              [t('Type'), t(lure.type)],
              [t('Length'), `${numberLabel(lure.lengthMm)} mm`],
              [t('Weight'), lure.weightGrams ? `${numberLabel(lure.weightGrams)} g` : undefined],
              [t('Color / pattern'), lure.color],
              [t('Behavior'), lure.buoyancy ? t(lure.buoyancy) : undefined],
              [t('Technique'), lure.technique],
              [t('Purchased'), lure.purchaseDate ? dateLabel(lure.purchaseDate) : undefined],
              [t('Purchase price'), lure.purchasePrice],
            ].map(([k, v]) =>
              v !== undefined && v !== null && v !== '' ? (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ) : null,
            )}
          </dl>
        </section>
      </div>
      <div className="lure-detail-stats">
        <div>
          <Fish />
          <strong>{lure.catchCount}</strong>
          <span>{t('Recorded catches')}</span>
        </div>
        <div>
          <Fish />
          <strong>{lure.summary?.species ?? 0}</strong>
          <span>{t('Fish species')}</span>
        </div>
        <div>
          <Ruler />
          <strong>{lure.summary?.largestLength ? `${lure.summary.largestLength} cm` : '—'}</strong>
          <span>{t('Largest catch')}</span>
        </div>
      </div>
      {lure.description && (
        <section className="panel notes">
          <span className="eyebrow">{t('FIELD NOTES')}</span>
          <p>{lure.description}</p>
        </section>
      )}
      <div className="section-heading lure-catches-heading">
        <div>
          <h2>{t('The stories behind this lure')}</h2>
          <p>{t('Every fish, every memory.')}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/catches?lure=${id}`}>{t('View in journal')}</Link>
        </Button>
      </div>
      {catches.isLoading ? (
        <Loading />
      ) : catches.isError ? (
        <Failure error={catches.error} />
      ) : all.length ? (
        <div className="catch-grid">
          {all.map((c) => (
            <CatchCard headingLevel={3} key={c._id} item={c} />
          ))}
        </div>
      ) : (
        <Empty
          title={t('This lure’s story is just beginning.')}
          description={t('Log your first catch and see what this lure can do.')}
          to={`/lures/${id}/catches/new`}
          label={t('Log a catch')}
        />
      )}
      <div className="lure-edit-action">
        <Button variant="outline" asChild>
          <Link to={`/lures/${id}/edit`}>
            <Pencil size={16} />
            {t('Edit lure')}
          </Link>
        </Button>
      </div>
      <div className="danger-zone">
        <div>
          <strong>{t('Remove from your collection')}</strong>
          <p>{t('Deleting a lure also removes its catches and photos.')}</p>
        </div>
        <ConfirmDelete kind="lure" busy={deletion.isPending} onConfirm={() => deletion.mutate()} />
      </div>
    </>
  );
}
