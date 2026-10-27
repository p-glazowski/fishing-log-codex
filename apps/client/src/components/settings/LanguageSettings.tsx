import { Languages } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

export function LanguageSelect() {
  const { t, language, setLanguage } = useTranslation();
  return (
    <label className="language-select">
      <Languages size={18} aria-hidden="true" />
      <span className="sr-only">{t('Language')}</span>
      <select
        aria-label={t('Language preference')}
        value={language}
        onChange={(event) => setLanguage(event.target.value === 'pl' ? 'pl' : 'en')}
      >
        <option value="en" lang="en">
          English
        </option>
        <option value="pl" lang="pl">
          Polski
        </option>
      </select>
    </label>
  );
}
export function LanguageSettings() {
  const { t } = useTranslation();
  return (
    <section className="panel form-section language-settings" aria-labelledby="language-title">
      <div className="form-section-heading">
        <Languages aria-hidden="true" />
        <div>
          <h2 id="language-title">{t('Language')}</h2>
          <p>{t('Choose your preferred language.')}</p>
        </div>
      </div>
      <LanguageSelect />
      <p className="appearance-status">{t('Saved on this device. Your records stay unchanged.')}</p>
    </section>
  );
}
