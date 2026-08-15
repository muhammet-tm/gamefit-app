import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for GameFit.
 *
 * Tests run against the PRODUCTION build (`vite preview`), not the dev server.
 * The two differ in the ways that matter here: the dev server does not code
 * split, does not run the SEO-file generation plugin, and does not substitute
 * VITE_SITE_URL into index.html. Testing the dev server would pass while the
 * thing users receive was broken.
 */
const PORT = Number(process.env.E2E_PORT) || 4173;
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  // Fail the build if a test was accidentally committed with .only on it.
  forbidOnly: isCI,
  // One retry locally to absorb genuine flake; two in CI where machines are
  // slower and noisier. A test that only passes on retry still shows as
  // flaky in the report rather than silently green.
  retries: isCI ? 2 : 1,
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    // Keep a trace for anything that fails, so a CI failure can be replayed
    // locally in the trace viewer instead of guessed at from a log line.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // GameFit is mobile-first and this is where most of its users are.
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Only start a server when pointing at localhost. Set E2E_BASE_URL to run
  // the same suite against a deployed environment.
  webServer: BASE_URL.includes('localhost')
    ? {
        command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
        url: BASE_URL,
        // Never reuse: a stale `vite preview` left running from an earlier
        // build serves old output, and the suite passes against code that is
        // not the code under test. Better to fail loudly on a port clash.
        reuseExistingServer: false,
        timeout: 180_000,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : undefined,
});
