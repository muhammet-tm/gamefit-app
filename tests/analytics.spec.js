import { test, expect } from './fixtures.js';

/**
 * Vercel Web Analytics must never see a secret carried in a URL.
 *
 * The Strava callback arrives with ?code= and &state=, and auth links can carry
 * tokens in the query or the fragment. public/analytics-init.js installs a
 * beforeSend hook that strips both before a page view leaves the browser. The
 * insights script itself exists only on Vercel, so this tests the hook alone:
 * load the file, take the hook from the queue it leaves for Vercel's script,
 * and feed it the URLs that matter.
 */
test('the analytics hook strips query strings and fragments', async ({ page }) => {
  await page.goto('/privacy');
  await page.addScriptTag({ url: '/analytics-init.js' });

  const out = await page.evaluate(() => {
    const [name, beforeSend] = Array.from(window.vaq[0]);
    const send = (url) => beforeSend({ type: 'pageview', url });
    return {
      name,
      strava: send('https://gamefit-app.vercel.app/strava/callback?code=abc123&state=xyz#frag').url,
      token: send('https://gamefit-app.vercel.app/reset-password#access_token=secret&type=recovery').url,
      plain: send('https://gamefit-app.vercel.app/leaderboard').url,
      broken: send('not a url'),
    };
  });

  expect(out.name).toBe('beforeSend');
  expect(out.strava).toBe('https://gamefit-app.vercel.app/strava/callback');
  expect(out.token).toBe('https://gamefit-app.vercel.app/reset-password');
  expect(out.plain).toBe('https://gamefit-app.vercel.app/leaderboard');
  expect(out.broken).toBeNull();
});

test('local builds do not load the insights script', async ({ page }) => {
  // /_vercel/insights exists only on Vercel. Anywhere else the request would
  // fall through the SPA rewrite and return index.html, so the tags are added
  // only when VERCEL_ENV is production (vercelAnalytics() in vite.config.js).
  await page.goto('/');
  await expect(page.locator('script[src="/_vercel/insights/script.js"]')).toHaveCount(0);
  await expect(page.locator('script[src="/analytics-init.js"]')).toHaveCount(0);
});
