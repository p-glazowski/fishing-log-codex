import { t, numberLabel, useTranslation, validationMessage } from '../../lib/i18n';
import { ChevronDown, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../lib/api';
import { Photo } from '../media/LureArt';
import { Button } from '../ui/button';
import { useLurePicker } from './useLurePicker';
import { LurePickerResults } from './LurePickerResults';
export default function LurePicker() {
  useTranslation();

  const picker = useLurePicker();
  const {
    id,
    field,
    fieldState,
    selectedId,
    open,
    setOpen,
    search,
    debouncedSearch,
    setSearch,
    setActiveIndex,
    notice,
    results,
    selected,
    waiting,
    lures,
    current,
    highlighted,
    keyboard,
  } = picker;
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
        {t('Lure used')}
        <span className="required">*</span>
      </label>
      <p id={`${id}-help`} className="picker-help">
        {t('Search your collection by lure name or brand, then select a lure.')}
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
              ? t('Checking selected lure…')
              : t('Search by name or brand…')
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
          aria-label={open ? t('Close lure choices') : t('Browse lures')}
          onClick={() => {
            setOpen(!open);
            setSearch('');
          }}
        >
          <ChevronDown size={17} />
        </button>
      </div>
      <LurePickerResults picker={picker} />
      {current && (
        <div className="picker-selection">
          <span className="picker-thumb">
            <Photo src={current.image?.url} alt="" type={t(current.type)} />
          </span>
          <div>
            <span className="brand">{t('SELECTED FOR THIS CATCH')}</span>
            <strong>
              {current.brand} {current.name}
            </strong>
            <small>
              {t(current.type)} · {numberLabel(current.lengthMm)} mm
              {current.color ? ` · ${current.color}` : ''}
            </small>
          </div>
          <button
            type="button"
            aria-label={t('Clear selected lure')}
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
            {t('Could not verify the selected lure.')}{' '}
            <Button type="button" variant="ghost" size="sm" onClick={() => void selected.refetch()}>
              {t('Try again')}
            </Button>
          </div>
        )}
      {!waiting && results.isSuccess && !debouncedSearch && results.data.pages[0].total === 0 && (
        <div className="picker-empty">
          <strong>{t('First, a lure for your story.')}</strong>
          <p>{t('Add a lure to your collection before logging a catch.')}</p>
          <Link className="text-action" to="/lures/new">
            {t('Add a lure →')}
          </Link>
        </div>
      )}
      {fieldState.error && (
        <span id={`${id}-error`} role="alert" className="field-error">
          {validationMessage(fieldState.error.message)}
        </span>
      )}
    </div>
  );
}
