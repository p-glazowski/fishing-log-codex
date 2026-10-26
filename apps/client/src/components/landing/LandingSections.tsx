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
  const { user, loading, error } = useAuth();
  return (
    <section className="features-section" id="features">
      <div className="section-intro">
        <span className="eyebrow">LESS TO REMEMBER. MORE TO DISCOVER.</span>
        <h2>
          Your fishing life,
          <br />
          all connected.
        </h2>
        <p>A practical companion for the time between casts.</p>
      </div>
      <div className="feature-rows">
        {features.map(({ number, Icon, title, text, label, path }) => (
          <article className="feature-row" key={number}>
            <span className="feature-number">/{number}</span>
            <Icon className="feature-icon" size={28} />
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            {!loading && !error && (
              <Link to={user ? path : '/register'} className="feature-link" aria-label={label}>
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
  return (
    <section className="how-section" id="how">
      <div>
        <span className="eyebrow">SIMPLE BY NATURE</span>
        <h2>
          A record worth
          <br />
          coming back to.
        </h2>
        <p>Built around fishing, with just enough structure to keep the important details.</p>
      </div>
      <ol className="steps">
        {[
          ['01', 'Add your go-to lures', 'Save the model, size, color, and a photo.'],
          [
            '02',
            'Make a catch. Keep the moment.',
            'Log your fish and connect it to the lure you used.',
          ],
          [
            '03',
            'Find what works for you',
            'Look back at your catches and take that experience into your next trip.',
          ],
        ].map(([number, title, text]) => (
          <li key={number}>
            <span>{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function LandingCallToAction() {
  const { user, loading, error } = useAuth();
  return (
    <section className="landing-cta">
      <div>
        <span className="eyebrow">THE NEXT CHAPTER IS YOURS</span>
        <h2>
          Make a little room
          <br />
          for your next great catch.
        </h2>
        <p>
          {user
            ? 'Your collection and fishing journal are ready when you are.'
            : 'Start with your favorite lure. The rest follows.'}
        </p>
      </div>
      {!loading && !error && (
        <Button asChild>
          <Link to={user ? '/dashboard' : '/register'}>
            {user ? 'Back to your fishing space' : 'Create your free account'}
            <ArrowRight size={18} />
          </Link>
        </Button>
      )}
    </section>
  );
}
