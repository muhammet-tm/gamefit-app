import { test, expect, waitForCaptcha } from './fixtures';
import { dubaiDay } from '../src/lib/activityDay.js';

/**
 * Retention measurement: the app tells the server "this signed-in user opened
 * the app today", once per Dubai day (src/lib/appOpen.js).
 *
 * The rule itself is unit-tested in tests/unit/activity-day.test.mjs. What
 * only a browser can show is that the real app fires it: that the Supabase
 * auth events it listens for are the ones that actually arrive.
 *
 * Every Supabase call is stubbed. The suite must not sign in to, or write to,
 * the live project, and the function this calls may not exist there yet.
 */

const USER_ID = '00000000-0000-4000-8000-0000000000aa';

// Shaped like a real access token so the client accepts it. Signed with
// nothing: no server ever sees it, because every request is intercepted.
function fakeSession() {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const user = {
    id: USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'stub-user@example.test',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  return {
    access_token: [
      b64({ alg: 'HS256', typ: 'JWT' }),
      b64({ sub: USER_ID, role: 'authenticated', aud: 'authenticated', exp: now + 3600, iat: now }),
      'stub-signature',
    ].join('.'),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: 'stub-refresh-token',
    user,
  };
}

async function stubSupabase(page) {
  const seen = { token: 0, appOpen: 0, appOpenBodies: [] };
  const session = fakeSession();
  const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

  // Registered first, so it only catches what the specific routes below miss.
  await page.route(/\/(rest|auth|functions|storage)\/v1\//, (route) => route.fulfill(json([])));

  await page.route(/\/auth\/v1\/token/, (route) => {
    seen.token += 1;
    return route.fulfill(json(session));
  });
  await page.route(/\/auth\/v1\/user/, (route) => route.fulfill(json(session.user)));
  await page.route(/\/rest\/v1\/profiles/, (route) =>
    route.fulfill(
      json({
        id: USER_ID,
        email: session.user.email,
        first_name: 'Stub',
        last_name: 'User',
        onboarding_complete: true,
        role: 'user',
        account_type: 'regular',
        total_xp: 0,
        current_level: 1,
        total_coins_earned: 0,
        total_coins_spent: 0,
        current_streak: 0,
        best_streak: 0,
        badges: [],
        owned_accessories: [],
        connected_apps: [],
        avatar_config: {},
        weekly_goal: 3,
        created_at: new Date().toISOString(),
      }),
    ),
  );
  await page.route(/\/rest\/v1\/rpc\/record_app_open/, (route) => {
    seen.appOpen += 1;
    seen.appOpenBodies.push(route.request().postData());
    // The real function returns the server's Dubai date.
    return route.fulfill(json(dubaiDay()));
  });

  return seen;
}

test.describe('retention: reporting an app open', () => {
  // WebKit does not honour these cross-origin stubs (see the OTP test in
  // journeys.spec.js, where that was verified), so the calls would escape to
  // the real project. Chromium only, and the stubs are asserted to have fired.
  test.skip(
    ({ browserName }) => browserName === 'webkit',
    'Playwright does not intercept cross-origin Supabase calls in WebKit',
  );

  test('signing in reports one app open, and coming back the same day does not repeat it', async ({ page }) => {
    const seen = await stubSupabase(page);

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email address' }).fill('stub-user@example.test');
    await page.getByLabel('Password', { exact: true }).fill('not-a-real-password');
    await waitForCaptcha(page);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    expect(seen.token, 'the sign-in call escaped to the real Supabase project').toBeGreaterThan(0);

    // Reported at least once. Sign-in is followed by a full page load, which
    // can cut the first request short; the server ignores a repeat for the
    // same day, so one or two requests here are both correct.
    await expect.poll(() => seen.appOpen, { timeout: 15_000 }).toBeGreaterThan(0);
    const stored = () =>
      page.evaluate((key) => window.localStorage.getItem(key), `gf.app-open.${USER_ID}`);
    await expect.poll(stored, { timeout: 15_000 }).toBe(dubaiDay());

    // Nothing is sent: no user id and no date for a client to forge.
    for (const body of seen.appOpenBodies) {
      expect(body === null || body === '' || body === '{}').toBe(true);
    }

    // The app returns to the foreground later the same day: no new request.
    const settled = seen.appOpen;
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    expect(seen.appOpen, 'a second open on the same Dubai day must not call the server').toBe(settled);

    // The next Dubai day (simulated by ageing the remembered day): it reports again.
    await page.evaluate((key) => window.localStorage.setItem(key, '2000-01-01'), `gf.app-open.${USER_ID}`);
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect.poll(() => seen.appOpen, { timeout: 15_000 }).toBe(settled + 1);
  });

  test('a signed-out visit reports nothing', async ({ page }) => {
    const seen = await stubSupabase(page);
    await page.goto('/login');
    await waitForCaptcha(page);
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForTimeout(1500);
    expect(seen.appOpen).toBe(0);
  });
});
