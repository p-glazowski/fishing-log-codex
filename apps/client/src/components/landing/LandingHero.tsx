import { t, useTranslation } from '../../lib/i18n';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Button } from '../ui/button';
export function LandingHero() {
  useTranslation();

  const { user, loading, error } = useAuth();
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">{t('A FISHING JOURNAL FOR ANGLERS')}</span>
        <h1>
          {t('Every lure')}
          <br />
          {t('has a story.')}
          <br />
          <em>{t('Track yours.')}</em>
        </h1>
        <p>
          {t('Organize your lures, record your catches, and discover what works on the water.')}
        </p>
        <div className="hero-actions">
          {!loading && !error && (
            <Button asChild>
              <Link to={user ? '/dashboard' : '/register'}>
                {user ? t('Open your fishing log') : t('Create your free account')}
                <ArrowRight size={18} />
              </Link>
            </Button>
          )}
          <a href="#how" className="hero-explore">
            {t('See how it works')}
            <ArrowUpRight size={16} />
          </a>
        </div>
        <span className="hero-assurance">
          <ShieldCheck size={16} />
          {t('Your collection is private. Your stories stay yours.')}
        </span>
        {user && (
          <Link to="/catches/new" className="welcome-link">
            {t('Welcome back, {{name}}.', { name: user.name.split(' ')[0] })} {t('Log catch')} →
          </Link>
        )}
      </div>
      <figure className="field-guide">
        <div className="field-guide-heading">
          <span>{t('THE TACKLE RECORD')}</span>
          <span>{t('FIELD GUIDE / 01')}</span>
        </div>
        <div className="field-guide-art">
          <img
            className="hero-tackle-image"
            src="/images/tackle-box-hero.webp"
            srcSet="/images/tackle-box-hero-640.webp 640w, /images/tackle-box-hero.webp 1280w"
            sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) 480px, 50vw"
            width={1280}
            height={853}
            alt={t(
              'An open tackle box filled with silver minnows, colorful crankbaits, and soft plastic fishing lures.',
            )}
            fetchPriority="high"
          />
        </div>
        <figcaption>
          <span className="eyebrow">{t('FROM YOUR TACKLE BOX TO YOUR JOURNAL')}</span>
          <h2>
            {t('Good tackle.')}
            <br />
            {t('Better memories.')}
          </h2>
          <p>{t('Keep the lure, the conditions, and the catch connected.')}</p>
        </figcaption>
      </figure>
    </section>
  );
}
