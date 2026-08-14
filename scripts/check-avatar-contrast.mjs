// Guards the avatar palette against the failure that shipped after phase 1:
// gear authored for one background, then the background changed underneath it.
//
// Usage: npx tsx scripts/check-avatar-contrast.mjs [--verbose]
// Exits non-zero on any violation, so it can gate a build.
//
// Three separate things can go wrong, and passing one does not imply the
// others:
//   1. A piece disappears into the card it sits on.       (ground contrast)
//   2. Two classes look like the same player in a list.   (pairwise ΔE)
//   3. A kit's primary and trim merge into one flat shape. (intra-class ΔE)
import {
  CLASS_PALETTES, classColors, rigColors, itemColors, SKIN_TONES,
} from '../src/components/avatar/palettes.js';

const VERBOSE = process.argv.includes('--verbose');

// The grounds an avatar actually renders on, per theme. Values mirror
// src/index.css; if the palette moves, these move with it.
const GROUNDS = {
  dark:  { 'bg-elevated': '#1A3242', 'bg-surface': '#112532' },
  light: { 'bg-elevated': '#DFE8EE', 'bg-surface': '#FFFFFF' },
};

// Filled shapes, not glyphs. 2.2 is the point below which a garment stops
// reading as a separate object from the card behind it.
const FILL_FLOOR = 2.2;
// `text` carries class labels in the pickers, so it answers to AA body text.
const TEXT_FLOOR = 4.5;
// Two classes closer than this are the same silhouette in a leaderboard row.
const CLASS_SEPARATION = 25;
// c1 vs c2: below is flat, above reads as two unrelated garments.
const LAYER_MIN = 12;
const LAYER_MAX = 45;
// The contour is a 2.4px line doing structural work at 40px. It has to stay
// legible against the card behind it and against every skin tone it wraps.
const CONTOUR_FLOOR = 3.0;

const srgb = v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const channels = hex => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255);
};
const luminance = hex => {
  const [r, g, b] = channels(hex).map(srgb);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const lab = hex => {
  const [r, g, b] = channels(hex).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const f = v => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  const X = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
  const Y = f(r * 0.2126 + g * 0.7152 + b * 0.0722);
  const Z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
};
const deltaE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));

const failures = [];
const fail = msg => failures.push(msg);
const note = msg => { if (VERBOSE) console.log(`    ${msg}`); };

for (const theme of Object.keys(GROUNDS)) {
  console.log(`\n${theme} theme`);
  const grounds = Object.entries(GROUNDS[theme]);

  for (const cls of Object.keys(CLASS_PALETTES)) {
    const c = classColors(cls, theme);
    for (const key of ['c1', 'c2', 'metal', 'glow']) {
      for (const [gName, ground] of grounds) {
        const ratio = contrast(c[key], ground);
        note(`${cls}.${key} on ${gName}: ${ratio.toFixed(2)}`);
        if (ratio < FILL_FLOOR) {
          fail(`${theme} ${cls}.${key} (${c[key]}) is ${ratio.toFixed(2)} on ${gName}, needs ${FILL_FLOOR}`);
        }
      }
    }
    for (const [gName, ground] of grounds) {
      const ratio = contrast(c.text, ground);
      note(`${cls}.text on ${gName}: ${ratio.toFixed(2)}`);
      if (ratio < TEXT_FLOOR) {
        fail(`${theme} ${cls}.text (${c.text}) is ${ratio.toFixed(2)} on ${gName}, needs ${TEXT_FLOOR} for a label`);
      }
    }
    const layer = deltaE(c.c1, c.c2);
    note(`${cls} c1-c2 ΔE: ${layer.toFixed(1)}`);
    if (layer < LAYER_MIN) fail(`${theme} ${cls} c1/c2 ΔE ${layer.toFixed(1)} is flat, needs ${LAYER_MIN}`);
    if (layer > LAYER_MAX) fail(`${theme} ${cls} c1/c2 ΔE ${layer.toFixed(1)} is split, max ${LAYER_MAX}`);
  }

  const names = Object.keys(CLASS_PALETTES);
  let closest = { d: Infinity, pair: '' };
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const d = deltaE(classColors(names[i], theme).c1, classColors(names[j], theme).c1);
      if (d < closest.d) closest = { d, pair: `${names[i]}/${names[j]}` };
      if (d < CLASS_SEPARATION) {
        fail(`${theme} ${names[i]} and ${names[j]} differ by only ΔE ${d.toFixed(1)}, needs ${CLASS_SEPARATION}`);
      }
    }
  }
  console.log(`  closest class pair: ${closest.pair} at ΔE ${closest.d.toFixed(1)}`);

  // Shop accessories. flames, wings, cape and the floating badges all extend
  // past the body onto bare card, so they answer to the same fill floor as
  // gear.
  //
  // Two are exempt, and the reason matters: they are shading painted over
  // another item colour, never over the card. `highlight` is a catch light on
  // a wing; `rubyDark` is the cape's far side over `ruby`. What has to clear
  // the ground is the parent shape, and `ruby` does at 2.95. Forcing these to
  // the floor would flatten them into their parent — the nearest passing value
  // for rubyDark sits ΔE 4.8 from ruby, which is a cape with no form left.
  const INTERIOR_SHADING = new Set(['highlight', 'rubyDark']);
  const items = itemColors(theme);
  for (const [name, hex] of Object.entries(items)) {
    if (INTERIOR_SHADING.has(name)) continue;
    for (const [gName, ground] of grounds) {
      const ratio = contrast(hex, ground);
      note(`item ${name} on ${gName}: ${ratio.toFixed(2)}`);
      if (ratio < FILL_FLOOR) {
        fail(`${theme} accessory ${name} (${hex}) is ${ratio.toFixed(2)} on ${gName}, needs ${FILL_FLOOR}`);
      }
    }
  }

  // Skin is user identity and may not be "corrected" to hit a ratio, so the
  // test is not "does this tone beat the card". A body is legible when EITHER
  //   the tone beats the card on its own,
  //   OR the contour beats both the card and that tone.
  // No single line colour can clear all six tones — they span porcelain to
  // ebony — and it does not have to. Requiring it would reject the design that
  // actually works and push toward a worse one.
  const { contour } = rigColors(theme);
  for (const [tone, s] of Object.entries(SKIN_TONES)) {
    for (const [gName, ground] of grounds) {
      const skinVsGround = contrast(s.base, ground);
      const lineVsGround = contrast(contour, ground);
      const lineVsSkin = contrast(contour, s.base);
      const rescued = lineVsGround >= CONTOUR_FLOOR && lineVsSkin >= CONTOUR_FLOOR;
      note(`skin ${tone} on ${gName}: self ${skinVsGround.toFixed(2)}, line/ground ${lineVsGround.toFixed(2)}, line/skin ${lineVsSkin.toFixed(2)}`);
      if (skinVsGround < CONTOUR_FLOOR && !rescued) {
        fail(
          `${theme} skin ${tone} (${s.base}) is ${skinVsGround.toFixed(2)} on ${gName} `
          + `and the contour (${contour}) does not rescue it `
          + `(line/ground ${lineVsGround.toFixed(2)}, line/skin ${lineVsSkin.toFixed(2)}, both need ${CONTOUR_FLOOR})`,
        );
      }
    }
  }
}

console.log('');
if (failures.length) {
  console.error(`${failures.length} avatar palette violation(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('Avatar palette OK: every fill, label, and skin tone clears its floor on both themes.');
