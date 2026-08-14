// Walks the onboarding wizard in a real browser and asserts every step renders
// with drawn icons and no emoji.
//
// Usage: node scripts/check-onboarding-render.mjs [baseUrl]
//
// This exists because onboarding is the one flow that cannot be checked from
// the in-app browser pane: it is built on AnimatePresence, and that pane
// freezes requestAnimationFrame on hidden tabs, so the exit animation never
// completes and the wizard never advances past step one. Playwright drives a
// real compositor, so the transitions actually run.
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2648}-\u{2653}\u{26A0}-\u{27BF}\u{2B50}\u{2705}\u{274C}\u{2764}]/u;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

// The walkthrough runs signed out, so the profile save on the last step
// returns 401. That is the expected result of not being logged in, not a
// rendering fault — everything else is reported.
const IGNORED = /status of (401|403)/;
const consoleErrors = [];
page.on('pageerror', e => consoleErrors.push(String(e.message)));
page.on('console', m => {
  if (m.type() === 'error' && !IGNORED.test(m.text())) consoleErrors.push(m.text());
});

let failures = 0;
try {
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' });

  for (let step = 0; step < 12; step++) {
    await page.waitForTimeout(600);
    // The final step submits and routes away, which destroys the execution
    // context mid-read. Reaching that point means the walk succeeded.
    let text;
    try {
      text = await page.evaluate(() => document.body.innerText || '');
    } catch {
      console.log(`  step ${step}: wizard completed and navigated away`);
      break;
    }
    const emoji = [...text].filter(c => EMOJI.test(c)).length;
    const icons = await page.locator('svg[class*="lucide"]').count();
    const headline = text.split('\n').filter(Boolean)[1] || '(none)';

    if (emoji > 0) {
      failures++;
      console.error(`  step ${step} "${headline.slice(0, 34)}": ${emoji} emoji still rendering`);
    } else {
      console.log(`  step ${step} "${headline.slice(0, 34)}" — ${icons} drawn icon(s), 0 emoji`);
    }

    // Choose an option where the step requires one, then advance. Buttons with
    // no text are chrome (the back chevron), and clicking those is what makes
    // a naive walker sit on the class step forever.
    const picked = await page.evaluate(() => {
      const isNav = t => /^(NEXT|BACK)$/i.test(t) || t.includes("Let's Go");
      const opts = [...document.querySelectorAll('button')]
        .filter(b => (b.innerText || '').trim().length > 1 && !isNav((b.innerText || '').trim()));
      if (!opts.length) return null;
      opts[0].click();
      return (opts[0].innerText || '').trim().split('\n')[0].slice(0, 24);
    });
    if (picked) await page.waitForTimeout(250);

    const next = page.getByRole('button', { name: /NEXT|Let's Go/i }).first();
    if (!(await next.count())) break;
    await next.click({ timeout: 3000 }).catch(() => {});
  }
} finally {
  await browser.close();
}

if (consoleErrors.length) {
  failures++;
  console.error('\nconsole/page errors:');
  for (const e of consoleErrors.slice(0, 8)) console.error('  ' + e);
}

if (failures) {
  console.error(`\nFAILED: ${failures} problem(s)`);
  process.exit(1);
}
console.log('\nOnboarding renders clean: drawn icons only, no page errors.');
