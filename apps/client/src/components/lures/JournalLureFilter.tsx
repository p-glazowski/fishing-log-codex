import { Check, ChevronDown, Search } from 'lucide-react';
import { useTranslation, numberLabel } from '../../lib/i18n';
import { Button } from '../ui/button';
import { lureFilterLabel, useJournalLureFilter } from './useJournalLureFilter';

export function JournalLureFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { t } = useTranslation();
  const picker = useJournalLureFilter(value, onChange);
  const {
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
    groups,
    options,
    highlighted,
    close,
    choose,
    keyboard,
  } = picker;
  const selectedLabel = !value
    ? t('All lures')
    : selected.data
      ? lureFilterLabel(selected.data)
      : selected.isError
        ? t('Selected lure unavailable')
        : t('Checking selected lure…');
  return (
    <div
      className="journal-lure-filter"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <div className="picker-input">
        <Search size={17} aria-hidden="true" />
        <input
          ref={input}
          role="combobox"
          aria-label={t('Filter by lure')}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open ? `${id}-option-${highlighted}` : undefined}
          autoComplete="off"
          placeholder={t('Search by name or brand…')}
          title={selectedLabel}
          value={open ? search : selectedLabel}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onClick={() => {
            if (!open) {
              setOpen(true);
              setActive(0);
            }
          }}
          onKeyDown={keyboard}
          onChange={(event) => {
            setSearch(event.target.value);
            setActive(0);
            setOpen(true);
          }}
        />
        <button
          type="button"
          aria-label={open ? t('Close lure choices') : t('Browse lures')}
          aria-expanded={open}
          onClick={() => {
            if (open) close();
            else {
              setOpen(true);
              input.current?.focus();
            }
          }}
        >
          <ChevronDown size={17} aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div className="picker-dropdown journal-lure-dropdown">
          <div id={`${id}-list`} role="listbox" aria-label={t('Your lures')} aria-busy={waiting}>
            <button
              type="button"
              role="option"
              id={`${id}-option-0`}
              tabIndex={-1}
              aria-selected={!value}
              className={`picker-option ${highlighted === 0 ? 'highlighted' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(0)}
              onClick={() => choose('')}
            >
              <strong>{t('All lures')}</strong>
              {!value && <Check size={17} aria-hidden="true" />}
            </button>
            {groups.map((group, groupIndex) => (
              <div
                role="group"
                key={group.brand.toLowerCase()}
                aria-labelledby={`${id}-brand-${groupIndex}`}
              >
                <div className="journal-lure-brand" id={`${id}-brand-${groupIndex}`}>
                  {group.brand}
                </div>
                {group.lures.map((lure) => {
                  const index = options.findIndex((option) => option._id === lure._id) + 1;
                  return (
                    <button
                      key={lure._id}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      id={`${id}-option-${index}`}
                      aria-selected={value === lure._id}
                      aria-label={lureFilterLabel(lure, group.brand)}
                      className={`picker-option ${highlighted === index ? 'highlighted' : ''}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(lure._id)}
                    >
                      <span>
                        <strong>{lure.name}</strong>
                        <small>
                          {numberLabel(lure.lengthMm)} mm{lure.color ? ` · ${lure.color}` : ''}
                        </small>
                      </span>
                      {value === lure._id && <Check size={17} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {waiting && (
            <p role="status" className="picker-message">
              {t('Searching your collection…')}
            </p>
          )}
          {results.isError && (
            <div role="alert" className="picker-message">
              <p>{t('Could not load lure choices.')}</p>
              <Button variant="outline" size="sm" onClick={() => void results.refetch()}>
                {t('Try again')}
              </Button>
            </div>
          )}
          {!waiting && !results.isError && !options.length && (
            <p role="status" className="picker-message">
              {t('No lures match your search. Try another name or brand.')}
            </p>
          )}
          {results.hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              className="full-width"
              disabled={results.isFetchingNextPage || waiting}
              onClick={() => void results.fetchNextPage()}
            >
              {results.isFetchingNextPage ? t('Loading more…') : t('Load more lures')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
