import { Link } from 'react-router-dom';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Logo } from '../branding/Logo';
import { Button } from '../ui/button';
import { ProfileLink } from './ProfileLink';
export function LandingNavigation() {
  const { user, loading, error, refresh } = useAuth();
  return (
    <header className="landing-nav">
      <Logo />
      <nav aria-label="Public navigation">
        <a className="landing-section-link" href="#features">
          The experience
        </a>
        <a className="landing-section-link" href="#how">
          How it works
        </a>
      </nav>
      <div className="landing-account">
        {loading ? (
          <span className="session-placeholder" role="status" aria-label="Checking your session" />
        ) : error ? (
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw size={16} />
            Retry session
          </Button>
        ) : user ? (
          <>
            <Button asChild size="sm">
              <Link to="/dashboard">
                Your fishing log
                <ArrowUpRight size={16} />
              </Link>
            </Button>
            <ProfileLink user={user} avatarLast />
          </>
        ) : (
          <>
            <Link className="sign-in-link" to="/login">
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link to="/register">
                Start your log
                <ArrowUpRight size={16} />
              </Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
