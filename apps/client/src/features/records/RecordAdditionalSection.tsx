import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { RecordAdditional } from './RecordFields';

export function RecordAdditionalSection({
  kind,
  initial,
}: {
  kind: 'lure' | 'catch';
  initial?: object;
}) {
  const { t } = useTranslation();
  const {
    formState: { errors },
  } = useFormContext();
  const names =
    kind === 'lure'
      ? ['buoyancy', 'technique', 'purchaseDate', 'purchasePrice', 'description']
      : ['weather', 'waterConditions', 'notes'];
  const [open, setOpen] = useState(() =>
    names.some((name) => {
      const value = initial && (initial as Record<string, unknown>)[name];
      return value !== undefined && value !== null && value !== '';
    }),
  );
  return (
    <details
      className="panel form-section record-additional"
      open={open || names.some((name) => !!errors[name])}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <span>
          <strong>{t('Additional details')}</strong>
          <small>{t('Optional')}</small>
        </span>
        <ChevronDown size={18} />
      </summary>
      <RecordAdditional kind={kind} />
    </details>
  );
}
