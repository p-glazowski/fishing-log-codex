import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { useDelete } from './useDelete';
import { ArrowLeft, Pencil, Fish, Ruler, MapPin, Calendar, Weight } from 'lucide-react';
import { api, dateLabel, lureOf } from '../../lib/api';
import { PageHeading, Loading, Failure, ConfirmDelete } from '../../components/common';
export function CatchDetails() {
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
