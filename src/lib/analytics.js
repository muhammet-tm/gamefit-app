// Product analytics (PostHog) + error monitoring (Sentry).
// Both are opt-in via env: without keys everything is a silent no-op, so
// local dev and preview builds send nothing.
import * as Sentry from '@sentry/react';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

let posthog = null;

export async function initAnalytics() {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
    });
  }
  if (POSTHOG_KEY) {
    const mod = await import('posthog-js');
    posthog = mod.default;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      persistence: 'localStorage',
      autocapture: false, // explicit events only — keeps data clean
    });
  }
}

/** Track a product event. Events are the funnel: signup → first workout → upgrade. */
export function track(event, properties = {}) {
  try {
    posthog?.capture(event, properties);
  } catch { /* analytics must never break the app */ }
}

export function identify(userId, traits = {}) {
  try {
    posthog?.identify(userId, traits);
    if (SENTRY_DSN) Sentry.setUser({ id: userId });
  } catch { /* ignore */ }
}

export function resetAnalytics() {
  try {
    posthog?.reset();
    if (SENTRY_DSN) Sentry.setUser(null);
  } catch { /* ignore */ }
}
