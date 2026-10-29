import { Button } from '../ui/button';
import { useTranslation } from '../../lib/i18n';
export function PhotoRemovalNotice({ onUndo }: { onUndo: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="photo-removal-notice" role="status">
      <p>{t('Photo will be removed when you save.')}</p>
      <Button type="button" variant="outline" size="sm" onClick={onUndo}>
        {t('Undo')}
      </Button>
    </div>
  );
}
