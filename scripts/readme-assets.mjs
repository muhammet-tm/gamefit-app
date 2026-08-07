// Dev tool: capture the README screenshots and compose the hero banner.
// Usage: node scripts/readme-assets.mjs [--local]
// Shoots the live deployment (or localhost with --local) using the QA account
// from .env.local, then renders docs/images/hero.png from three of the shots.
// Frames are chosen to keep the account's email out of every capture.
import { chromium } from 'playwright';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const LOCAL = process.argv.includes('--local');
const BASE = LOCAL ? 'http://localhost:5173' : 'https://gamefit-app.vercel.app';
const OUT = 'docs/images';
const SHOTS = path.join(OUT, 'screens');
fs.mkdirSync(SHOTS, { recursive: true });

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
const patchProfile = (body) => fetch(`${SB}/rest/v1/profiles?id=eq.${auth.user.id}`, {
  method: 'PATCH', headers: H, body: JSON.stringify(body),
});
const rpc = (fn, args) => fetch(`${SB}/rest/v1/rpc/${fn}`, {
  method: 'POST', headers: H, body: JSON.stringify(args),
}).then(r => r.json());

const originalCfg = (await (await fetch(
  `${SB}/rest/v1/profiles?id=eq.${auth.user.id}&select=avatar_config`, { headers: H })).json())[0].avatar_config;

// seed a couple of PRs so the records card is not empty in the shot
const DEMO_PRS = [
  { p_exercise: 'Bench Press', p_weight_kg: 82.5, p_reps: 5 },
  { p_exercise: 'Squat', p_weight_kg: 110, p_reps: 3 },
  { p_exercise: 'Deadlift', p_weight_kg: 140, p_reps: 1 },
];
for (const pr of DEMO_PRS) await rpc('log_pr', pr);

const browser = await chromium.launch();
// dark is the product's identity — the theme follows prefers-color-scheme
const page = await browser.newPage({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark',
});

async function shot(name) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
  console.log('shot', name);
}

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', env.TEST_USER_EMAIL);
await page.fill('input[type="password"]', env.TEST_USER_PASSWORD);
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
await page.fill('input[placeholder*="Ask Coach G"]',
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

// Avatar: female rig for the customization shot, then restore the account
await patchProfile({ avatar_config: { version: 3, class: 'archer', body: 'female', skin_tone: 'tan', hair: 'long_brown' } });
await page.goto(`${BASE}/avatar`);
await page.waitForTimeout(3000);
await shot('avatar');
await patchProfile({ avatar_config: originalCfg });

await browser.close();

// ---------------- hero banner ----------------
const CHARCOAL = '#0D0F14';
const SURFACE = '#161A22';
const GREEN = '#C8FF00';
const MUTED = '#8A8F9E';

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
    <rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="24" fill="#2A2F3A"/>
    <clipPath id="clip-${file}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="21"/></clipPath>
    <image x="${x}" y="${y}" width="${w}" height="${h}" clip-path="url(#clip-${file})"
      preserveAspectRatio="xMidYMid slice" href="data:image/png;base64,${b64(file)}"/>
  </g>`;
}).join('');

const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${CHARCOAL}"/>
      <stop offset="60%" stop-color="${SURFACE}"/>
      <stop offset="100%" stop-color="${CHARCOAL}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.18" cy="0.3" r="0.6">
      <stop offset="0%" stop-color="${GREEN}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${GREEN}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="640" fill="url(#bg)"/>
  <rect width="1280" height="640" fill="url(#glow)"/>

  <g transform="translate(830,150)">
    <!-- mark: bolt through a dumbbell -->
    <g transform="translate(0,-8) scale(0.42)">
      <rect x="18" y="70" width="26" height="60" rx="8" fill="${MUTED}"/>
      <rect x="0" y="84" width="18" height="32" rx="6" fill="${MUTED}"/>
      <rect x="156" y="70" width="26" height="60" rx="8" fill="${MUTED}"/>
      <rect x="182" y="84" width="18" height="32" rx="6" fill="${MUTED}"/>
      <rect x="44" y="90" width="112" height="20" rx="6" fill="#6E7382"/>
      <path d="M118,10 L74,96 L100,96 L82,190 L138,84 L110,84 Z" fill="${GREEN}"/>
    </g>
    <text x="92" y="34" font-family="Arial Black, Arial, sans-serif" font-size="58"
      font-weight="900" fill="#FFFFFF" letter-spacing="-1">GAME<tspan fill="${GREEN}">FIT</tspan></text>
    <text x="94" y="78" font-family="Arial, sans-serif" font-size="21" fill="${MUTED}">
      Your workouts, levelled up.
    </text>
    <text x="94" y="128" font-family="Arial, sans-serif" font-size="16" fill="#C9CEDC">
      XP · ranks · streaks · evolving avatars
    </text>
    <text x="94" y="154" font-family="Arial, sans-serif" font-size="16" fill="#C9CEDC">
      AI coaching · server-authoritative economy
    </text>
    <rect x="92" y="188" width="220" height="4" rx="2" fill="${GREEN}" opacity="0.7"/>
  </g>
  ${deviceMarkup}
</svg>`;

const png = new Resvg(hero, { fitTo: { mode: 'width', value: 1280 }, background: CHARCOAL }).render().asPng();
fs.writeFileSync(path.join(OUT, 'hero.png'), png);
console.log('wrote', path.join(OUT, 'hero.png'));
