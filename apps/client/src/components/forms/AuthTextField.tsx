import { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { validationMessage } from '../../lib/i18n';
export function AuthTextField({
  name,
  label,
  type = 'text',
  autoComplete,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const id = useId();
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message as string | undefined;
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        {...register(name)}
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span className="field-error" id={`${id}-error`} role="alert">
          {validationMessage(error)}
        </span>
      )}
    </div>
  );
}
