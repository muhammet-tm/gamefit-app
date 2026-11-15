// Dev tool: capture the README screenshots and compose the hero banner.
// Usage: node scripts/readme-assets.mjs [--local | <baseUrl>] [--hero-only]
// --hero-only rebuilds hero.png from the existing shots: no sign-in, no writes.
// Shoots the live deployment (or localhost:5173 with --local, or any base URL
// given as an argument) using the QA account from .env.local, then renders
// docs/images/hero.png from three of the shots with the mark from brand.js.
// Frames are chosen to keep the account's email out of every capture.
//
// Writes it makes to the QA account: one coach chat message (for the table
// answer in coach.png), and the demo personal records only if it has none.
// Login is captcha-gated, so a local server needs the Turnstile test key
// (1x00000000000000000000AA), as in .env.development.local.
import { chromium } from 'playwright';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import {
  BRAND, MASCOT_DETAILED, WORDMARK_HEIGHT, WORDMARK_WIDTH, shapesToSvg, wordmarkToSvg,
} from '../src/lib/brand.js';
import { COACH_NAME } from '../src/lib/coach.js';

const LOCAL = process.argv.includes('--local');
const HERO_ONLY = process.argv.includes('--hero-only');
const BASE = process.argv.slice(2).find((a) => /^https?:\/\//.test(a))
  || (LOCAL ? 'http://localhost:5173' : 'https://gamefit-app.vercel.app');
const OUT = 'docs/images';
const SHOTS = path.join(OUT, 'screens');
fs.mkdirSync(SHOTS, { recursive: true });

if (!HERO_ONLY) {
  const env = Object.fromEntries(
    fs.readFileSync('.env.local', 'utf8').split('\n')
      .filter(l => l.includes('=') && !l.trim().startsWith('#'))
      .map(l => l.split('=').map(s => s.trim())),
  );
  const { VITE_SUPABASE_URL: SB, VITE_SUPABASE_ANON_KEY: ANON } = env;

  // --- direct REST helpers so we can pose the demo account for a shot
  const auth = await (await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.TEST_USER_EMAIL, password: env.TEST_USER_PASSWORD }),
  })).json();
  const H = { apikey: ANON, Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' };
  const rpc = (fn, args) => fetch(`${SB}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: H, body: JSON.stringify(args),
  }).then(r => r.json());

  // Seed a few PRs so the records card is not empty in the shot, but only on
  // an account that has none: re-logging them on every run would pile up rows.
  const DEMO_PRS = [
    { p_exercise: 'Bench Press', p_weight_kg: 82.5, p_reps: 5 },
    { p_exercise: 'Squat', p_weight_kg: 110, p_reps: 3 },
    { p_exercise: 'Deadlift', p_weight_kg: 140, p_reps: 1 },
  ];
  const existingPrs = await (await fetch(
    `${SB}/rest/v1/personal_records?user_id=eq.${auth.user.id}&select=id&limit=1`, { headers: H })).json();
  if (!Array.isArray(existingPrs) || existingPrs.length === 0) {
    for (const pr of DEMO_PRS) await rpc('log_pr', pr);
    console.log('seeded demo personal records');
  }

  const browser = await chromium.launch();
  // dark is the product's identity — the theme follows prefers-color-scheme
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark',
  });

  async function shot(name) {
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
    console.log('shot', name);
  }

  // Not networkidle: the Turnstile iframe keeps a request open.
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', env.TEST_USER_EMAIL);
  await page.fill('input[type="password"]', env.TEST_USER_PASSWORD);
  await page.waitForSelector('[data-token-ready="true"]', { timeout: 25000 });
  await page.locator('form').getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard', { timeout: 25000 });
  await page.waitForTimeout(2500);
  await shot('dashboard');

  await page.goto(`${BASE}/train`);
  await page.waitForTimeout(2200);
  await shot('train');

  await page.goto(`${BASE}/leaderboard`);
  await page.waitForTimeout(2500);
  await shot('leaderboard');

  // Coach: ask for something that exercises the table renderer
  await page.goto(`${BASE}/coach`);
  await page.getByRole('button', { name: /Chat/ }).click();
  await page.fill('input[placeholder$="anything..."]',
    'Give me a 3-day upper/lower split as a table with sets and reps.');
  await page.keyboard.press('Enter');
  await page.waitForSelector('table', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot('coach');

  // Profile: frame the Personal Records card (also keeps the email out of shot)
  await page.goto(`${BASE}/profile`);
  await page.waitForSelector('text=Personal Records', { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.locator('text=Personal Records').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -40));
  await page.waitForTimeout(600);
  await shot('records');

  // Athlete: the account's own athlete, as players see it. The old shot
  // patched avatar_config to pose a drawn rig; the cast needs no posing.
  await page.goto(`${BASE}/avatar`);
  await page.waitForTimeout(3000);
  await shot('avatar');

  await browser.close();
}

// ---------------- hero banner ----------------
// Ignition palette (src/index.css) and the mark from src/lib/brand.js, the
// same source as the app icons, so the README cannot drift from the product.
const GROUND = BRAND.ground;    // #141416
const SURFACE = BRAND.surface;  // #1E1E21
const ORANGE = BRAND.accent;    // #FF6B00
const MUTED = '#A1A1AA';

const b64 = f => fs.readFileSync(path.join(SHOTS, `${f}.png`)).toString('base64');

// three devices, centre one raised
const phones = [
  { file: 'records', x: 60, y: 150, w: 210, rot: -6 },
  { file: 'dashboard', x: 300, y: 96, w: 230, rot: 0 },
  { file: 'avatar', x: 560, y: 150, w: 210, rot: 6 },
];

const deviceMarkup = phones.map(({ file, x, y, w, rot }) => {
  const h = Math.round(w * (844 / 390));
  const cx = x + w / 2, cy = y + h / 2;
  return `
  <g transform="rotate(${rot} ${cx} ${cy})">
    <rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" rx="26" fill="#000000" opacity="0.55"/>
    <rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="24" fill="#2E2E33"/>
    <clipPath id="clip-${file}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="21"/></clipPath>
    <image x="${x}" y="${y}" width="${w}" height="${h}" clip-path="url(#clip-${file})"
      preserveAspectRatio="xMidYMid slice" href="data:image/png;base64,${b64(file)}"/>
  </g>`;
}).join('');

const MARK = 96;                         // mascot box, px
const WM_H = 46;                         // wordmark cap height, px
const WM_W = (WM_H * WORDMARK_WIDTH) / WORDMARK_HEIGHT;

const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GROUND}"/>
      <stop offset="60%" stop-color="${SURFACE}"/>
      <stop offset="100%" stop-color="${GROUND}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.18" cy="0.3" r="0.6">
      <stop offset="0%" stop-color="${ORANGE}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${ORANGE}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="640" fill="url(#bg)"/>
  <rect width="1280" height="640" fill="url(#glow)"/>

  <g transform="translate(830,118)">
    <g transform="scale(${MARK / 200})">${shapesToSvg(MASCOT_DETAILED)}</g>
    <g transform="translate(0,${MARK + 22}) scale(${WM_H / WORDMARK_HEIGHT})">${wordmarkToSvg('dark')}</g>
    <text x="2" y="${MARK + 22 + WM_H + 40}" font-family="Arial, sans-serif" font-size="21" fill="${MUTED}">
      Your workouts, leveled up.
    </text>
    <text x="2" y="${MARK + 22 + WM_H + 88}" font-family="Arial, sans-serif" font-size="16" fill="#D4D4D8">
      XP, ranks, streaks, and ten preset athletes
    </text>
    <text x="2" y="${MARK + 22 + WM_H + 114}" font-family="Arial, sans-serif" font-size="16" fill="#D4D4D8">
      ${COACH_NAME} on Claude, server-authoritative economy
    </text>
    <rect x="0" y="${MARK + 22 + WM_H + 146}" width="${Math.round(WM_W * 0.62)}" height="4" rx="2" fill="${ORANGE}" opacity="0.8"/>
  </g>
  ${deviceMarkup}
</svg>`;

const png = new Resvg(hero, { fitTo: { mode: 'width', value: 1280 }, background: GROUND }).render().asPng();
fs.writeFileSync(path.join(OUT, 'hero.png'), png);
console.log('wrote', path.join(OUT, 'hero.png'));
