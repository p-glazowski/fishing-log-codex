import { t, useTranslation } from '../../lib/i18n';
import { Link } from 'react-router-dom';
export function Logo() {
  useTranslation();

  return (
    <Link className="logo" to="/" aria-label={t('LureLog home')}>
      <span className="logo-mark">
        <svg width={24} height={24} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <use href="/brand/perch.svg#perch-mark" />
        </svg>
      </span>
      <span>
        Lure
        <span className="logo-light">Log</span>
      </span>
      <span className="logo-edition" aria-hidden="true">
        {t('FIELD JOURNAL')}
      </span>
    </Link>
  );
}
