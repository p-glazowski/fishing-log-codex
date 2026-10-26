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
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button variant="destructive" disabled={busy}>
          Delete {kind}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog">
          <AlertDialog.Title>Delete this {kind}?</AlertDialog.Title>
          <AlertDialog.Description>
            {kind === 'lure'
              ? 'This permanently deletes the lure, all its catches, and their photos.'
              : 'This permanently deletes this catch and its photo.'}{' '}
            This cannot be undone.
          </AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Keep it</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="destructive" onClick={onConfirm}>
                Yes, delete
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
