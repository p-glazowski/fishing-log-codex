import { t, useTranslation } from '../../lib/i18n';
import { Link } from 'react-router-dom';
import { ArrowRight, Fish, BookOpen, ChartNoAxesCombined } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Button } from '../ui/button';
const features = [
  {
    number: '01',
    Icon: Fish,
    title: 'A place for every lure.',
    text: 'Model, size, color, and the small details that matter. Search your collection and find the right lure before your next trip.',
    label: 'Your collection',
    path: '/lures',
  },
  {
    number: '02',
    Icon: BookOpen,
    title: 'More than a fish photo.',
    text: 'The lure you used. The weather that morning. The stretch of water. Keep the whole story together, one catch at a time.',
    label: 'Your fishing journal',
    path: '/catches',
  },
  {
    number: '03',
    Icon: ChartNoAxesCombined,
    title: 'Learn from your own water.',
    text: 'See which lures deliver, the species you catch, and how your fishing changes through the seasons. All from your own records.',
    label: 'Your fishing insights',
    path: '/dashboard',
  },
];
export function LandingFeatures() {
  useTranslation();

  const { user, loading, error } = useAuth();
  return (
    <section className="features-section" id="features">
      <div className="section-intro">
        <span className="eyebrow">{t('LESS TO REMEMBER. MORE TO DISCOVER.')}</span>
        <h2>
          {t('Your fishing life,')}
          <br />
          {t('all connected.')}
        </h2>
        <p>{t('A practical companion for the time between casts.')}</p>
      </div>
      <div className="feature-rows">
        {features.map(({ number, Icon, title, text, label, path }) => (
          <article className="feature-row" key={number}>
            <span className="feature-number">/{number}</span>
            <Icon className="feature-icon" size={28} />
            <div>
              <h3>{t(title)}</h3>
              <p>{t(text)}</p>
            </div>
            {!loading && !error && (
              <Link to={user ? path : '/register'} className="feature-link" aria-label={t(label)}>
                <ArrowRight size={22} />
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
export function LandingSteps() {
  useTranslation();

  return (
    <section className="how-section" id="how">
      <div>
        <span className="eyebrow">{t('SIMPLE BY NATURE')}</span>
        <h2>
          {t('A record worth')}
          <br />
          {t('coming back to.')}
        </h2>
        <p>
          {t('Built around fishing, with just enough structure to keep the important details.')}
        </p>
      </div>
      <ol className="steps">
        {[
          ['01', t('Add your go-to lures'), t('Save the model, size, color, and a photo.')],
          [
            '02',
            t('Make a catch. Keep the moment.'),
            t('Log your fish and connect it to the lure you used.'),
          ],
          [
            '03',
            t('Find what works for you'),
            t('Look back at your catches and take that experience into your next trip.'),
          ],
        ].map(([number, title, text]) => (
          <li key={number}>
            <span>{number}</span>
            <div>
              <h3>{t(title)}</h3>
              <p>{t(text)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function LandingCallToAction() {
  useTranslation();

  const { user, loading, error } = useAuth();
  return (
    <section className="landing-cta">
      <div>
        <span className="eyebrow">{t('THE NEXT CHAPTER IS YOURS')}</span>
        <h2>
          {t('Make a little room')}
          <br />
          {t('for your next great catch.')}
        </h2>
        <p>
          {user
            ? t('Your collection and fishing journal are ready when you are.')
            : t('Start with your favorite lure. The rest follows.')}
        </p>
      </div>
      {!loading && !error && (
        <Button asChild>
          <Link to={user ? '/dashboard' : '/register'}>
            {user ? t('Back to your fishing log') : t('Create your free account')}
            <ArrowRight size={18} />
          </Link>
        </Button>
      )}
    </section>
  );
}
