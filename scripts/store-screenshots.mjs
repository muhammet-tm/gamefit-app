// Capture store-ready screenshots of the live app with the QA account.
// Outputs:
//   store-assets/appstore/  1290x2796 (iPhone 6.7" requirement)
//   store-assets/play/      1080x1920 (Play-safe 16:9)
// Usage: node scripts/store-screenshots.mjs [baseUrl]
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.argv[2] || 'https://gamefit-app.vercel.app';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf-8').split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const [k, ...v] = t.split('=');
    env[k] = v.join('=');
  }
}

const SHOTS = [
  { path: '/dashboard', name: '01-dashboard', wait: 3500 },
  { path: '/avatar', name: '02-avatar', wait: 3000 },
  { path: '/train', name: '03-train', wait: 2500 },
  { path: '/leaderboard', name: '04-leaderboard', wait: 3000 },
  { path: '/coach', name: '05-coach', wait: 2500 },
  { path: '/profile', name: '06-profile', wait: 3000 },
];

const TARGETS = [
  { dir: 'store-assets/appstore', width: 430, height: 932, scale: 3 },   // 1290x2796
  { dir: 'store-assets/play', width: 360, height: 640, scale: 3 },       // 1080x1920
];

const browser = await chromium.launch();
try {
  for (const t of TARGETS) {
    fs.mkdirSync(t.dir, { recursive: true });
    const ctx = await browser.newContext({
      viewport: { width: t.width, height: t.height },
      deviceScaleFactor: t.scale,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
    });
    const page = await ctx.newPage();

    // login once per context
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', env.TEST_USER_EMAIL);
    await page.fill('input[type="password"]', env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await page.waitForTimeout(3000);

    for (const s of SHOTS) {
      await page.goto(`${BASE}${s.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(s.wait);
      await page.screenshot({ path: `${t.dir}/${s.name}.png` });
      console.log(`${t.dir}/${s.name}.png`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log('DONE');
