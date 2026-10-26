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
        Back to collection
      </Link>
      <PageHeading
        eyebrow={lure.brand}
        title={lure.name}
        description={`${lure.type} · Added ${dateLabel(lure.createdAt)}`}
      >
        <Button variant="outline" asChild>
          <Link to={`/lures/${id}/edit`}>
            <Pencil size={16} />
            Edit lure
          </Link>
        </Button>
        <Button asChild>
          <Link to={`/lures/${id}/catches/new`}>
            <Plus size={17} />
            Log a catch
          </Link>
        </Button>
      </PageHeading>
      <div className="detail-grid">
        <div className="detail-image">
          <Photo src={lure.image?.url} alt={lure.name} type={lure.type} />
        </div>
        <section className="panel specifications">
          <span className="eyebrow">IN YOUR TACKLE BOX</span>
          <h2>The details</h2>
          <dl>
            {[
              ['Brand', lure.brand],
              ['Type', lure.type],
              ['Length', `${lure.lengthMm} mm`],
              ['Weight', lure.weightGrams ? `${lure.weightGrams} g` : undefined],
              ['Color / pattern', lure.color],
              ['Behavior', lure.buoyancy],
              ['Technique', lure.technique],
              ['Purchased', lure.purchaseDate ? dateLabel(lure.purchaseDate) : undefined],
              ['Purchase price', lure.purchasePrice],
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
          <span>Recorded catches</span>
        </div>
        <div>
          <Fish />
          <strong>{lure.summary?.species ?? 0}</strong>
          <span>Fish species</span>
        </div>
        <div>
          <Ruler />
          <strong>{lure.summary?.largestLength ? `${lure.summary.largestLength} cm` : '—'}</strong>
          <span>Largest catch</span>
        </div>
      </div>
      {lure.description && (
        <section className="panel notes">
          <span className="eyebrow">FIELD NOTES</span>
          <p>{lure.description}</p>
        </section>
      )}
      <div className="section-heading">
        <div>
          <h2>The stories behind this lure</h2>
          <p>Every fish, every memory.</p>
        </div>
        <Link className="text-action" to={`/catches?lure=${id}`}>
          View in journal ↗
        </Link>
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
          title="This lure’s story is just beginning."
          description="Log your first catch and see what this lure can do."
          to={`/lures/${id}/catches/new`}
          label="Log a catch"
        />
      )}
      <div className="danger-zone">
        <div>
          <strong>Remove from your collection</strong>
          <p>Deleting a lure also removes its catches and photos.</p>
        </div>
        <ConfirmDelete kind="lure" busy={deletion.isPending} onConfirm={() => deletion.mutate()} />
      </div>
    </>
  );
}
