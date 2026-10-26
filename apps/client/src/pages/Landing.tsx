import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Fish,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  Compass,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from '../components/Layout';
import { Button } from '../components/ui/button';
import { LureArt } from '../components/common';
export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <nav>
          <a href="#features">The experience</a>
          <a href="#how">How it works</a>
          <Link to="/login">Sign in</Link>
          <Button asChild size="sm">
            <Link to="/register">
              Start your log <ArrowUpRight size={15} />
            </Link>
          </Button>
        </nav>
      </header>
      <main>
        <section className="hero">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="hero-badge">
              <span className="live-dot" /> FOR THE LOVE OF FISHING
            </span>
            <h1>
              Every lure
              <br />
              has a story.
              <br />
              <em>Track yours.</em>
            </h1>
            <p>
              Organize your fishing lures, record every catch, and discover what brings you back to
              the water.
            </p>
            <div className="hero-actions">
              <Button asChild>
                <Link to="/register">
                  Start your fishing story <ArrowRight size={18} />
                </Link>
              </Button>
              <a href="#features" className="hero-explore">
                Explore LureLog <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="hero-notes">
              <span>
                <Check size={15} /> Free to get started
              </span>
              <span>
                <Check size={15} /> Your own private collection
              </span>
            </div>
          </motion.div>
          <div className="hero-scene">
            <div className="scene-landscape">
              <div className="scene-sun" />
              <div className="mountain mountain-back" />
              <div className="mountain mountain-front" />
              <div className="scene-water" />
              <div className="scene-caption">
                <Compass size={18} /> LESS SCROLLING. MORE CASTING.
              </div>
            </div>
            <div className="hero-lure-card">
              <div className="hero-card-top">
                <span>YOUR TACKLE. ALL TOGETHER.</span>
                <Fish size={19} />
              </div>
              <LureArt />
              <div className="hero-card-content">
                <span className="brand">BUILT AROUND YOUR COLLECTION</span>
                <h3>Find your next lucky lure.</h3>
                <p>Every detail. Every catch. One place.</p>
                <div className="hero-card-pills">
                  <span>Collection</span>
                  <span>Catch journal</span>
                  <span>Insights</span>
                </div>
              </div>
            </div>
            <div className="floating-note">
              <span>
                <BookOpen size={20} />
              </span>
              <div>
                <strong>Great catches deserve a story.</strong>
                <small>Make room for your next one.</small>
              </div>
            </div>
          </div>
        </section>
        <div className="landing-strip">
          <span>FOR EARLY STARTS.</span>
          <span>FOR ONE MORE CAST.</span>
          <span>FOR THE STORIES THAT STAY.</span>
          <Fish size={25} />
        </div>
        <section className="features-section" id="features">
          <div className="section-intro">
            <span className="eyebrow">MORE THAN A TACKLE BOX</span>
            <h2>
              A little more organized.
              <br />A lot more connected.
            </h2>
            <p>
              All the details that make your fishing yours,
              <br />
              thoughtfully brought together.
            </p>
          </div>
          <div className="feature-grid">
            {[
              [
                Fish,
                'Your collection, beautifully kept.',
                'Give every lure a home. Save the details, find your favorites, and know exactly what’s in your tackle box.',
              ],
              [
                BookOpen,
                'Small details. Lasting memories.',
                'Keep photos, locations, species, and the lure that made it happen in a journal that grows with you.',
              ],
              [
                ChartNoAxesCombined,
                'Discover what works for you.',
                'See your most successful lures, seasonal patterns, and favorite species through your own fishing data.',
              ],
            ].map(([Icon, title, copy]) => {
              const I = Icon as typeof Fish;
              return (
                <article key={String(title)}>
                  <span className="feature-icon">
                    <I size={26} />
                  </span>
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section className="how-section" id="how">
          <div>
            <span className="eyebrow">SIMPLE BY NATURE</span>
            <h2>
              From tackle box
              <br />
              to fishing story.
            </h2>
            <p>Less time organizing. More time doing what you love.</p>
          </div>
          <div className="steps">
            {[
              ['01', 'Add your go-to lures', 'Save the model, size, color, and a photo.'],
              [
                '02',
                'Make a catch. Keep the moment.',
                'Log your fish and connect it to the lure you used.',
              ],
              [
                '03',
                'Let your own experience guide you',
                'Find patterns and plan your next day on the water.',
              ],
            ].map(([n, t, c]) => (
              <div key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{c}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="landing-cta">
          <Fish size={34} />
          <h2>
            Your next great story
            <br />
            starts with a cast.
          </h2>
          <p>Bring your collection and catches together with LureLog.</p>
          <Button variant="outline" asChild>
            <Link to="/register">
              Create your free account <ArrowRight size={18} />
            </Link>
          </Button>
        </section>
      </main>
      <footer className="landing-footer">
        <Logo />
        <span>Made for the moments on the water.</span>
        <span>© {new Date().getFullYear()} LureLog</span>
      </footer>
    </div>
  );
}
