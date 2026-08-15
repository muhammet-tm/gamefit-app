import { test, expect } from './fixtures.js';

/**
 * The audit, encoded so it cannot quietly come back.
 *
 * Every assertion here corresponds to something that was actually wrong in
 * this app rather than a generic best-practice checklist: one title shared by
 * twenty routes, no h1 anywhere on the landing screen, a canonical pointing at
 * a domain that serves nothing, an unknown path answering 200, and a single
 * 1.8 MB script.
 */

const PUBLIC_ROUTES = [
  '/', '/login', '/register', '/forgot-password',
  '/privacy', '/terms', '/delete-account', '/premium',
];

test.describe('document metadata', () => {
  // These two walk every route in one test because the assertion is about the
  // SET of routes — that no two share a title — which cannot be checked one
  // route at a time. Eight navigations do not fit the default 45s budget.
  test.describe.configure({ timeout: 150_000 });

  test('every route has its own title', async ({ page }) => {
    const seen = new Map();
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);
      // The title is applied by RouteMeta after mount, not by the served HTML.
      // Waiting for a non-empty title is not enough: index.html ships a static
      // title that is byte-identical to the one RouteMeta gives '/', so a read
      // that lands before React's first commit returns the '/' title on every
      // route and this test reports a duplicate that does not exist. Waiting on
      // the marker RouteMeta publishes is exact. (Caught on WebKit, where the
      // gap is widest.)
      await expect(page.locator('html')).toHaveAttribute('data-route-meta', route);
      const title = await page.title();
      expect(title, `${route} has an empty title`).toBeTruthy();
      if (seen.has(title)) {
        throw new Error(
          `${route} reuses the title from ${seen.get(title)}: "${title}"`,
        );
      }
      seen.set(title, route);
    }
    expect(seen.size).toBe(PUBLIC_ROUTES.length);
  });

  test('every route has a description, and they are not all identical', async ({ page }) => {
    const descriptions = new Set();
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);
      // Same race as the title above: read before RouteMeta commits and every
      // route reports the description baked into index.html.
      await expect(page.locator('html')).toHaveAttribute('data-route-meta', route);
      const locator = page.locator('meta[name="description"]');
      await expect(locator).toHaveCount(1);
      const content = await locator.getAttribute('content');
      expect(content, `${route} has an empty description`).toBeTruthy();
      expect(content.length, `${route} description is too short`).toBeGreaterThan(30);
      descriptions.add(content);
    }
    expect(descriptions.size, 'all routes share one description').toBeGreaterThan(1);
  });

  // One test per route rather than a loop: a failure names the broken route in
  // the report instead of stopping the whole sweep at the first bad one.
  for (const route of PUBLIC_ROUTES) {
    test(`${route} has exactly one h1, with accessible text`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      const text = await page.locator('h1').innerText().catch(() => '');
      const alt = await page.locator('h1 img').getAttribute('alt').catch(() => null);
      expect(
        (text && text.trim().length > 0) || (alt && alt.trim().length > 0),
        `${route} h1 has no accessible text`,
      ).toBeTruthy();
    });
  }

  test('canonical points at this deployment, never at an unpointed domain', async ({ page, baseURL }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(href).toBeTruthy();
    // gamefit.online is not currently pointed anywhere. Until DNS is cut over,
    // a canonical naming it tells search engines the real page is a dead site.
    if (!baseURL.includes('gamefit.online')) {
      expect(href, 'canonical still hardcodes the unpointed domain').not.toContain('gamefit.online');
    }
    expect(href).toMatch(/^https?:\/\//);
  });

  test('social preview and structured data are present and self-consistent', async ({ page }) => {
    await page.goto('/');
    for (const sel of [
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:image"]',
      'meta[name="twitter:card"]',
    ]) {
      await expect(page.locator(sel), `${sel} missing`).toHaveCount(1);
    }
    const ld = await page.locator('script[type="application/ld+json"]').innerText();
    const parsed = JSON.parse(ld);
    expect(parsed['@type']).toBe('WebApplication');
    expect(parsed.url, 'JSON-LD url was not substituted at build time').not.toContain('%VITE');
  });

  test('the html element declares a language', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', /^[a-z]{2}/);
  });

  for (const route of PUBLIC_ROUTES) {
    test(`${route} has alt text on every image`, async ({ page }) => {
      await page.goto(route);
      const bad = await page.locator('img:not([alt])').count();
      expect(bad, `${route} has images with no alt attribute`).toBe(0);
    });
  }
});

