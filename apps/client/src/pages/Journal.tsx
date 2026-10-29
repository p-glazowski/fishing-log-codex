import { t, useTranslation } from '../lib/i18n';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { JournalFilters } from '../components/lures/JournalFilters';
import { Button } from '../components/ui/button';
import { PageHeading, Loading, Failure, Empty, CatchCard, Pagination } from '../components/common';
function localDayBoundary(value: string, nextDay = false) {
  const date = new Date(`${value}T00:00:00`);
  if (nextDay) date.setDate(date.getDate() + 1);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
export default function Journal() {
  useTranslation();
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const lure = params.get('lure') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const sort = params.get('sort') ?? 'date';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const debouncedSearch = useDebouncedValue(search);
  const fromInstant = from ? localDayBoundary(from) : undefined;
  const toExclusive = to ? localDayBoundary(to, true) : undefined;
  const invalidRange = !!(
    (from && !fromInstant) ||
    (to && !toExclusive) ||
    (from && to && from > to)
  );
  const activeCount = [search, lure, from || to, sort !== 'date'].filter(Boolean).length;
  const queryParams = new URLSearchParams({
    search: debouncedSearch,
    sort,
    page: String(page),
    ...(lure ? { lure } : {}),
    ...(fromInstant ? { fromInstant } : {}),
    ...(toExclusive ? { toExclusive } : {}),
  });
  const query = useQuery({
    queryKey: ['catches', queryParams.toString()],
    queryFn: () => api.catches(queryParams.toString()),
    enabled: !invalidRange,
    placeholderData: keepPreviousData,
  });
  const clear = () => setParams({}, { preventScrollReset: true });
  return (
    <>
      <PageHeading
        title={t('Your fishing journal')}
        description={t('Your catches and the lures behind them.')}
      >
        <Button asChild>
          <Link to="/catches/new">
            <Plus size={18} />
            {t('Log a catch')}
          </Link>
        </Button>
      </PageHeading>
      <JournalFilters
        total={search === debouncedSearch && !query.isFetching ? query.data?.total : undefined}
      />
      {invalidRange ? (
        <Failure error={new Error(t('Choose a valid date range.'))} retry={clear} />
      ) : query.isLoading ||
        ((search !== debouncedSearch || query.isFetching) && !query.data?.data.length) ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : query.data?.data.length ? (
        <div className="catch-grid" aria-busy={query.isFetching}>
          {query.data.data.map((item) => (
            <CatchCard key={item._id} item={item} />
          ))}
        </div>
      ) : activeCount ? (
        <Empty
          title={t('No catches match your filters.')}
          description={t('Try a different search or clear your filters.')}
        >
          <Button onClick={clear}>{t('Clear filters')}</Button>
        </Empty>
      ) : (
        <Empty
          title={t('The best stories are still ahead.')}
          description={t('Log your first catch with a lure from your collection.')}
          to="/catches/new"
          label={t('Log your first catch')}
        />
      )}
      <Pagination
        page={page}
        pages={query.data?.pages ?? 0}
        setPage={(n) =>
          setParams((previous) => {
            const next = new URLSearchParams(previous);
            next.set('page', String(n));
            return next;
          })
        }
      />
    </>
  );
}
