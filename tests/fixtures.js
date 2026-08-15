import { test as base, expect } from '@playwright/test';

/**
 * Shared fixtures.
 *
 * `noConsoleErrors` fails a test if the page logged an error or threw. This is
 * opt-out rather than opt-in on purpose: a console error that nobody asserts
 * on is a bug nobody is looking at. Known-noisy messages are filtered by
 * pattern below, and every entry needs a reason.
 */
const IGNORED_CONSOLE = [
  // Analytics and monitoring are env-gated no-ops without keys; the SDKs warn
  // about the missing config on every page load in CI.
  /posthog/i,
  /sentry/i,
  // Supabase returns 401 for an unauthenticated session check on public pages,
  // which is the expected answer, not a failure.
  /Failed to load resource.*401/i,
];

export const test = base.extend({
  consoleErrors: async ({ page }, use) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
      errors.push(text);
    });
    page.on('pageerror', (err) => errors.push(`Uncaught: ${err.message}`));
    await use(errors);
  },
});

/**
 * Authenticated tests.
 *
 * Credentials come from E2E_EMAIL / E2E_PASSWORD. When they are absent the
 * auth-gated tests SKIP rather than fail, so a contributor without access to
 * the QA account can still run the rest of the suite and CI on a fork is not
 * permanently red. Set them as repository secrets to turn these on.
 */
export const authTest = test.extend({
  authedPage: async ({ page }, use) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    test.skip(!email || !password, 'E2E_EMAIL / E2E_PASSWORD not set');

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 });

    await use(page);
  },
});

export { expect };
