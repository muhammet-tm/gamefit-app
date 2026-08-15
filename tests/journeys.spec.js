import { test, expect, waitForCaptcha } from './fixtures.js';

/**
 * Critical user journeys that do not require an account, each with its
 * realistic failure states as well as its happy path.
 *
 * The journeys behind auth live in authed.spec.js, which skips itself when no
 * QA credentials are configured.
 */

test.describe('journey: arriving at the app', () => {
  test('the splash screen sends a logged-out visitor to sign in', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // The splash holds for 2.5s by design before routing.
    await page.waitForURL('**/login', { timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('the sign-in form is reachable and labelled', async ({ page }) => {
    await page.goto('/login');
    // Role-based selectors, so the test survives restyling. These pass only
    // because the inputs carry accessible names; they had placeholders alone,
    // which a screen reader does not reliably announce.
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });
});

test.describe('journey: signing in — failure states', () => {
  test('wrong credentials show an error and keep the user on the page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email address' }).fill('nobody@example.com');
    await page.getByLabel('Password', { exact: true }).fill('definitely-not-the-password');
    await waitForCaptcha(page);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // Either a visible error, or still on /login. What must NOT happen is
    // silently landing on the dashboard.
    await page.waitForTimeout(4000);
    expect(page.url(), 'bad credentials reached the dashboard').not.toContain('/dashboard');
  });

  test('the browser blocks submission of a malformed email', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email address' }).fill('not-an-email');
    await page.getByLabel('Password', { exact: true }).fill('somepassword');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    const invalid = await page
      .getByRole('textbox', { name: 'Email address' })
      .evaluate((el) => !el.validity.valid);
    expect(invalid, 'type=email validation is not applied').toBe(true);
  });

  test('the password can be revealed and re-hidden', async ({ page }) => {
    await page.goto('/login');
    const field = page.getByLabel('Password', { exact: true });
    await field.fill('hunter2');
    await expect(field).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  });

  test('the network being down does not white-screen the sign-in page', async ({ page, consoleErrors }) => {
    await page.goto('/login');
    await page.route('**/auth/v1/**', (route) => route.abort('failed'));
    await page.getByRole('textbox', { name: 'Email address' }).fill('someone@example.com');
    await page.getByLabel('Password', { exact: true }).fill('somepassword12');
    await waitForCaptcha(page);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForTimeout(3000);
    // The form must still be there — an unhandled rejection that unmounts the
    // tree is the failure this guards against.
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    expect(consoleErrors.filter((e) => /Uncaught/.test(e))).toHaveLength(0);
  });
});

test.describe('captcha', () => {
  // Supabase rejects sign-in, sign-up and password reset without a token, so
  // a form that does not render the widget is a form nobody can submit.
  for (const route of ['/login', '/register', '/forgot-password']) {
    test(`${route} renders a captcha and resolves it`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByTestId('turnstile')).toBeVisible();
      await waitForCaptcha(page);
    });
  }

  test('a second attempt after a failure gets a fresh token', async ({ page }) => {
    // The single-use trap: Supabase redeems the token when it verifies it, so
    // reusing it fails with a captcha error that has nothing to do with what
    // the user typed. Without the reset in the submit handler, the second
    // sign-in attempt on this page would be unfixable by the user.
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email address' }).fill('nobody@example.com');
    await page.getByLabel('Password', { exact: true }).fill('wrong-password-one');
    await waitForCaptcha(page);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // After the attempt the widget must go back to a ready state on its own.
    await waitForCaptcha(page);
    expect(page.url()).toContain('/login');
  });

  test('the OTP screen carries its own captcha for Resend', async ({ page, browserName }) => {
    // Supabase gates /resend behind captcha exactly like /signup. The widget
    // lives in the sign-up branch of Register, which unmounts once the OTP
    // screen appears — so without a second widget here, "Resend" is a dead end
    // for the one user who needs it: the one whose email never arrived.
    //
    // Reaching that screen needs a successful signUp, which is stubbed rather
    // than really made: the suite does not write to the live project.
    //
    // WebKit is skipped because it does not honour the stub. Verified rather
    // than assumed — with an identical URL and pattern the handler fires in
    // Chromium and never fires in WebKit, so the call escapes to the real
    // Supabase project. A test that quietly signs up a user on every CI run is
    // worse than one that does not run, so this asserts the stub took effect
    // and skips where it cannot.
    test.skip(
      browserName === 'webkit',
      'Playwright does not intercept this cross-origin auth POST in WebKit',
    );

    let stubbed = false;
    await page.route('**/auth/v1/signup*', (route) => {
      stubbed = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'stub-user', email: 'nobody@example.com' }),
      });
    });

    await page.goto('/register');
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password', { exact: true }).fill('a-good-password-12');
    await page.getByLabel('Confirm Password').fill('a-good-password-12');
    await waitForCaptcha(page);
    await page.getByRole('button', { name: 'Create account' }).click();

    // On the OTP screen now: Resend is present, and so is a live captcha.
    await expect(page.getByRole('button', { name: 'Resend' })).toBeVisible();
    await expect(page.getByTestId('turnstile')).toBeVisible();
    await waitForCaptcha(page);

    // If interception ever silently stops working, fail here rather than let
    // the suite create real accounts on the production project.
    expect(stubbed, 'the signup call escaped to the real Supabase project').toBe(true);
  });
});

test.describe('journey: creating an account', () => {
  test('the sign-up form asks for the profile fields it needs', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await expect(page.getByRole('textbox', { name: 'First name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Last name' })).toBeVisible();
    await expect(page.getByLabel('Age')).toBeVisible();
    await expect(page.getByLabel('Fitness goal')).toBeVisible();
  });

  test('an empty sign-up cannot be submitted', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/login');
  });
});

test.describe('journey: the legal and compliance surface', () => {
  // Google Play requires a reachable web page for account deletion, and both
  // stores require privacy and terms URLs. If any of these 404s, a store
  // submission is rejected — so they are worth a test rather than a memory.
  for (const [route, heading] of [
    ['/privacy', /privacy/i],
    ['/terms', /terms/i],
    ['/delete-account', /delete/i],
  ]) {
    test(`${route} loads with real content`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
      const len = (await page.locator('body').innerText()).trim().length;
      expect(len, `${route} looks empty`).toBeGreaterThan(400);
    });
  }

  test('the legal pages are still marked as drafts', async ({ page }) => {
    // These have not been through legal review. If that banner is removed, it
    // should be a deliberate act with the review actually done — not a tidy-up.
    await page.goto('/privacy');
    await expect(page.locator('body')).toContainText(/draft/i);
  });
});

test.describe('journey: premium is not sold inside the native shells', () => {
  test('the web build does offer an upgrade path', async ({ page }) => {
    await page.goto('/premium');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Apple 3.1.1 and the Play equivalent forbid selling digital goods outside
    // their billing inside an app. The web is where GameFit sells, so purchase
    // UI must exist here and be hidden only under Capacitor.
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/premium|upgrade|month|year/i);
  });
});

test.describe('accessibility basics', () => {
  test('the app is usable at a phone width without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    for (const route of ['/login', '/privacy', '/definitely-not-a-real-route']) {
      await page.goto(route);
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflows, `${route} scrolls sideways at 360px`).toBe(false);
    }
  });

  test('keyboard focus reaches the sign-in controls', async ({ page }) => {
    await page.goto('/login');
    // Routes are lazy-loaded, so `load` fires before the form exists. Tabbing
    // at that point moves focus around an empty shell.
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    await page.keyboard.press('Tab');
    const tag = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A', 'SELECT']).toContain(tag);
  });
});
