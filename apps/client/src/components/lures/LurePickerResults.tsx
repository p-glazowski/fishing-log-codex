import { t, numberLabel, useTranslation } from '../../lib/i18n';
import { Check, LoaderCircle } from 'lucide-react';
import { errorMessage } from '../../lib/api';
import { Photo } from '../media/LureArt';
import { Button } from '../ui/button';
import type { useLurePicker } from './useLurePicker';
export function LurePickerResults({ picker }: { picker: ReturnType<typeof useLurePicker> }) {
  useTranslation();

  const {
    open,
    waiting,
    results,
    id,
    lures,
    selectedId,
    highlighted,
    setActiveIndex,
    choose,
    debouncedSearch,
  } = picker;
  return (
    <>
      {open && (
        <div className="picker-dropdown">
          {waiting && (
            <p role="status" className="picker-message">
              <LoaderCircle size={16} />
              {t('Searching your collection…')}
            </p>
          )}
          {results.isError && (
            <div role="alert" className="picker-message">
              <p>{t(errorMessage(results.error))}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void results.refetch()}
              >
                {t('Try again')}
              </Button>
            </div>
          )}
          <div id={`${id}-results`} role="listbox" aria-label={t('Your lures')} aria-busy={waiting}>
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
                  <Photo src={lure.image?.url} alt="" type={t(lure.type)} />
                </span>
                <span>
                  <strong>
                    {lure.brand} {lure.name}
                  </strong>
                  <small>
                    {t(lure.type)} · {numberLabel(lure.lengthMm)} mm
                    {lure.color ? ` · ${lure.color}` : ''}
                  </small>
                </span>
                {selectedId === lure._id && <Check size={17} />}
              </button>
            ))}
          </div>
          {!waiting && !results.isError && !lures.length && (
            <p className="picker-message" role="status">
              {debouncedSearch
                ? t('No lures match your search. Try another name or brand.')
                : t('Your collection is empty.')}
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
              {results.isFetchingNextPage ? t('Loading more…') : t('Load more lures')}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
