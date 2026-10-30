import { LanguageSelect } from '../components/settings/LanguageSettings';
import { t, useTranslation } from '../lib/i18n';
import { Logo } from '../components/branding/Logo';
import { LandingNavigation } from '../components/navigation/LandingNavigation';
import { LandingHero } from '../components/landing/LandingHero';
import {
  LandingFeatures,
  LandingPreview,
  LandingSteps,
  LandingCallToAction,
} from '../components/landing/LandingSections';
export default function Landing() {
  useTranslation();

  return (
    <div className="landing">
      <a className="skip-link" href="#landing-content">
        {t('Skip to content')}
      </a>
      <LandingNavigation />
      <main id="landing-content">
        <LandingHero />
        <LandingPreview />
        <LandingFeatures />
        <LandingSteps />
        <LandingCallToAction />
      </main>
      <footer className="landing-footer">
        <Logo />
        <span>{t('A personal record of a life on the water.')}</span>
        <small>© {new Date().getFullYear()} LureLog</small>
        <LanguageSelect />
      </footer>
    </div>
  );
}
