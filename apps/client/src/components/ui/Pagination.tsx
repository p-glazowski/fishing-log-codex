import { t, useTranslation } from '../../lib/i18n';
import { Button } from './button';
export function Pagination({
  page,
  pages,
  setPage,
}: {
  page: number;
  pages: number;
  setPage: (n: number) => void;
}) {
  useTranslation();

  return pages > 1 ? (
    <div className="pagination">
      <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
        {t('Previous')}
      </Button>
      <span>
        {t('Page')} {page} {t('of')} {pages}
      </span>
      <Button variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
        {t('Next')}
      </Button>
    </div>
  ) : null;
}
