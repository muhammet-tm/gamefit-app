// The GameFit mark, defined exactly once.
//
// Shapes live as plain descriptors rather than as an SVG string because two
// very different consumers need them and neither may drift from the other:
// `src/components/brand/Logo.jsx` maps them to real JSX elements, and
// `scripts/generate-brand-assets.mjs` serialises them for resvg to rasterise
// into the PWA icons, favicons and store assets.
//
// A string would have been shorter, but rendering it in React means
// `dangerouslySetInnerHTML`. The phase 7 security pass recorded zero such
// sinks in this codebase and that property is worth more than the brevity.

// The coach pup's head (owner picked mascot option 01, 2026-11-15): a
// Siberian husky in slate and white with ice-blue eyes. It replaced the
// goggled orange husky of 2026-09-24. The Ignition orange left the fur and now
// lives on the pup's tee in the app and on FIT in the wordmark, so the mark
// stops reading as a fox while the brand colour stays.
//
// The head is drawn in the coordinates of the animated rig
// (src/components/brand/CoachPup.jsx, a 200x240 body grid) and placed on the
// mark's 200x200 grid by one transform per rig. The numbers are the rig's own,
// so the logo and the moving coach are the same face. If you redraw the head
// in CoachPup.jsx, carry the change here (and to gamefit-web's Logo.astro).
export const BRAND = {
  fur: '#5E6672',      // slate
  furDark: '#434A55',  // eye mask
  face: '#F4F4F2',     // white mask
  eye: '#7FC8F0',      // ice blue
  ear: '#E9B8B0',      // inner ear
  tongue: '#F07C86',
  blush: '#F28C8C',
  line: '#18181B',     // outline, pupils, nose
  accent: '#FF6B00',   // Ignition orange, = --gf-ember (dark): FIT, the tee
  ground: '#141416',   // --gf-bg-primary, the app icon and splash ground
  surface: '#1E1E21',  // --gf-bg-surface
  gold: '#F4B044',     // --gf-gold, reward color (not used by the mark)
  text: '#F5F5F4',     // --gf-text-primary
};

// The head spans x45..155 and y13..129 on the rig grid (ear tips to chin,
// outline included). Centred on (100,71) and scaled 1.6, it fills y7..193.
const HEAD_ON_GRID = 'translate(100 100) scale(1.6) translate(-100 -71)';

const EARS = [
  { t: 'path', d: 'M56,66 L61,16 Q66,13 72,17 L94,44 Z', fill: BRAND.fur },
  { t: 'path', d: 'M144,66 L139,16 Q134,13 128,17 L106,44 Z', fill: BRAND.fur },
  { t: 'path', d: 'M64,56 L66,28 L84,44 Z', fill: BRAND.ear, stroke: 'none' },
  { t: 'path', d: 'M136,56 L134,28 L116,44 Z', fill: BRAND.ear, stroke: 'none' },
];
const SKULL = [
  { t: 'ellipse', cx: 100, cy: 80, rx: 53, ry: 47, fill: BRAND.fur },
  // the white mask, unstroked: its edge is a colour change, not a line
  { t: 'path', d: 'M50,86 C50,72 63,63 74,66 C83,69 88,76 92,68 L100,38 L108,68 C112,76 117,69 126,66 C137,63 150,72 150,86 C150,111 129,127 100,127 C71,127 50,111 50,86 Z', fill: BRAND.face, stroke: 'none' },
];
const NOSE = { t: 'path', d: 'M91,97 Q100,93 109,97 Q105,105 100,106 Q95,105 91,97 Z', fill: BRAND.line, stroke: 'none' };

// Full detail: brow spots, catchlights, blush and the tongue in the grin.
// Correct from roughly 48px upward.
export const MASCOT_DETAILED = {
  stroke: BRAND.line,
  strokeWidth: 4,
  transform: HEAD_ON_GRID,
  shapes: [
    ...EARS,
    ...SKULL,
    { t: 'ellipse', cx: 78, cy: 62, rx: 5, ry: 3.4, fill: BRAND.face, stroke: 'none' },
    { t: 'ellipse', cx: 122, cy: 62, rx: 5, ry: 3.4, fill: BRAND.face, stroke: 'none' },
    { t: 'circle', cx: 79, cy: 83, r: 12, fill: BRAND.furDark, stroke: 'none' },
    { t: 'circle', cx: 121, cy: 83, r: 12, fill: BRAND.furDark, stroke: 'none' },
    { t: 'circle', cx: 79, cy: 83, r: 10, fill: BRAND.eye, strokeWidth: 3 },
    { t: 'circle', cx: 121, cy: 83, r: 10, fill: BRAND.eye, strokeWidth: 3 },
    { t: 'circle', cx: 79, cy: 84, r: 5.5, fill: BRAND.line, stroke: 'none' },
    { t: 'circle', cx: 121, cy: 84, r: 5.5, fill: BRAND.line, stroke: 'none' },
    { t: 'circle', cx: 82.5, cy: 79.5, r: 3, fill: '#FFFFFF', stroke: 'none' },
    { t: 'circle', cx: 124.5, cy: 79.5, r: 3, fill: '#FFFFFF', stroke: 'none' },
    { t: 'ellipse', cx: 68, cy: 102, rx: 7, ry: 4, fill: BRAND.blush, opacity: 0.35, stroke: 'none' },
    { t: 'ellipse', cx: 132, cy: 102, rx: 7, ry: 4, fill: BRAND.blush, opacity: 0.35, stroke: 'none' },
    NOSE,
    { t: 'path', d: 'M89,108 Q100,124 111,108 Z', fill: BRAND.line, stroke: 'none' },
    { t: 'path', d: 'M95,115 Q100,121 105,115 Z', fill: BRAND.tongue, stroke: 'none' },
  ],
};

