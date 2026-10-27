import { t, useTranslation } from '../../lib/i18n';
import { Link } from 'react-router-dom';
import { Fish, Plus, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
export function Loading() {
  useTranslation();

  return (
    <div className="skeleton-grid" aria-label={t('Loading')} role="status">
      {Array.from({ length: 6 }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function Failure({ error, retry }: { error: unknown; retry?: () => void }) {
  useTranslation();

  return (
    <div className="empty" role="alert">
      <AlertCircle />
      <h2>{t('Something interrupted the trip.')}</h2>
      <p>{error instanceof Error ? t(error.message) : t('Please try again.')}</p>
      {retry && <Button onClick={retry}>{t('Try again')}</Button>}
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
  useTranslation();

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
