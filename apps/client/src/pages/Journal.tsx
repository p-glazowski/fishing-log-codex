import { t, countLabel, useTranslation } from '../lib/i18n';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import { JournalLureFilter } from '../components/lures/JournalLureFilter';
import { FilterSelect } from '../components/ui/filter-select';
import { Button } from '../components/ui/button';
import { PageHeading, Loading, Failure, Empty, CatchCard, Pagination } from '../components/common';
export default function Journal() {
  useTranslation();

  const [urlParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [lure, setLure] = useState(urlParams.get('lure') ?? '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('date');
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({
    search,
    sort,
    page: String(page),
    ...(lure ? { lure } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  });
  const query = useQuery({
    queryKey: ['catches', params.toString()],
    queryFn: () => api.catches(params.toString()),
  });
  return (
    <>
      <PageHeading
        eyebrow={t('FIELD NOTES')}
        title={t('Your fishing journal')}
        description={t('Every catch, the lure behind it, and the details worth keeping.')}
      >
        <Button asChild>
          <Link to="/catches/new">
            <Plus size={18} />
            {t('Log a catch')}
          </Link>
        </Button>
      </PageHeading>
      <div className="filter-bar">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label={t('Search fish species')}
            placeholder={t('Search fish species…')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <JournalLureFilter
          value={lure}
          onChange={(id) => {
            setLure(id);
            setPage(1);
          }}
        />
        <FilterSelect
          aria-label={t('Sort catches')}
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="date">{t('Newest catches')}</option>
          <option value="length">{t('Longest fish')}</option>
          <option value="weight">{t('Heaviest fish')}</option>
        </FilterSelect>
      </div>
      <div className="date-filters">
        <label>
          {t('From')}
          <input
            aria-label={t('From date')}
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          {t('To')}
          <input
            aria-label={t('To date')}
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <span>{countLabel(query.data?.total ?? 0, 'catch')}</span>
      </div>
      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : query.data?.data.length ? (
        <div className="catch-grid">
          {query.data.data.map((item) => (
            <CatchCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <Empty
          title={
            search || lure || from || to
              ? t('No catches match your filters.')
              : t('The best stories are still ahead.')
          }
          description={t(
            'Log a catch, add a photo, and keep the moment long after the day is over.',
          )}
          to="/catches/new"
          label={t('Log your first catch')}
        />
      )}
      <Pagination page={page} pages={query.data?.pages ?? 0} setPage={setPage} />
    </>
  );
}
