// Generate every brand raster from the one vector definition in
// src/lib/brand.js: PWA icons (192/512 + maskable), favicons, apple-touch
// icon, the OG share image, and the Capacitor source images.
//
// Usage: npx tsx scripts/generate-brand-assets.mjs
//
// The geometry deliberately does not live here. It lives in src/lib/brand.js
// so the React components render the same mark this script rasterises; a
// second copy in this file is how a logo ends up subtly different in the app
// than on the app icon.
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import {
  BRAND,
  MASCOT_DETAILED,
  MASCOT_SIMPLE,
  WORDMARK_HEIGHT,
  WORDMARK_WIDTH,
  shapesToSvg,
  wordmarkToSvg,
} from '../src/lib/brand.js';

// Place a mascot on a 200-unit grid into a box of `size`, inset by `padding`.
function mascot({ size, padding = 0.12, rig = MASCOT_DETAILED }) {
  const pad = size * padding;
  const scale = (size - pad * 2) / 200;
  return `<g transform="translate(${pad},${pad}) scale(${scale})">${shapesToSvg(rig)}</g>`;
}

// The app icon: mascot on a filled navy square. The fill is not optional —
// iOS and Android composite icons against wallpaper nobody controls, so a
// transparent mark would sit on whatever the user picked.
function iconSvg({ size = 1024, rounded = 0.2237, padding = 0.12, rig = MASCOT_DETAILED }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * rounded}" fill="${BRAND.navy}"/>
  ${mascot({ size, padding, rig })}
</svg>`;
}

// Splash: mascot over the wordmark, both centred, on the app background.
function splashSvg(size = 2732) {
  const m = size * 0.26;
  const wmH = size * 0.052;
  const wmW = (wmH * WORDMARK_WIDTH) / WORDMARK_HEIGHT;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BRAND.navy}"/>
  <g transform="translate(${(size - m) / 2},${size * 0.32})">${mascot({ size: m, padding: 0 })}</g>
  <g transform="translate(${(size - wmW) / 2},${size * 0.615}) scale(${wmH / WORDMARK_HEIGHT})">${wordmarkToSvg('dark')}</g>
</svg>`;
}

// OG share image, 1200x630. The lettering is vector now, so this no longer
// depends on Arial Black existing on whatever machine runs the build — it
// used to, and the fallback silently changed the mark's weight.
function ogSvg() {
  const wmH = 92;
  const wmW = (wmH * WORDMARK_WIDTH) / WORDMARK_HEIGHT;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BRAND.navy}"/>
  <circle cx="1050" cy="80" r="300" fill="${BRAND.gold}" opacity="0.06"/>
  <circle cx="120" cy="560" r="240" fill="#E0680E" opacity="0.07"/>
  <rect x="86" y="171" width="288" height="288" rx="64" fill="${BRAND.surface}"/>
  <g transform="translate(86,171)">${mascot({ size: 288, padding: 0.1 })}</g>
  <g transform="translate(438,214) scale(${wmH / WORDMARK_HEIGHT})">${wordmarkToSvg('dark')}</g>
  <text x="440" y="372" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#88A5B7">Fitness, Gamified.</text>
  <text x="440" y="440" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#B9C4CC">Earn XP &#183; Keep streaks &#183; Evolve your avatar</text>
  <text x="440" y="482" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#B9C4CC">Train with an AI coach</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// Distributable SVG masters. These are what a printer, a fabricator or a
// partner gets handed, so they are emitted from the same module as everything
// above rather than kept as a parallel folder of hand-maintained files — that
// is precisely how a kit ends up one revision behind the product.

const svgDoc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="GameFit">${body}</svg>\n`;

function lockupSvg(tone, layout) {
  const M = 200;             // mascot grid
  const wmScale = 1.0;
  const wmW = WORDMARK_WIDTH * wmScale;
  const wmH = WORDMARK_HEIGHT * wmScale;
  const mark = shapesToSvg(MASCOT_DETAILED);

  if (layout === 'stacked') {
    const w = Math.max(M, wmW);
    const gap = 34;
    const h = M + gap + wmH;
    return svgDoc(w, h,
      `<g transform="translate(${(w - M) / 2},0)">${mark}</g>` +
      `<g transform="translate(${(w - wmW) / 2},${M + gap})">${wordmarkToSvg(tone)}</g>`);
  }
  const gap = 40;
  const w = M + gap + wmW;
  const h = M;
  return svgDoc(w, h,
    mark +
    `<g transform="translate(${M + gap},${(h - wmH) / 2})">${wordmarkToSvg(tone)}</g>`);
}

function writeSvg(file, contents) {
  fs.writeFileSync(file, contents);
  console.log('wrote', file);
}

function write(svg, file, width) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  fs.writeFileSync(file, png);
  console.log('wrote', file, `${width}px`);
}

fs.mkdirSync('public/icons', { recursive: true });
fs.mkdirSync('resources', { recursive: true });
fs.mkdirSync('brand', { recursive: true });

// SVG masters
writeSvg('brand/mascot.svg', svgDoc(200, 200, shapesToSvg(MASCOT_DETAILED)));
writeSvg('brand/mascot-simplified.svg', svgDoc(200, 200, shapesToSvg(MASCOT_SIMPLE)));
for (const tone of ['dark', 'light']) {
  writeSvg(`brand/wordmark-on-${tone}.svg`,
    svgDoc(WORDMARK_WIDTH, WORDMARK_HEIGHT, wordmarkToSvg(tone)));
  writeSvg(`brand/logo-horizontal-on-${tone}.svg`, lockupSvg(tone, 'horizontal'));
  writeSvg(`brand/logo-stacked-on-${tone}.svg`, lockupSvg(tone, 'stacked'));
}
writeSvg('brand/app-icon.svg', iconSvg({ size: 1024 }));
writeSvg('brand/app-icon-maskable.svg', iconSvg({ size: 1024, padding: 0.2, rounded: 0 }));

// PWA + favicon set. Anything at or below 48px gets the simplified rig: the
// detailed one has 5-unit catchlights on a 200-unit grid, which is 0.4px in a
// 16px favicon and renders as grey noise in the eye.
write(iconSvg({ size: 512 }), 'public/icons/icon-192.png', 192);
write(iconSvg({ size: 512 }), 'public/icons/icon-512.png', 512);
// maskable: 20% inset so the mark survives whatever shape the OS crops to.
write(iconSvg({ size: 512, padding: 0.2, rounded: 0 }), 'public/icons/icon-maskable-512.png', 512);
write(iconSvg({ size: 512 }), 'public/icons/apple-touch-icon.png', 180);
write(iconSvg({ size: 512, rig: MASCOT_SIMPLE, padding: 0.08 }), 'public/favicon-32.png', 32);
write(iconSvg({ size: 512, rig: MASCOT_SIMPLE, padding: 0.06 }), 'public/favicon-16.png', 16);

// social share
write(ogSvg(), 'public/og-image.png', 1200);

// Capacitor sources (capacitor-assets consumes these)
write(iconSvg({ size: 1024, rounded: 0 }), 'resources/icon-only.png', 1024);
write(iconSvg({ size: 1024, padding: 0.28, rounded: 0 }), 'resources/icon-foreground.png', 1024);
fs.writeFileSync('resources/icon-background.png',
  new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${BRAND.navy}"/></svg>`).render().asPng());
console.log('wrote resources/icon-background.png');
write(splashSvg(), 'resources/splash.png', 2732);
write(splashSvg(), 'resources/splash-dark.png', 2732);
