import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { lureTypes } from '@lurelog/shared';
import { api, data } from '../lib/api';
import { Button } from '../components/ui/button';
import { Empty, Failure, Loading, LureCard, PageHeading, Pagination } from '../components/common';
export default function Collection() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [expanded, setExpanded] = useState(false);
  const page = Number(params.get('page') ?? 1);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (params.get('search') ?? '')) {
        const next = new URLSearchParams(params);
        if (search) next.set('search', search);
        else next.delete('search');
        next.delete('page');
        setParams(next, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, params, setParams]);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  }
  const query = useQuery({
    queryKey: ['lures', params.toString()],
    queryFn: () => api.lures(params.toString()),
  });
  const brands = useQuery({ queryKey: ['brands'], queryFn: () => data<string[]>('/lure-filters') });
  return (
    <>
      <PageHeading
        eyebrow="YOUR TACKLE BOX"
        title="Your lure collection"
        description="Find the right lure. Keep the details that make a difference."
      >
        <Button asChild>
          <Link to="/lures/new">
            <Plus size={18} />
            Add lure
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
            All lures <span>{query.data?.total ?? '–'}</span>
          </button>
          {lureTypes.map((t) => (
            <button
              key={t}
              aria-pressed={params.get('type') === t}
              className={params.get('type') === t ? 'active' : ''}
              onClick={() => filter('type', t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-bar">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search lures"
            placeholder="Search by lure name or brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by brand"
          value={params.get('brand') ?? ''}
          onChange={(e) => filter('brand', e.target.value)}
        >
          <option value="">All brands</option>
          {brands.data?.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select
          aria-label="Sort lures"
          value={params.get('sort') ?? 'newest'}
          onChange={(e) => filter('sort', e.target.value)}
        >
          <option value="newest">Recently added</option>
          <option value="name">Name A–Z</option>
          <option value="catches">Most catches</option>
        </select>
        <Button variant="outline" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
          <SlidersHorizontal size={17} />
          Filters
        </Button>
      </div>
      {expanded && (
        <div className="extra-filters">
          <label>
            Lure type
            <select
              value={params.get('type') ?? ''}
              onChange={(e) => filter('type', e.target.value)}
            >
              <option value="">All types</option>
              {lureTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Minimum length (mm)
            <input
              type="number"
              min="0"
              value={params.get('minSize') ?? ''}
              onChange={(e) => filter('minSize', e.target.value)}
            />
          </label>
          <label>
            Maximum length (mm)
            <input
              type="number"
              min="0"
              value={params.get('maxSize') ?? ''}
              onChange={(e) => filter('maxSize', e.target.value)}
            />
          </label>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setParams({});
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      <div className="results-label">
        <span>{query.data?.total ?? 0} lures in view</span>
        <span>Select a lure to explore its catch history.</span>
      </div>
      {query.isLoading ? (
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
            params.size ? 'No lures match this cast.' : 'Your collection starts with one lure.'
          }
          description={
            params.size
              ? 'Try a different search or clear your filters.'
              : 'Add your first lure and start keeping track of what works.'
          }
          to="/lures/new"
          label="Add your first lure"
        />
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
