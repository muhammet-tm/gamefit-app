// Screenshot the two screens the mark lands on, in both themes, against the
// production build.
//
// Playwright rather than the in-app browser pane: the pane freezes
// requestAnimationFrame on hidden tabs, and both of these screens gate their
// first paint on a Framer Motion entrance, so the pane renders them at
// opacity 0 and the result looks like a blank screen rather than a bug.
//
// Usage: npx playwright test --help is irrelevant here; run directly:
//   node scripts/shot-brand.mjs <baseURL> <outDir>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://localhost:4173';
const out = process.argv[3] || 'brand-shots';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

for (const theme of ['dark', 'light']) {
  // The app stores the preference and applies `.dark` on <html>; set it before
  // the bundle boots so the first paint is already in the right theme.
  await page.addInitScript((t) => {
    try { window.localStorage.setItem('gf_theme', t); } catch { /* private mode */ }
  }, theme);

  for (const [route, name] of [['/', 'splash'], ['/login', 'login']]) {
    // Not `networkidle`: /login mounts the Turnstile widget, which keeps a
    // request to challenges.cloudflare.com open (and failing, offline), so the
    // network never goes idle and the shot times out on a page that rendered
    // fine 200ms in.
    await page.goto(base + route, { waitUntil: 'domcontentloaded' });
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15_000 });
    await page.evaluate((t) => {
      document.documentElement.classList.toggle('dark', t === 'dark');
    }, theme);
    // Let the entrance animation settle rather than sleeping a magic number.
    await page.waitForTimeout(route === '/' ? 900 : 700);
    const file = path.join(out, `${name}-${theme}.png`);
    await page.screenshot({ path: file });
    console.log('wrote', file);
  }
}

await browser.close();
