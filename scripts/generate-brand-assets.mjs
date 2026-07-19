// Generate all brand raster assets from one SVG mark:
// PWA icons (192/512 + maskable), favicons, apple-touch-icon, OG share image,
// and the Capacitor source images (icon 1024, splash 2732).
// Usage: npx tsx scripts/generate-brand-assets.mjs
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';

const CHARCOAL = '#0D0F14';
const SURFACE = '#161A22';
const GREEN = '#C8FF00';
const GREEN_DARK = '#8FBF00';

// The GameFit mark: a lightning bolt striking through a dumbbell — energy
// meets iron. Drawn bold enough to read at 48px.
function markSvg({ size = 1024, bg = CHARCOAL, padding = 0.18, rounded = 0.22 }) {
  const pad = size * padding;
  const inner = size - pad * 2;
  const r = size * rounded;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg ? `<rect width="${size}" height="${size}" rx="${r}" fill="${bg}"/>` : ''}
  <g transform="translate(${pad},${pad}) scale(${inner / 200})">
    <!-- dumbbell: plates + bar, tilted -->
    <g transform="rotate(-24 100 100)">
      <rect x="18" y="86" width="22" height="28" rx="6" fill="${GREEN_DARK}"/>
      <rect x="34" y="78" width="18" height="44" rx="6" fill="${GREEN}"/>
      <rect x="148" y="78" width="18" height="44" rx="6" fill="${GREEN}"/>
      <rect x="160" y="86" width="22" height="28" rx="6" fill="${GREEN_DARK}"/>
      <rect x="50" y="94" width="100" height="12" rx="6" fill="${GREEN}"/>
    </g>
    <!-- lightning bolt striking through -->
    <path d="M118,10 L74,96 L100,96 L82,190 L138,84 L110,84 Z"
      fill="${CHARCOAL}" stroke="${GREEN}" stroke-width="10" stroke-linejoin="round"/>
    <path d="M118,10 L74,96 L100,96 L82,190 L138,84 L110,84 Z" fill="${GREEN}" opacity="0.25"/>
  </g>
</svg>`;
}

// Splash: centered mark on charcoal with wordmark
function splashSvg(size = 2732) {
  const mark = markSvg({ size: size * 0.28, bg: null, padding: 0.02, rounded: 0 })
    .replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const m = size * 0.28;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${CHARCOAL}"/>
  <g transform="translate(${(size - m) / 2},${size * 0.33})">${mark}</g>
  <text x="${size / 2}" y="${size * 0.68}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
    font-weight="900" font-size="${size * 0.055}" fill="#FFFFFF" letter-spacing="${size * 0.004}">GAME<tspan fill="${GREEN}">FIT</tspan></text>
</svg>`;
}

// OG share image 1200x630
function ogSvg() {
  const mark = markSvg({ size: 340, bg: SURFACE, padding: 0.16 })
    .replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${CHARCOAL}"/>
  <circle cx="1050" cy="80" r="300" fill="${GREEN}" opacity="0.06"/>
  <circle cx="120" cy="560" r="240" fill="#9664FF" opacity="0.07"/>
  <g transform="translate(90,145)">${mark}</g>
  <text x="490" y="270" font-family="Arial Black, Arial, sans-serif" font-weight="900"
    font-size="86" fill="#FFFFFF">GAME<tspan fill="${GREEN}">FIT</tspan></text>
  <text x="493" y="330" font-family="Arial, sans-serif" font-size="34" fill="#8A8F9E">Fitness, Gamified.</text>
  <text x="493" y="410" font-family="Arial, sans-serif" font-size="27" fill="#B9BFCC">Earn XP · Keep streaks · Evolve your avatar</text>
  <text x="493" y="452" font-family="Arial, sans-serif" font-size="27" fill="#B9BFCC">Train with an AI coach</text>
</svg>`;
}

function write(svg, file, width) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  fs.writeFileSync(file, png);
  console.log('wrote', file, `${width}px`);
}

fs.mkdirSync('public/icons', { recursive: true });
fs.mkdirSync('resources', { recursive: true });

// PWA + favicon set
write(markSvg({ size: 512 }), 'public/icons/icon-192.png', 192);
write(markSvg({ size: 512 }), 'public/icons/icon-512.png', 512);
// maskable: extra safe-zone padding, square (the OS applies its own mask)
write(markSvg({ size: 512, padding: 0.28, rounded: 0 }), 'public/icons/icon-maskable-512.png', 512);
write(markSvg({ size: 512 }), 'public/icons/apple-touch-icon.png', 180);
write(markSvg({ size: 512 }), 'public/favicon-32.png', 32);
write(markSvg({ size: 512 }), 'public/favicon-16.png', 16);

// social share
write(ogSvg(), 'public/og-image.png', 1200);

// Capacitor sources (capacitor-assets consumes these)
write(markSvg({ size: 1024, rounded: 0 }), 'resources/icon-only.png', 1024);
write(markSvg({ size: 1024, padding: 0.3, rounded: 0 }), 'resources/icon-foreground.png', 1024);
fs.writeFileSync('resources/icon-background.png',
  new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${CHARCOAL}"/></svg>`).render().asPng());
console.log('wrote resources/icon-background.png');
write(splashSvg(), 'resources/splash.png', 2732);
write(splashSvg(), 'resources/splash-dark.png', 2732);
