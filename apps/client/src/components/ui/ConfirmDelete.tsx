import { t, useTranslation } from '../../lib/i18n';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Button } from './button';
export function ConfirmDelete({
  onConfirm,
  kind,
  busy = false,
}: {
  onConfirm: () => void;
  kind: string;
  busy?: boolean;
}) {
  useTranslation();

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button variant="destructive" disabled={busy}>
          {t('Delete')} {t(kind)}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog">
          <AlertDialog.Title>{t('Delete this {{kind}}?', { kind: t(kind) })}</AlertDialog.Title>
          <AlertDialog.Description>
            {kind === 'lure'
              ? t('This permanently deletes the lure, all its catches, and their photos.')
              : t('This permanently deletes this catch and its photo.')}{' '}
            {t('This cannot be undone.')}
          </AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">{t('Keep it')}</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="destructive" onClick={onConfirm}>
                {t('Yes, delete')}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
