// Dev tool: rasterize the avatar system to PNGs for art review.
// Usage: npx tsx scripts/render-avatars.mjs [outDir]
// Renders a 5x5 class-x-tier contact sheet plus per-class strips.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

import Avatar from '../src/components/avatar/Avatar.jsx';
import { SKIN_TONES, CLASS_COLORS, HAIR_COLORS, AVATAR_CLASSES } from '../src/components/avatar/palettes.js';

const outDir = process.argv[2] || 'scratch-avatars';
fs.mkdirSync(outDir, { recursive: true });

// resvg doesn't resolve CSS custom properties — bake them into the markup.
function bakeVars(svg, { skinTone, hair, avatarClass }) {
  const skin = SKIN_TONES[skinTone];
  const hairColor = HAIR_COLORS[hair.split('_')[1]] || HAIR_COLORS.black;
  const c = CLASS_COLORS[avatarClass];
  return svg
    .replaceAll('var(--av-skin-shadow)', skin.shadow)
    .replaceAll('var(--av-skin)', skin.base)
    .replaceAll('var(--av-hair-shadow)', hairColor.shadow)
    .replaceAll('var(--av-hair-light)', hairColor.light)
    .replaceAll('var(--av-hair)', hairColor.base)
    .replaceAll('var(--av-c1)', c.c1)
    .replaceAll('var(--av-c2)', c.c2)
    .replaceAll('var(--av-metal)', c.metal)
    .replaceAll('var(--av-glow)', c.glow);
}

function renderOne({ avatarClass, tier, skinTone = 'tan', hair = 'short_black', accessories = [] }) {
  const markup = renderToStaticMarkup(
    React.createElement(Avatar, { avatarClass, tier, skinTone, hair, accessories, animate: false, size: 200 }),
  );
  return bakeVars(markup, { skinTone, hair, avatarClass });
}

function toPng(svgString, file, width = 200) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: width },
    background: '#161A22',
  });
  fs.writeFileSync(file, resvg.render().asPng());
}

// contact sheet: one wide SVG embedding all 25
const CELL_W = 210, CELL_H = 300;
let sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL_W * 5}" height="${CELL_H * 5}" viewBox="0 0 ${CELL_W * 5} ${CELL_H * 5}">`;
sheet += `<rect width="100%" height="100%" fill="#161A22"/>`;
AVATAR_CLASSES.forEach((cls, row) => {
  for (let tier = 1; tier <= 5; tier++) {
    const inner = renderOne({ avatarClass: cls, tier })
      .replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>$/, '');
    const x = (tier - 1) * CELL_W + 5;
    const y = row * CELL_H + 5;
    sheet += `<g transform="translate(${x},${y})"><svg width="200" height="280" viewBox="0 0 200 280">${inner}</svg></g>`;
    sheet += `<text x="${x + 100}" y="${y + 292}" fill="#8A8F9E" font-size="12" text-anchor="middle" font-family="sans-serif">${cls} T${tier}</text>`;
  }
});
sheet += `</svg>`;
toPng(sheet, path.join(outDir, 'sheet-all.png'), CELL_W * 5);
console.log('wrote', path.join(outDir, 'sheet-all.png'));

// skin/hair matrix on one class
let mat = `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL_W * 6}" height="${CELL_H}" viewBox="0 0 ${CELL_W * 6} ${CELL_H}">`;
mat += `<rect width="100%" height="100%" fill="#161A22"/>`;
Object.keys(SKIN_TONES).forEach((tone, i) => {
  const inner = renderOne({ avatarClass: 'warrior', tier: 2, skinTone: tone, hair: ['short_black', 'fade_brown', 'ponytail_blonde', 'curly_black', 'short_silver', 'curly_brown'][i] })
    .replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const x = i * CELL_W + 5;
  mat += `<g transform="translate(${x},5)"><svg width="200" height="280" viewBox="0 0 200 280">${inner}</svg></g>`;
  mat += `<text x="${x + 100}" y="292" fill="#8A8F9E" font-size="12" text-anchor="middle" font-family="sans-serif">${tone}</text>`;
});
mat += `</svg>`;
toPng(mat, path.join(outDir, 'sheet-skins.png'), CELL_W * 6);
console.log('wrote', path.join(outDir, 'sheet-skins.png'));

// accessories on knight T3
const ACC = ['halo', 'crown', 'flames', 'lightning', 'shield_glow', 'sword_glow', 'wings', 'cape', 'star_badge', 'diamond'];
let acc = `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL_W * 5}" height="${CELL_H * 2}" viewBox="0 0 ${CELL_W * 5} ${CELL_H * 2}">`;
acc += `<rect width="100%" height="100%" fill="#161A22"/>`;
ACC.forEach((id, i) => {
  const inner = renderOne({ avatarClass: 'knight', tier: 3, accessories: [id] })
    .replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const x = (i % 5) * CELL_W + 5;
  const y = Math.floor(i / 5) * CELL_H + 5;
  acc += `<g transform="translate(${x},${y})"><svg width="200" height="280" viewBox="0 0 200 280">${inner}</svg></g>`;
  acc += `<text x="${x + 100}" y="${y + 292}" fill="#8A8F9E" font-size="12" text-anchor="middle" font-family="sans-serif">${id}</text>`;
});
acc += `</svg>`;
toPng(acc, path.join(outDir, 'sheet-accessories.png'), CELL_W * 5);
console.log('wrote', path.join(outDir, 'sheet-accessories.png'));
