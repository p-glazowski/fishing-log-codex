import { t } from '../../lib/i18n';
import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useController, useFormContext } from 'react-hook-form';
import type { Lure } from '@lurelog/shared';
import { api, ApiError } from '../../lib/api';
export function useLurePicker() {
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
      setNotice(t('That lure is no longer in your collection. Choose another lure.'));
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

  return {
    id,
    field,
    fieldState,
    selectedId,
    open,
    setOpen,
    search,
    setSearch,
    debouncedSearch,
    setActiveIndex,
    notice,
    results,
    selected,
    waiting,
    lures,
    current,
    highlighted,
    choose,
    keyboard,
  };
}
