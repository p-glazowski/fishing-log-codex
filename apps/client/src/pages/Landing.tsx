import { Logo } from '../components/branding/Logo';
import { LandingNavigation } from '../components/navigation/LandingNavigation';
import { LandingHero } from '../components/landing/LandingHero';
import {
  LandingFeatures,
  LandingSteps,
  LandingCallToAction,
} from '../components/landing/LandingSections';
export default function Landing() {
  return (
    <div className="landing">
      <a className="skip-link" href="#landing-content">
        Skip to content
      </a>
      <LandingNavigation />
      <main id="landing-content">
        <LandingHero />
        <div className="landing-index">
          <span>01 / ORGANIZE YOUR TACKLE</span>
          <span>02 / RECORD YOUR CATCHES</span>
          <span>03 / FIND YOUR PATTERNS</span>
        </div>
        <LandingFeatures />
        <LandingSteps />
        <LandingCallToAction />
      </main>
      <footer className="landing-footer">
        <Logo />
        <span>A personal record of a life on the water.</span>
        <small>© {new Date().getFullYear()} LureLog</small>
      </footer>
    </div>
  );
}
