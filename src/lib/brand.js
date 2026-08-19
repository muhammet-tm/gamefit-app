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

export const BRAND = {
  fur: '#29A3E0',      // husky blue
  line: '#152B47',     // outline, ear interiors, nose, pupils
  muzzle: '#FFFFFF',
  lens: '#A8D9F2',     // goggle glass
  frame: '#8FDC1E',    // goggle frame
  navy: '#0B1A24',     // --gf-bg-primary, the app icon ground
  surface: '#112532',  // --gf-bg-surface
  gold: '#F4B044',     // --gf-gold
  text: '#F2F5F7',     // --gf-text-primary
};

// Drawn on a 200x200 grid. Full detail: catchlights in the eyes, a two-stroke
// smile, an inner ear shadow. Correct from roughly 48px upward.
export const MASCOT_DETAILED = {
  stroke: BRAND.line,
  strokeWidth: 7,
  shapes: [
    // ears: pointed triangles with a curved outer edge
    { t: 'path', d: 'M44,76 C39,50 46,20 59,8 C74,18 90,42 98,60 Z', fill: BRAND.fur },
    { t: 'path', d: 'M156,76 C161,50 154,20 141,8 C126,18 110,42 102,60 Z', fill: BRAND.fur },
    { t: 'path', d: 'M56,66 C52,48 57,28 63,22 C72,32 82,48 88,58 Z', fill: BRAND.line, stroke: 'none' },
    { t: 'path', d: 'M144,66 C148,48 143,28 137,22 C128,32 118,48 112,58 Z', fill: BRAND.line, stroke: 'none' },
    // head, 144 wide x 140 tall
    { t: 'path', d: 'M100,46 C60,46 28,78 28,116 C28,156 60,186 100,186 C140,186 172,156 172,116 C172,78 140,46 100,46 Z', fill: BRAND.fur },
    // muzzle laid over the blue, unstroked: the edge is a colour change, not a line
    { t: 'path', d: 'M34,130 C34,121 44,118 60,118 L140,118 C156,118 166,121 166,130 C166,160 138,186 100,186 C62,186 34,160 34,130 Z', fill: BRAND.muzzle, stroke: 'none' },
    // goggle strap and bridge
    { t: 'path', d: 'M40,92 L52,92', fill: 'none', stroke: BRAND.frame, strokeWidth: 10.5 },
    { t: 'path', d: 'M148,92 L160,92', fill: 'none', stroke: BRAND.frame, strokeWidth: 10.5 },
    { t: 'path', d: 'M97,90 L103,90', fill: 'none', stroke: BRAND.frame, strokeWidth: 12.6 },
    // lenses
    { t: 'rect', x: 52, y: 82, width: 46, height: 38, rx: 13, fill: BRAND.lens, stroke: BRAND.frame, strokeWidth: 10.5 },
    { t: 'rect', x: 102, y: 82, width: 46, height: 38, rx: 13, fill: BRAND.lens, stroke: BRAND.frame, strokeWidth: 10.5 },
    { t: 'circle', cx: 76, cy: 102, r: 9, fill: BRAND.line, stroke: 'none' },
    { t: 'circle', cx: 124, cy: 102, r: 9, fill: BRAND.line, stroke: 'none' },
    { t: 'circle', cx: 83, cy: 95, r: 5, fill: BRAND.muzzle, stroke: 'none' },
    { t: 'circle', cx: 131, cy: 95, r: 5, fill: BRAND.muzzle, stroke: 'none' },
    // nose and mouth
    { t: 'path', d: 'M88,132 C88,129 112,129 112,132 C112,140 105,150 100,150 C95,150 88,140 88,132 Z', fill: BRAND.line, stroke: 'none' },
    { t: 'path', d: 'M100,150 L100,158', fill: 'none', stroke: BRAND.line, strokeWidth: 5.6 },
    { t: 'path', d: 'M100,158 C100,167 88,169 81,163', fill: 'none', stroke: BRAND.line, strokeWidth: 5.6 },
    { t: 'path', d: 'M100,158 C100,167 112,169 119,163', fill: 'none', stroke: BRAND.line, strokeWidth: 5.6 },
  ],
};

// Same silhouette, heavier line, and everything under half a pixel at 16px is
// gone: no catchlights, no smile, no inner-ear shadow. The ears also grow,
// because a 10-unit outline eats a thin triangle alive. Use at or below 48px.
export const MASCOT_SIMPLE = {
  stroke: BRAND.line,
  strokeWidth: 10,
  shapes: [
    { t: 'path', d: 'M42,76 C37,48 45,16 59,4 C75,16 92,42 100,60 Z', fill: BRAND.fur },
    { t: 'path', d: 'M158,76 C163,48 155,16 141,4 C125,16 108,42 100,60 Z', fill: BRAND.fur },
    { t: 'path', d: 'M100,44 C58,44 24,78 24,118 C24,158 58,190 100,190 C142,190 176,158 176,118 C176,78 142,44 100,44 Z', fill: BRAND.fur },
    { t: 'path', d: 'M30,132 C30,122 42,118 60,118 L140,118 C158,118 170,122 170,132 C170,162 140,190 100,190 C60,190 30,162 30,132 Z', fill: BRAND.muzzle, stroke: 'none' },
    { t: 'rect', x: 48, y: 80, width: 48, height: 40, rx: 14, fill: BRAND.lens, stroke: BRAND.frame, strokeWidth: 11 },
    { t: 'rect', x: 104, y: 80, width: 48, height: 40, rx: 14, fill: BRAND.lens, stroke: BRAND.frame, strokeWidth: 11 },
    { t: 'circle', cx: 74, cy: 101, r: 11, fill: BRAND.line, stroke: 'none' },
    { t: 'circle', cx: 126, cy: 101, r: 11, fill: BRAND.line, stroke: 'none' },
    { t: 'path', d: 'M87,134 C87,130 113,130 113,134 C113,143 106,153 100,153 C94,153 87,143 87,134 Z', fill: BRAND.line, stroke: 'none' },
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
    x: 400, tone: 'gold', shapes: [
      { t: 'path', d: 'M0,0 L65,0 L74,9 L74,25 L27,25 L27,40 L65,40 L65,65 L27,65 L27,100 L0,100 Z' },
    ],
  },
  {
    x: 484, tone: 'gold', shapes: [
      { t: 'path', d: 'M0,0 L27,0 L27,100 L0,100 Z' },
    ],
  },
  {
    x: 521, tone: 'gold', shapes: [
      { t: 'path', d: 'M9,0 L71,0 L80,9 L80,25 L53,25 L53,100 L27,100 L27,25 L0,25 L0,9 Z' },
    ],
  },
];

// Gold as *text* fails on a light ground: #F4B044 measures 1.9:1 on white.
// Same split the design system already applies to --gf-gold / --gf-gold-text.
export const WORDMARK_TONES = {
  dark: { text: BRAND.text, gold: BRAND.gold },
  light: { text: BRAND.navy, gold: '#8A5A06' },
};

// Serialise a shape set to SVG markup. Used by the asset generator and by the
// site's build step; the React component does not go through here.
export function shapesToSvg({ stroke, strokeWidth, shapes }) {
  const attr = (o) => Object.entries(o)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${v}"`)
    .join(' ');
  const body = shapes.map((s) => {
    const { t, ...rest } = s;
    return `<${t} ${attr(rest)}/>`;
  }).join('');
  return `<g stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round">${body}</g>`;
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
