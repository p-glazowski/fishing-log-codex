import { FilterSelect } from '../ui/filter-select';
import { t, useTranslation, validationMessage } from '../../lib/i18n';
import { useId, type ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
export function Field({
  name,
  label,
  type = 'text',
  required = false,
  children,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  children?: ReactNode;
  placeholder?: string;
}) {
  useTranslation();
  const errorId = useId();
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const props = register(name, {
    setValueAs: (v) =>
      v === '' || v === null || v === undefined
        ? type === 'number' || type === 'date' || children
          ? required
            ? undefined
            : null
          : ''
        : type === 'number'
          ? Number(v)
          : v,
  });
  const error = errors[name]?.message as string | undefined;
  return (
    <label className={type === 'textarea' ? 'field field-wide' : 'field'}>
      {t(label)}
      {required && <span className="required">*</span>}
      {children ? (
        <FilterSelect
          {...props}
          aria-invalid={!!error}
          aria-required={required}
          aria-describedby={error ? errorId : undefined}
        >
          {children}
        </FilterSelect>
      ) : type === 'textarea' ? (
        <textarea
          {...props}
          rows={4}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-required={required}
          aria-describedby={error ? errorId : undefined}
        />
      ) : (
        <input
          {...props}
          type={type}
          step={type === 'number' ? 'any' : undefined}
          min={type === 'number' ? 0 : undefined}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-required={required}
          aria-describedby={error ? errorId : undefined}
        />
      )}{' '}
      {error && (
        <span id={errorId} className="field-error" role="alert">
          {validationMessage(error)}
        </span>
      )}
    </label>
  );
}