// Same head, heavier line, and everything under half a pixel at 16px is gone:
// no brow spots, catchlights, blush or tongue. The eyes grow and lose their
// ring, because a 3-unit ring is noise at favicon size. Use at or below 48px.
export const MASCOT_SIMPLE = {
  stroke: BRAND.line,
  strokeWidth: 5.5,
  transform: HEAD_ON_GRID,
  shapes: [
    ...EARS,
    ...SKULL,
    { t: 'circle', cx: 79, cy: 84, r: 12.5, fill: BRAND.furDark, stroke: 'none' },
    { t: 'circle', cx: 121, cy: 84, r: 12.5, fill: BRAND.furDark, stroke: 'none' },
    { t: 'circle', cx: 79, cy: 84, r: 10, fill: BRAND.eye, stroke: 'none' },
    { t: 'circle', cx: 121, cy: 84, r: 10, fill: BRAND.eye, stroke: 'none' },
    { t: 'circle', cx: 79, cy: 85, r: 6, fill: BRAND.line, stroke: 'none' },
    { t: 'circle', cx: 121, cy: 85, r: 6, fill: BRAND.line, stroke: 'none' },
    NOSE,
    { t: 'path', d: 'M88,108 Q100,126 112,108 Z', fill: BRAND.line, stroke: 'none' },
  ],
};

// GAMEFIT lettering, drawn as outlines on a 100-unit cap height so it never
// depends on a font being installed, subsetted or loaded. `x` is each glyph's
// left edge; the run is 601 units wide. GAME takes the text tone, FIT gold.
//
// G is two shapes on purpose. As a single path the bar reads as a second
// subpath and punches a notch out of the bowl instead of joining it.
export const WORDMARK_WIDTH = 601;
export const WORDMARK_HEIGHT = 100;

export const WORDMARK_GLYPHS = [
  {
    x: 0, tone: 'text', shapes: [
      { t: 'path', d: 'M72.6,29.1 A32.5,36.5 0 1 0 72.6,70.9', fill: 'none', stroke: 'inherit', strokeWidth: 27, strokeLinecap: 'butt' },
      { t: 'path', d: 'M46,40 L92,40 L92,64 L83,73 L46,73 Z' },
    ],
  },
  {
    x: 102, tone: 'text', shapes: [
      { t: 'path', d: 'M37,0 L49,0 L86,100 L59,100 L52,80 L34,80 L27,100 L0,100 Z M43,26 L35,60 L51,60 Z', fillRule: 'evenodd' },
    ],
  },
  {
    x: 198, tone: 'text', shapes: [
      { t: 'path', d: 'M0,100 L0,0 L27,0 L53,60 L79,0 L106,0 L106,100 L79,100 L79,46 L61,86 L45,86 L27,46 L27,100 Z' },
    ],
  },
  {
    x: 314, tone: 'text', shapes: [
      { t: 'path', d: 'M0,0 L67,0 L76,9 L76,25 L27,25 L27,37 L66,37 L66,62 L27,62 L27,75 L76,75 L76,91 L67,100 L0,100 Z' },
    ],
  },
  {
    x: 400, tone: 'accent', shapes: [
      { t: 'path', d: 'M0,0 L65,0 L74,9 L74,25 L27,25 L27,40 L65,40 L65,65 L27,65 L27,100 L0,100 Z' },
    ],
  },
  {
    x: 484, tone: 'accent', shapes: [
      { t: 'path', d: 'M0,0 L27,0 L27,100 L0,100 Z' },
    ],
  },
  {
    x: 521, tone: 'accent', shapes: [
      { t: 'path', d: 'M9,0 L71,0 L80,9 L80,25 L53,25 L53,100 L27,100 L27,25 L0,25 L0,9 Z' },
    ],
  },
];

// Gold as *text* fails on a light ground: #F4B044 measures 1.9:1 on white.
// Same split the design system already applies to --gf-gold / --gf-gold-text.
export const WORDMARK_TONES = {
  // FIT takes the accent: the fur's orange on dark, and the text-safe
  // --gf-ember-text on light (the raw orange is ~2.9:1 on white).
  dark: { text: BRAND.text, accent: BRAND.accent },
  light: { text: BRAND.ground, accent: '#B13A09' },
};

// Serialise a shape set to SVG markup. Used by the asset generator and by the
// site's build step; the React component does not go through here.
export function shapesToSvg({ stroke, strokeWidth, transform, shapes }) {
  const attr = (o) => Object.entries(o)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${v}"`)
    .join(' ');
  const body = shapes.map((s) => {
    const { t, ...rest } = s;
    return `<${t} ${attr(rest)}/>`;
  }).join('');
  const place = transform ? ` transform="${transform}"` : '';
  return `<g${place} stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round">${body}</g>`;
}

// Serialise the lettering. `tone` picks the dark- or light-ground pair.
export function wordmarkToSvg(tone = 'dark') {
  const c = WORDMARK_TONES[tone] ?? WORDMARK_TONES.dark;
  return WORDMARK_GLYPHS.map((g) => {
    const colour = c[g.tone];
    const body = g.shapes.map((s) => {
      // `fill` and `stroke` come out of the spread deliberately: both are
      // re-emitted below from the tone, and leaving either in the rest object
      // writes the attribute twice, which resvg rejects outright.
      const { t, stroke, fill, ...rest } = s;
      const parts = Object.entries(rest)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)}="${v}"`);
      parts.push(`fill="${fill === 'none' ? 'none' : colour}"`);
      if (stroke) parts.push(`stroke="${colour}"`);
      return `<${t} ${parts.join(' ')}/>`;
    }).join('');
    return `<g transform="translate(${g.x},0)">${body}</g>`;
  }).join('');
}
