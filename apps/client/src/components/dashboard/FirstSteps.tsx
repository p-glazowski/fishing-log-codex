import { Link } from 'react-router-dom';
import { Check, Fish, Plus, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../ui/button';

export function FirstSteps({
  hasLure = false,
  catchEntry = false,
}: {
  hasLure?: boolean;
  catchEntry?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <section className="first-steps" aria-labelledby="first-steps-title">
      <header>
        <span className="eyebrow">{t('GET STARTED')}</span>
        <h1 id="first-steps-title">
          {t(hasLure ? 'Your lure is ready. Log your first catch.' : 'First, add a lure.')}
        </h1>
        <p>{t('Every catch is linked to a lure in your collection.')}</p>
      </header>
      <ol className="first-steps-list">
        <li
          className={hasLure ? 'is-complete' : 'is-current'}
          aria-current={!hasLure ? 'step' : undefined}
        >
          <span className="step-number">
            {hasLure ? <Check size={18} aria-label={t('Complete')} /> : '1'}
          </span>
          <div>
            <h2>{t('Add a lure')}</h2>
            <p>{t('Save its name, brand, type, and length.')}</p>
          </div>
        </li>
        <li className={hasLure ? 'is-current' : ''} aria-current={hasLure ? 'step' : undefined}>
          <span className="step-number">2</span>
          <div>
            <h2>{t('Log a catch')}</h2>
            <p>{t('Choose that lure and record your fish.')}</p>
          </div>
        </li>
      </ol>
      <Button asChild>
        <Link to={hasLure ? '/catches/new' : `/lures/new${catchEntry ? '?next=catch' : ''}`}>
          {hasLure ? <Fish size={18} /> : <Plus size={18} />}
          {t(hasLure ? 'Log your first catch' : 'Add your first lure')}
          <ArrowRight size={18} />
        </Link>
      </Button>
    </section>
  );
}
