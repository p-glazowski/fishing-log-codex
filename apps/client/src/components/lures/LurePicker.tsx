import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useController, useFormContext } from 'react-hook-form';
import { Check, ChevronDown, LoaderCircle, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Lure } from '@lurelog/shared';
import { api, ApiError, errorMessage } from '../../lib/api';
import { Photo } from '../common';
import { Button } from '../ui/button';

export default function LurePicker() {
  const id = useId();
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name: 'lureId', control });
  const selectedId = String(field.value ?? '');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const results = useInfiniteQuery({
    queryKey: ['lure-options', debouncedSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.lures(
        new URLSearchParams({
          limit: '20',
          sort: 'name',
          search: debouncedSearch,
          page: String(pageParam),
        }).toString(),
        { signal },
      ),
    getNextPageParam: (page) => (page.page < page.pages ? page.page + 1 : undefined),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  const selected = useQuery({
    queryKey: ['lure', selectedId],
    queryFn: ({ signal }) => api.lure(selectedId, { signal }),
    enabled: !!selectedId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
  });
  useEffect(() => {
    if (selectedId && selected.error instanceof ApiError && selected.error.status === 404) {
      field.onChange('');
      setNotice('That lure is no longer in your collection. Choose another lure.');
      setSearch('');
      setOpen(true);
      void results.refetch();
    }
  }, [selectedId, selected.error, field.onChange, results.refetch]);

  const waiting =
    search.trim() !== debouncedSearch ||
    results.isLoading ||
    (results.isFetching && !results.isFetchingNextPage);
  // A previous search or cached page must never masquerade as fresh results.
  const lures =
    waiting || results.isError
      ? []
      : Array.from(
          new Map(
            results.data?.pages.flatMap((page) => page.data).map((lure) => [lure._id, lure]) ?? [],
          ).values(),
        );
  const current = selected.isSuccess && !selected.isFetching ? selected.data : undefined;
  const highlighted = Math.min(activeIndex, Math.max(0, lures.length - 1));
  function choose(lure: Lure) {
    field.onChange(lure._id);
    field.onBlur();
    setNotice('');
    setOpen(false);
    setSearch('');
    setActiveIndex(0);
  }
  function keyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) =>
        !open
          ? 0
          : Math.max(0, Math.min(lures.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))),
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (!open) setOpen(true);
      else if (lures[highlighted]) choose(lures[highlighted]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setSearch('');
    }
  }
  return (
    <div
      className="field field-wide lure-picker"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
          setSearch('');
          field.onBlur();
        }
      }}
    >
      <label htmlFor={id}>
        Lure used <span className="required">*</span>
      </label>
      <p id={`${id}-help`} className="picker-help">
        Search your collection by lure name or brand, then select a lure.
      </p>
      <div className="picker-input">
        <Search size={17} />
        <input
          id={id}
          ref={field.ref}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-results`}
          aria-activedescendant={
            open && lures[highlighted] ? `${id}-${lures[highlighted]._id}` : undefined
          }
          aria-invalid={!!fieldState.error}
          aria-describedby={`${id}-help${fieldState.error ? ` ${id}-error` : ''}`}
          autoComplete="off"
          placeholder={
            selectedId && selected.isFetching
              ? 'Checking selected lure…'
              : 'Search by name or brand…'
          }
          value={open ? search : current ? `${current.brand} ${current.name}` : ''}
          onFocus={() => {
            setOpen(true);
            void results.refetch();
          }}
          onKeyDown={keyboard}
          onChange={(event) => {
            setSearch(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
        />
        <button
          type="button"
          aria-label={open ? 'Close lure choices' : 'Browse lures'}
          onClick={() => {
            setOpen(!open);
            setSearch('');
          }}
        >
          <ChevronDown size={17} />
        </button>
      </div>
      {open && (
        <div className="picker-dropdown">
          {waiting && (
            <p role="status" className="picker-message">
              <LoaderCircle size={16} />
              Searching your collection…
            </p>
          )}
          {results.isError && (
            <div role="alert" className="picker-message">
              <p>{errorMessage(results.error)}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void results.refetch()}
              >
                Try again
              </Button>
            </div>
          )}
          <div id={`${id}-results`} role="listbox" aria-label="Your lures" aria-busy={waiting}>
            {lures.map((lure, index) => (
              <button
                key={lure._id}
                id={`${id}-${lure._id}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={selectedId === lure._id}
                className={`picker-option ${index === highlighted ? 'highlighted' : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(lure)}
              >
                <span className="picker-thumb">
                  <Photo src={lure.image?.url} alt="" type={lure.type} />
                </span>
                <span>
                  <strong>
                    {lure.brand} {lure.name}
                  </strong>
                  <small>
                    {lure.type} · {lure.lengthMm} mm{lure.color ? ` · ${lure.color}` : ''}
                  </small>
                </span>
                {selectedId === lure._id && <Check size={17} />}
              </button>
            ))}
          </div>
          {!waiting && !results.isError && !lures.length && (
            <p className="picker-message" role="status">
              {debouncedSearch
                ? 'No lures match your search. Try another name or brand.'
                : 'Your collection is empty.'}
            </p>
          )}
          {!waiting && results.hasNextPage && (
            <Button
              type="button"
              variant="ghost"
              className="full-width"
              disabled={results.isFetchingNextPage}
              onClick={() => void results.fetchNextPage()}
            >
              {results.isFetchingNextPage ? 'Loading more…' : 'Load more lures'}
            </Button>
          )}
        </div>
      )}
      {current && (
        <div className="picker-selection">
          <span className="picker-thumb">
            <Photo src={current.image?.url} alt="" type={current.type} />
          </span>
          <div>
            <span className="brand">SELECTED FOR THIS CATCH</span>
            <strong>
              {current.brand} {current.name}
            </strong>
            <small>
              {current.type} · {current.lengthMm} mm{current.color ? ` · ${current.color}` : ''}
            </small>
          </div>
          <button
            type="button"
            aria-label="Clear selected lure"
            onClick={() => {
              field.onChange('');
              setSearch('');
              setOpen(true);
            }}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {notice && (
        <p className="picker-notice" role="status">
          {notice}
        </p>
      )}
      {selected.isError &&
        !(selected.error instanceof ApiError && selected.error.status === 404) && (
          <div className="picker-notice" role="alert">
            Could not verify the selected lure.{' '}
            <Button type="button" variant="ghost" size="sm" onClick={() => void selected.refetch()}>
              Try again
            </Button>
          </div>
        )}
      {!waiting && results.isSuccess && !debouncedSearch && results.data.pages[0].total === 0 && (
        <div className="picker-empty">
          <strong>First, a lure for your story.</strong>
          <p>Add a lure to your collection before logging a catch.</p>
          <Link className="text-action" to="/lures/new">
            Add a lure →
          </Link>
        </div>
      )}
      {fieldState.error && (
        <span id={`${id}-error`} role="alert" className="field-error">
          {fieldState.error.message}
        </span>
      )}
    </div>
  );
}
