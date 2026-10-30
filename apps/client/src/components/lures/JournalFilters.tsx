import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { t, countLabel, useTranslation } from '../../lib/i18n';
import { dateLabel } from '../../lib/api';
import { JournalLureFilter } from '../lures/JournalLureFilter';
import { FilterSelect } from '../ui/filter-select';
import { Button } from '../ui/button';
export function JournalFilters({ total }: { total?: number }) {
  useTranslation();
  const [params, setParams] = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const search = params.get('search') ?? '',
    lure = params.get('lure') ?? '',
    from = params.get('from') ?? '',
    to = params.get('to') ?? '',
    sort = params.get('sort') ?? 'date';
  const activeCount = [search, lure, from || to, sort !== 'date'].filter(Boolean).length;
  function filter(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete('page');
        return next;
      },
      { replace: key === 'search', preventScrollReset: true },
    );
  }
  const clear = () => setParams({}, { preventScrollReset: true });
  return (
    <div className="journal-filters">
      <div className="filter-bar journal-search-row">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label={t('Search fish species')}
            placeholder={t('Search fish species…')}
            value={search}
            onChange={(e) => filter('search', e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          aria-expanded={expanded}
          aria-controls="journal-filter-panel"
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal size={17} />
          {t('Filters')}
          {activeCount > 0 && ` (${activeCount})`}
        </Button>
      </div>
      {expanded && (
        <div className="journal-filter-panel" id="journal-filter-panel">
          <label>
            {t('Lure used')}
            <JournalLureFilter value={lure} onChange={(id) => filter('lure', id)} />
          </label>
          <label>
            {t('Sort catches')}
            <FilterSelect
              aria-label={t('Sort catches')}
              value={sort}
              onChange={(e) => filter('sort', e.target.value)}
            >
              <option value="date">{t('Newest catches')}</option>
              <option value="length">{t('Longest fish')}</option>
              <option value="weight">{t('Heaviest fish')}</option>
            </FilterSelect>
          </label>
          <label>
            {t('From')}
            <input
              aria-label={t('From date')}
              type="date"
              value={from}
              onChange={(e) => filter('from', e.target.value)}
            />
          </label>
          <label>
            {t('To')}
            <input
              aria-label={t('To date')}
              type="date"
              value={to}
              onChange={(e) => filter('to', e.target.value)}
            />
          </label>
        </div>
      )}
      <div className="filter-summary">
        <span role="status">
          {total !== undefined
            ? `${countLabel(total!, 'catch')}${activeCount ? ` ${t('matching filters')}` : ''}`
            : t('Loading…')}
        </span>
        {!!(from || to) && (
          <span className="active-filter">
            {from ? dateLabel(from) : '…'} – {to ? dateLabel(to) : '…'}
            <button
              type="button"
              aria-label={t('Clear date filter')}
              onClick={() =>
                setParams(
                  (previous) => {
                    const next = new URLSearchParams(previous);
                    next.delete('from');
                    next.delete('to');
                    next.delete('page');
                    return next;
                  },
                  { preventScrollReset: true },
                )
              }
            >
              <X size={16} />
            </button>
          </span>
        )}
        {!!lure && !expanded && <span>{t('Lure filter active')}</span>}
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            {t('Clear filters')}
          </Button>
        )}
      </div>
    </div>
  );
}
