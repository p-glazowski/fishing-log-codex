import { Link } from 'react-router-dom';
import { Check, Fish, Plus, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../ui/button';

export function FirstSteps({
  hasLure = false,
  catchEntry = false,
  preview = false,
  previewLink = '/register',
  showAction = true,
}: {
  hasLure?: boolean;
  catchEntry?: boolean;
  preview?: boolean;
  previewLink?: string;
  showAction?: boolean;
}) {
  const { t } = useTranslation();
  const Heading = preview ? 'h3' : 'h1';
  const StepHeading = preview ? 'h4' : 'h2';
  return (
    <section
      className="first-steps"
      aria-labelledby={preview ? 'preview-steps-title' : 'first-steps-title'}
    >
      <div>
        <span className="eyebrow">{t('GET STARTED')}</span>
        <Heading id={preview ? 'preview-steps-title' : 'first-steps-title'}>
          {t(hasLure ? 'Your lure is ready. Log your first catch.' : 'First, add a lure.')}
        </Heading>
        <p>{t('Every catch is linked to a lure in your collection.')}</p>
      </div>
      <ol className="first-steps-list">
        <li
          className={hasLure ? 'is-complete' : 'is-current'}
          aria-current={!hasLure ? 'step' : undefined}
        >
          <span className="step-number">
            {hasLure ? <Check size={18} aria-label={t('Complete')} /> : '1'}
          </span>
          <div>
            <StepHeading>{t('Add a lure')}</StepHeading>
            <p>{t('Save its name, brand, type, and length.')}</p>
          </div>
        </li>
        <li className={hasLure ? 'is-current' : ''} aria-current={hasLure ? 'step' : undefined}>
          <span className="step-number">2</span>
          <div>
            <StepHeading>{t('Log a catch')}</StepHeading>
            <p>{t('Choose that lure and record your fish.')}</p>
          </div>
        </li>
      </ol>
      {showAction && (
        <Button asChild>
          <Link
            to={
              preview
                ? previewLink
                : hasLure
                  ? '/catches/new'
                  : `/lures/new${catchEntry ? '?next=catch' : ''}`
            }
          >
            {hasLure ? <Fish size={18} /> : <Plus size={18} />}
            {t(hasLure ? 'Log your first catch' : 'Add your first lure')}
            <ArrowRight size={18} />
          </Link>
        </Button>
      )}
    </section>
  );
}
