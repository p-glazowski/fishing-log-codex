import { Link } from 'react-router-dom';
import { Fish, Plus, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
export function Loading() {
  return (
    <div className="skeleton-grid" aria-label="Loading" role="status">
      {Array.from({ length: 6 }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function Failure({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="empty" role="alert">
      <AlertCircle />
      <h2>Something interrupted the trip.</h2>
      <p>{error instanceof Error ? error.message : 'Please try again.'}</p>
      {retry && <Button onClick={retry}>Try again</Button>}
    </div>
  );
}
export function Empty({
  title,
  description,
  to,
  label,
}: {
  title: string;
  description: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="empty" role="status">
      <span className="empty-icon">
        <Fish size={34} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {to && (
        <Button asChild>
          <Link to={to}>
            <Plus size={17} />
            {label}
          </Link>
        </Button>
      )}
    </div>
  );
}
