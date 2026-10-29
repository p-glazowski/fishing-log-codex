import { t as translate, countLabel, numberLabel, useTranslation } from '../lib/i18n';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { lureTypes } from '@lurelog/shared';
import { api, data } from '../lib/api';
import { FilterSelect } from '../components/ui/filter-select';
import { Button } from '../components/ui/button';
import { Empty, Failure, Loading, LureCard, PageHeading, Pagination } from '../components/common';
export default function Collection() {
  useTranslation();

  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const debouncedSearch = useDebouncedValue(search);
  const [expanded, setExpanded] = useState(false);
  const page = Number(params.get('page') ?? 1);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace: key === 'search', preventScrollReset: true });
  }
  const requestParams = new URLSearchParams(params);
  if (debouncedSearch) requestParams.set('search', debouncedSearch);
  else requestParams.delete('search');
  const query = useQuery({
    queryKey: ['lures', requestParams.toString()],
    queryFn: () => api.lures(requestParams.toString()),
    placeholderData: keepPreviousData,
  });
  const total = useQuery({ queryKey: ['lure-availability'], queryFn: () => api.lures('limit=1') });
  const brands = useQuery({ queryKey: ['brands'], queryFn: () => data<string[]>('/lure-filters') });
  return (
    <>
      <PageHeading
        eyebrow={translate('YOUR TACKLE BOX')}
        title={translate('Your lure collection')}
        description={translate('Find the right lure. Keep the details that make a difference.')}
      >
        <Button asChild>
          <Link to="/lures/new">
            <Plus size={18} />
            {translate('Add lure')}
          </Link>
        </Button>
      </PageHeading>
      <div className="collection-toolbar">
        <div className="tabs">
          <button
            aria-pressed={!params.get('type')}
            className={!params.get('type') ? 'active' : ''}
            onClick={() => filter('type', '')}
          >
            {translate('All lures')}
            <span>{total.data ? numberLabel(total.data.total) : '–'}</span>
          </button>
          {lureTypes.map((t) => (
            <button
              key={t}
              aria-pressed={params.get('type') === t}
              className={params.get('type') === t ? 'active' : ''}
              onClick={() => filter('type', t)}
            >
              {translate(t)}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-bar">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label={translate('Search lures')}
            placeholder={translate('Search by lure name or brand…')}
            value={search}
            onChange={(e) => filter('search', e.target.value)}
          />
        </div>
        <FilterSelect
          aria-label={translate('Filter by brand')}
          value={params.get('brand') ?? ''}
          onChange={(e) => filter('brand', e.target.value)}
        >
          <option value="">{translate('All brands')}</option>
          {brands.data?.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </FilterSelect>
        <FilterSelect
          aria-label={translate('Sort lures')}
          value={params.get('sort') ?? 'newest'}
          onChange={(e) => filter('sort', e.target.value)}
        >
          <option value="newest">{translate('Recently added')}</option>
          <option value="name">{translate('Name A–Z')}</option>
          <option value="catches">{translate('Most catches')}</option>
        </FilterSelect>
        <Button variant="outline" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
          <SlidersHorizontal size={17} />
          {translate('Filters')}
        </Button>
      </div>
      {expanded && (
        <div className="extra-filters">
          <label>
            {translate('Minimum length (mm)')}
            <input
              type="number"
              min="0"
              value={params.get('minSize') ?? ''}
              onChange={(e) => filter('minSize', e.target.value)}
            />
          </label>
          <label>
            {translate('Maximum length (mm)')}
            <input
              type="number"
              min="0"
              value={params.get('maxSize') ?? ''}
              onChange={(e) => filter('maxSize', e.target.value)}
            />
          </label>
        </div>
      )}
      {params.size > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setParams({})}>
          {translate('Clear filters')}
        </Button>
      )}
      <div className="results-label">
        <span>
          {countLabel(query.data?.total ?? 0, 'lure')} {translate('in view')}
        </span>
        <span>{translate('Select a lure to explore its catch history.')}</span>
      </div>
      {query.isLoading ||
      ((search !== debouncedSearch || query.isFetching) && !query.data?.data.length) ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : query.data?.data.length ? (
        <div className="lure-grid">
          {query.data.data.map((lure) => (
            <LureCard key={lure._id} lure={lure} />
          ))}
        </div>
      ) : (
        <Empty
          title={
            params.size
              ? translate('No lures match this cast.')
              : translate('Your collection starts with one lure.')
          }
          description={
            params.size
              ? translate('Try a different search or clear your filters.')
              : translate('Add your first lure and start keeping track of what works.')
          }
          to={params.size ? undefined : '/lures/new'}
          label={translate('Add your first lure')}
        >
          {params.size > 0 && (
            <Button onClick={() => setParams({})}>{translate('Clear filters')}</Button>
          )}
        </Empty>
      )}
      <Pagination
        page={page}
        pages={query.data?.pages ?? 0}
        setPage={(n) => {
          const next = new URLSearchParams(params);
          next.set('page', String(n));
          setParams(next);
        }}
      />
    </>
  );
}
