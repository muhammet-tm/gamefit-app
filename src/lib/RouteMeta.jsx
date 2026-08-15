import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SUFFIX = 'GameFit';

/**
 * Per-route <title> and meta description.
 *
 * A single-page app serves one index.html, so without this every screen in
 * the app shares the one title baked into that file. That costs three things:
 * browser tabs and history entries are indistinguishable, screen readers
 * announce the same page name on every navigation, and any crawler that runs
 * JavaScript sees a set of pages it cannot tell apart.
 *
 * Keyed by exact path first, then longest matching prefix, so /train/session
 * inherits /train.
 */
const META = {
  '/': ['Fitness, Gamified', 'Turn workouts into an RPG: earn XP, keep streaks, evolve your avatar and train with an AI coach.'],
  '/login': ['Sign in', 'Sign in to your GameFit account to log workouts, keep your streak and track your rank.'],
  '/register': ['Create your account', 'Create a free GameFit account and start earning XP for every workout.'],
  '/forgot-password': ['Reset your password', 'Request a password reset link for your GameFit account.'],
  '/reset-password': ['Choose a new password', 'Set a new password for your GameFit account.'],
  '/onboarding': ['Set up your athlete', 'Pick your class, set a weekly target and build your avatar.'],
  '/dashboard': ['Dashboard', 'Your XP, streak, rank and weekly progress at a glance.'],
  '/train': ['Train', 'Log a workout and earn XP, coins and streak credit.'],
  '/coach': ['Coach G', 'Ask Coach G for a workout plan, a meal plan or training advice.'],
  '/leaderboard': ['Leaderboard', 'See where you rank against other GameFit athletes.'],
  '/marketplace': ['Marketplace', 'Spend your coins on gear and accessories for your avatar.'],
  '/avatar': ['Your avatar', 'Evolve your avatar through five classes and five tiers as you rank up.'],
  '/profile': ['Profile', 'Your account, stats, badges and settings.'],
  '/monthly-summary': ['Monthly summary', 'Your training month in numbers.'],
  '/premium': ['Premium', 'Unlock unlimited AI coaching and meal photo analysis with GameFit Premium.'],
  '/admin': ['Admin', 'GameFit administration.'],
  '/terms': ['Terms of Service', 'The terms that govern your use of GameFit.'],
  '/privacy': ['Privacy Policy', 'How GameFit collects, uses and protects your data.'],
  '/delete-account': ['Delete your account', 'Permanently delete your GameFit account and all associated data.'],
  '/strava/callback': ['Connecting Strava', 'Finishing your Strava connection.'],
};

function lookup(pathname) {
  if (META[pathname]) return META[pathname];
  let best = null;
  for (const key of Object.keys(META)) {
    if (key !== '/' && pathname.startsWith(key + '/')) {
      if (!best || key.length > best.length) best = key;
    }
  }
  return best ? META[best] : null;
}

export default function RouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const hit = lookup(pathname);
    const [title, description] = hit ?? ['Page not found', 'That page does not exist on GameFit.'];

    document.title = pathname === '/' ? `${SUFFIX} — ${title}` : `${title} — ${SUFFIX}`;

    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', description);

    // Keep the canonical pointing at the route actually being viewed, not at
    // the home page it was baked with at build time.
    let link = document.querySelector('link[rel="canonical"]');
    if (link) {
      const origin = link.getAttribute('href')?.replace(/\/+$/, '').replace(/^(https?:\/\/[^/]+).*$/, '$1');
      if (origin) link.setAttribute('href', origin + (pathname === '/' ? '/' : pathname));
    }
  }, [pathname]);

  return null;
}