test.describe('crawler files', () => {
  test('robots.txt is real, allows AI crawlers, and names the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('Sitemap:');
    expect(body).not.toContain('%VITE');
    // Blocking AI crawlers removes GameFit from AI-assisted search answers and
    // protects nothing: the app is behind a login.
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot']) {
      expect(body, `${bot} should not be blocked`).toContain(bot);
    }
    expect(body).toMatch(/Disallow:\s*\/admin/);
  });

  test('sitemap.xml is real XML listing absolute URLs', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    // The SPA rewrite serves index.html for anything missing, so a 200 alone
    // proves nothing. Content-type and shape are what distinguish a real file
    // from the app shell.
    expect(res.headers()['content-type']).toMatch(/xml/);
    expect(body).toContain('<urlset');
    expect(body).not.toContain('%VITE');
    expect(body).not.toContain('<div id="root">');
    for (const route of ['/login', '/privacy', '/terms']) {
      expect(body, `${route} missing from sitemap`).toContain(`${route}</loc>`);
    }
  });

  test('llms.txt exists and is not the app shell', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).not.toContain('<div id="root">');
    expect(body).toContain('# GameFit');
    // Guards the three facts the old marketing copy got wrong.
    expect(body).toMatch(/Claude/);
    expect(body).not.toMatch(/OpenAI|GPT-4/);
    expect(body).toMatch(/2D SVG/);
  });
});

test.describe('payload', () => {
  test('the first screen does not download the whole app', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const js = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((r) => /\.m?js(\?|$)/.test(r.name))
        .reduce((n, r) => n + (r.encodedBodySize || 0), 0),
    );
    // It was one 1.8 MB chunk (528 kB over the wire). The budget is deliberately
    // above the current 232 kB so ordinary work does not trip it, and well below
    // where it started, so a regression does.
    expect(js, `first-load JS is ${js} bytes`).toBeLessThan(350_000);
  });

  test('the chart library is not preloaded on the splash screen', async ({ page }) => {
    await page.goto('/');
    const preloads = await page.$$eval('link[rel="modulepreload"]', (ls) =>
      ls.map((l) => l.getAttribute('href')),
    );
    // Naming a chunk in manualChunks makes Vite preload it. Charts belong to
    // two authenticated routes and must stay async.
    expect(preloads.join(' ')).not.toMatch(/vendor-charts/);
  });

  test('no source maps are published', async ({ page, request }) => {
    await page.goto('/');
    const scripts = await page.$$eval('script[src]', (ss) => ss.map((s) => s.getAttribute('src')));
    for (const src of scripts.filter((s) => s.startsWith('/assets/'))) {
      const res = await request.get(src + '.map');
      if (res.status() !== 200) continue;
      // A 200 alone proves nothing: both `vite preview` and the Vercel SPA
      // rewrite answer any unknown path with index.html. What distinguishes a
      // real source map is that it is JSON with a mappings field, not HTML.
      const type = res.headers()['content-type'] ?? '';
      const body = await res.text();
      const isRealMap = type.includes('json') || /"mappings"\s*:/.test(body);
      expect(isRealMap, `${src}.map is a real source map and is being served`).toBe(false);
    }
  });
});

test.describe('error handling', () => {
  test('an unknown path renders a 404 page instead of silently going home', async ({ page }) => {
    await page.goto('/definitely-not-a-real-route');
    // Must not redirect away. The old behaviour sent every wrong URL to "/",
    // which hid the mistake and made every bad address look like a real page.
    expect(page.url()).toContain('/definitely-not-a-real-route');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('body')).toContainText(/404|off the map/i);
    await expect(page.getByRole('link', { name: /dashboard|start/i }).first()).toBeVisible();
  });

  test('public pages load with no console errors', async ({ page, consoleErrors }) => {
    test.setTimeout(150_000);
    for (const route of PUBLIC_ROUTES) {
      // Deliberately not 'networkidle'. The Turnstile widget keeps talking to
      // Cloudflare after the page is usable, so idle may never arrive and the
      // test times out having proved nothing. Waiting for the route's heading
      // is both faster and a real signal that the lazy chunk mounted.
      await page.goto(route, { waitUntil: 'load' });
      await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15_000 });
    }
    expect(consoleErrors, `console errors:\n${consoleErrors.join('\n')}`).toHaveLength(0);
  });
});
