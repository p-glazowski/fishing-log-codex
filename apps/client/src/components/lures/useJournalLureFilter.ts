import { useEffect, useId, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { Lure } from '@lurelog/shared';
import { api } from '../../lib/api';
import { getLocale, numberLabel } from '../../lib/i18n';

export const lureFilterLabel = (lure: Lure, brand = lure.brand) =>
  [brand, lure.name, `${numberLabel(lure.lengthMm)} mm`, lure.color].filter(Boolean).join(' · ');

export function useJournalLureFilter(value: string, onChange: (id: string) => void) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const results = useInfiniteQuery({
    queryKey: ['lure-options', 'journal', debouncedSearch],
    enabled: open,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.lures(
        new URLSearchParams({
          search: debouncedSearch,
          sort: 'name',
          page: String(pageParam),
          limit: '20',
        }).toString(),
        { signal },
      ),
    getNextPageParam: (page) => (page.page < page.pages ? page.page + 1 : undefined),
  });
  const selected = useQuery({
    queryKey: ['lure', value],
    queryFn: () => api.lure(value),
    enabled: !!value,
    retry: false,
  });
  const waiting =
    search.trim() !== debouncedSearch ||
    results.isPending ||
    (results.isFetching && !results.isFetchingNextPage);
  const lures =
    waiting || results.isError
      ? []
      : [
          ...new Map(
            results.data?.pages.flatMap((page) => page.data).map((lure) => [lure._id, lure]),
          ).values(),
        ];
  const groups = new Map<string, { brand: string; lures: Lure[] }>();
  for (const lure of lures) {
    const brand = lure.brand.trim();
    const key = brand.toLocaleLowerCase('en');
    const group = groups.get(key) ?? { brand, lures: [] };
    // Prefer an existing capitalized spelling, without altering the stored brand.
    if (brand.localeCompare(group.brand, 'en', { caseFirst: 'upper' }) < 0) group.brand = brand;
    group.lures.push(lure);
    groups.set(key, group);
  }
  const sortedGroups = [...groups.values()].sort((a, b) =>
    a.brand.localeCompare(b.brand, getLocale(), { sensitivity: 'accent' }),
  );
  for (const group of sortedGroups)
    group.lures.sort(
      (a, b) =>
        a.name.localeCompare(b.name, getLocale(), { sensitivity: 'accent' }) ||
        a.lengthMm - b.lengthMm ||
        (a.color ?? '').localeCompare(b.color ?? '', getLocale()) ||
        a._id.localeCompare(b._id),
    );
  const options = sortedGroups.flatMap((group) => group.lures);
  const highlighted = Math.min(active, options.length);
  useEffect(() => {
    if (open)
      document
        .getElementById(`${id}-option-${highlighted}`)
        ?.scrollIntoView?.({ block: 'nearest' });
  }, [id, highlighted, open]);
  function close() {
    setOpen(false);
    setSearch('');
    setActive(0);
  }
  function choose(id: string) {
    onChange(id);
    close();
  }
  function keyboard(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      setActive(
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? options.length
            : Math.max(
                0,
                Math.min(options.length, highlighted + (event.key === 'ArrowDown' ? 1 : -1)),
              ),
      );
    }
    if (event.key === 'Enter' && open) {
      event.preventDefault();
      choose(highlighted === 0 ? '' : options[highlighted - 1]._id);
    }
  }
  return {
    id,
    input,
    open,
    setOpen,
    search,
    setSearch,
    setActive,
    results,
    selected,
    waiting,
    groups: sortedGroups,
    options,
    highlighted,
    close,
    choose,
    keyboard,
  };
}
