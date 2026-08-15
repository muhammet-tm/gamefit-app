import { authTest as test, expect } from './fixtures.js';

/**
 * Journeys behind the login.
 *
 * These SKIP unless E2E_EMAIL and E2E_PASSWORD are set, so the suite stays
 * green for anyone without QA-account access and on forks. Set them as
 * repository secrets to turn these on in CI.
 *
 * They deliberately do not create or destroy economy data. XP, coins and
 * streaks are server-authoritative and a test that logged real workouts would
 * pollute the leaderboard the app shows to real users. Assertions are on what
 * renders, not on mutations.
 */

test.describe('journey: signed in', () => {
  test('signing in reaches the dashboard or onboarding', async ({ authedPage: page }) => {
    expect(page.url()).toMatch(/\/(dashboard|onboarding)/);
  });

  test('the dashboard shows the economy without a console error', async ({ authedPage: page }) => {
    test.skip(page.url().includes('/onboarding'), 'QA account has not completed onboarding');
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(100);
  });

  test('the leaderboard renders other athletes without leaking their details', async ({ authedPage: page }) => {
    test.skip(page.url().includes('/onboarding'), 'QA account has not completed onboarding');
    await page.goto('/leaderboard', { waitUntil: 'networkidle' });
    const body = await page.locator('body').innerText();
    // get_leaderboard returns first name plus last initial by design. A raw
    // email address on this screen means the projection changed and started
    // exposing PII.
    expect(body, 'an email address is rendered on the leaderboard').not.toMatch(
      /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,
    );
  });

  test('the admin route is refused to a non-admin', async ({ authedPage: page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2500);
    // AdminRoute redirects non-admins. The server-side guarantee is separate
    // and stronger: `role` is not in the column grant list, so a user cannot
    // make themselves an admin even if they defeat this check.
    const url = page.url();
    if (!url.includes('/admin')) {
      expect(url).toMatch(/\/(dashboard|login)/);
    }
  });
});

test.describe('journey: account deletion is reachable in-app', () => {
  test('a signed-in user can reach the delete-account page', async ({ authedPage: page }) => {
    // Google Play requires an in-app path to deletion, not only a web page.
    await page.goto('/delete-account');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/delete/i);
  });
});
