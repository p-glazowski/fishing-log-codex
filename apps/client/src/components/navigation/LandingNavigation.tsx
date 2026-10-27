import { t, useTranslation } from '../../lib/i18n';
import { Link } from 'react-router-dom';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Logo } from '../branding/Logo';
import { Button } from '../ui/button';
import { ProfileMenu } from './ProfileMenu';
export function LandingNavigation() {
  useTranslation();

  const { user, loading, error, refresh } = useAuth();
  return (
    <header className="landing-nav">
      <Logo />
      <nav aria-label={t('Public navigation')}>
        <a className="landing-section-link" href="#features">
          {t('The experience')}
        </a>
        <a className="landing-section-link" href="#how">
          {t('How it works')}
        </a>
      </nav>
      <div className="landing-account">
        {loading ? (
          <span
            className="session-placeholder"
            role="status"
            aria-label={t('Checking your session')}
          />
        ) : error ? (
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw size={16} />
            {t('Retry session')}
          </Button>
        ) : user ? (
          <>
            <Button asChild size="sm">
              <Link to="/dashboard">
                {t('Your fishing log')}
                <ArrowUpRight size={16} />
              </Link>
            </Button>
            <ProfileMenu user={user} avatarLast />
          </>
        ) : (
          <>
            <Link className="sign-in-link" to="/login">
              {t('Sign in')}
            </Link>
            <Button asChild size="sm">
              <Link to="/register">
                {t('Start your log')}
                <ArrowUpRight size={16} />
              </Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
