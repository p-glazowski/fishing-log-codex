import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowLeft, Pencil, Fish, Ruler, MapPin, Calendar, Weight } from 'lucide-react';
import { toast } from 'sonner';
import { api, data, errorMessage, dateLabel, lureOf } from '../lib/api';
import { Button } from '../components/ui/button';
import {
  PageHeading,
  Loading,
  Failure,
  Photo,
  ConfirmDelete,
  CatchCard,
  Empty,
} from '../components/common';
function useDelete(path: string, back: string) {
  const client = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => data(path, { method: 'DELETE' }),
    onSuccess: async () => {
      await client.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
      toast.success('Deleted successfully');
      navigate(back);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
export default function Details({ kind }: { kind: 'lure' | 'catch' }) {
  return kind === 'lure' ? <LureDetails /> : <CatchDetails />;
}
function LureDetails() {
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
            <CatchCard key={c._id} item={c} />
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
function CatchDetails() {
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
        Back to journal
      </Link>
      <PageHeading
        eyebrow="A MEMORY FROM THE WATER"
        title={item.species}
        description={dateLabel(item.caughtAt)}
      >
        <Button variant="outline" asChild>
          <Link to={`/catches/${id}/edit`}>
            <Pencil size={17} />
            Edit catch
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
              <span>A memory worth keeping</span>
            </div>
          )}
        </div>
        <section className="panel specifications">
          <span className="eyebrow">THE CATCH</span>
          <h2>A day to remember</h2>
          <dl>
            {[
              [Calendar, 'Caught at', new Date(item.caughtAt).toLocaleString()],
              [MapPin, 'Location', item.location],
              [Ruler, 'Length', item.lengthCm ? `${item.lengthCm} cm` : undefined],
              [Weight, 'Weight', item.weightKg ? `${item.weightKg} kg` : undefined],
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
              <span className="brand">THE LURE THAT MADE IT HAPPEN</span>
              <h3>
                {lure.brand} {lure.name} ↗
              </h3>
              <span>
                {lure.type} · {lure.lengthMm} mm
              </span>
            </Link>
          )}
        </section>
      </div>
      {(item.notes || item.weather || item.waterConditions) && (
        <section className="panel notes">
          <span className="eyebrow">FIELD NOTES</span>
          {item.notes && <p>{item.notes}</p>}
          <dl>
            {item.weather && (
              <div>
                <dt>Weather</dt>
                <dd>{item.weather}</dd>
              </div>
            )}
            {item.waterConditions && (
              <div>
                <dt>Water conditions</dt>
                <dd>{item.waterConditions}</dd>
              </div>
            )}
          </dl>
        </section>
      )}
      <div className="danger-zone">
        <div>
          <strong>Remove this memory</strong>
          <p>This catch and its photo will be permanently deleted.</p>
        </div>
        <ConfirmDelete kind="catch" busy={deletion.isPending} onConfirm={() => deletion.mutate()} />
      </div>
    </>
  );
}
