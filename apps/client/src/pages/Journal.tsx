import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Grid2X2, List } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { PageHeading, Loading, Failure, Empty, CatchCard, Pagination } from '../components/common';
export default function Journal() {
  const [urlParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [lure, setLure] = useState(urlParams.get('lure') ?? '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('date');
  const [page, setPage] = useState(1);
  const [list, setList] = useState(false);
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
  const lures = useQuery({
    queryKey: ['lure-options'],
    queryFn: () => api.lures('limit=100&sort=name'),
  });
  return (
    <>
      <PageHeading
        eyebrow="FIELD NOTES"
        title="Your fishing journal"
        description="Every catch, the lure behind it, and the details worth keeping."
      >
        <Button asChild>
          <Link to="/catches/new">
            <Plus size={18} />
            Log a catch
          </Link>
        </Button>
      </PageHeading>
      <div className="filter-bar">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search fish species"
            placeholder="Search fish species…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Filter by lure"
          value={lure}
          onChange={(e) => {
            setLure(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All lures</option>
          {lures.data?.data.map((l) => (
            <option key={l._id} value={l._id}>
              {l.brand} {l.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort catches"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="date">Newest catches</option>
          <option value="length">Longest fish</option>
          <option value="weight">Heaviest fish</option>
        </select>
        <div className="view-toggle">
          <Button
            variant={!list ? 'default' : 'ghost'}
            size="icon"
            aria-label="Gallery view"
            aria-pressed={!list}
            onClick={() => setList(false)}
          >
            <Grid2X2 size={18} />
          </Button>
          <Button
            variant={list ? 'default' : 'ghost'}
            size="icon"
            aria-label="List view"
            aria-pressed={list}
            onClick={() => setList(true)}
          >
            <List size={18} />
          </Button>
        </div>
      </div>
      <div className="date-filters">
        <label>
          From
          <input
            aria-label="From date"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          To
          <input
            aria-label="To date"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <span>{query.data?.total ?? 0} recorded catches</span>
      </div>
      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : query.data?.data.length ? (
        <div className={list ? 'journal-list' : 'catch-grid'}>
          {query.data.data.map((item) => (
            <CatchCard key={item._id} item={item} list={list} />
          ))}
        </div>
      ) : (
        <Empty
          title={
            search || lure || from || to
              ? 'No catches match your filters.'
              : 'The best stories are still ahead.'
          }
          description="Log a catch, add a photo, and keep the moment long after the day is over."
          to="/catches/new"
          label="Log your first catch"
        />
      )}
      <Pagination page={page} pages={query.data?.pages ?? 0} setPage={setPage} />
    </>
  );
}
