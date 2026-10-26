import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Ruler, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Button } from '../ui/button';
import { LureArt } from '../common';
export function LandingHero() {
  const { user, loading, error } = useAuth();
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">A FIELD JOURNAL FOR ANGLERS</span>
        <h1>
          Every lure
          <br />
          has a story.
          <br />
          <em>Track yours.</em>
        </h1>
        <p>
          Your tackle box, thoughtfully organized. Your catches, remembered in detail. A personal
          record of what works on the water.
        </p>
        <div className="hero-actions">
          {!loading && !error && (
            <Button asChild>
              <Link to={user ? '/dashboard' : '/register'}>
                {user ? 'Open your workspace' : 'Start your fishing story'}
                <ArrowRight size={18} />
              </Link>
            </Button>
          )}
          <a href="#how" className="hero-explore">
            See how it works
            <ArrowUpRight size={16} />
          </a>
        </div>
        <span className="hero-assurance">
          <ShieldCheck size={16} />
          Your collection is private. Your stories stay yours.
        </span>
        {user && (
          <Link to="/catches/new" className="welcome-link">
            Welcome back, {user.name.split(' ')[0]}. Log your next catch →
          </Link>
        )}
      </div>
      <figure className="field-guide">
        <div className="field-guide-heading">
          <span>THE TACKLE RECORD</span>
          <span>FIELD GUIDE / 01</span>
        </div>
        <div className="field-guide-art">
          <span className="guide-type">MINNOW</span>
          <LureArt type="Minnow" />
          <span className="guide-measure">
            <Ruler size={16} />
            Know every detail.
          </span>
        </div>
        <figcaption>
          <span className="eyebrow">FROM YOUR TACKLE BOX TO YOUR JOURNAL</span>
          <h2>
            Good tackle.
            <br />
            Better memories.
          </h2>
          <p>Keep the lure, the conditions, and the catch connected.</p>
          <span className="guide-caption">Lure illustration · Your own photos take its place.</span>
        </figcaption>
      </figure>
    </section>
  );
}
