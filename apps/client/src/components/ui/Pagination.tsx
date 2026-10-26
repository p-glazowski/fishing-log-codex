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
  return pages > 1 ? (
    <div className="pagination">
      <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
        Previous
      </Button>
      <span>
        Page {page} of {pages}
      </span>
      <Button variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
        Next
      </Button>
    </div>
  ) : null;
}
