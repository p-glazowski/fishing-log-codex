import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
export function RecordActions({
  kind,
  editing,
  saving,
  error,
  cancelTo,
  state,
}: {
  kind: 'lure' | 'catch';
  editing: boolean;
  saving: boolean;
  error: string;
  cancelTo: string;
  state: unknown;
}) {
  const { t } = useTranslation();
  return (
    <div className="record-actions">
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <Button className="full-width" disabled={saving}>
        <Check size={18} />
        {t(
          saving
            ? 'Saving…'
            : editing
              ? 'Save changes'
              : kind === 'lure'
                ? 'Add to collection'
                : 'Save catch',
        )}
      </Button>
      <Button variant="ghost" asChild className="full-width">
        <Link
          state={state}
          to={cancelTo}
          aria-disabled={saving}
          onClick={(e) => {
            if (saving) e.preventDefault();
          }}
        >
          {t('Cancel')}
        </Link>
      </Button>
    </div>
  );
}
