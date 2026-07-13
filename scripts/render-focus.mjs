// Quick zoom render of one avatar for detail review.
// Usage: npx tsx scripts/render-focus.mjs <class> <tier> <outfile> [width]
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';

import Avatar from '../src/components/avatar/Avatar.jsx';
import { SKIN_TONES, CLASS_COLORS, HAIR_COLORS } from '../src/components/avatar/palettes.js';

const [cls = 'warrior', tier = '4', out = 'focus.png', width = '600'] = process.argv.slice(2);

const markup = renderToStaticMarkup(
  React.createElement(Avatar, {
    avatarClass: cls, tier: Number(tier), skinTone: 'tan', hair: 'short_black',
    animate: false, size: 200,
  }),
);
const skin = SKIN_TONES.tan, hair = HAIR_COLORS.black, c = CLASS_COLORS[cls];
const baked = markup
  .replaceAll('var(--av-skin-shadow)', skin.shadow)
  .replaceAll('var(--av-skin)', skin.base)
  .replaceAll('var(--av-hair-shadow)', hair.shadow)
  .replaceAll('var(--av-hair)', hair.base)
  .replaceAll('var(--av-c1)', c.c1)
  .replaceAll('var(--av-c2)', c.c2)
  .replaceAll('var(--av-metal)', c.metal)
  .replaceAll('var(--av-glow)', c.glow);

const withNs = baked.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
const resvg = new Resvg(withNs, { fitTo: { mode: 'width', value: Number(width) }, background: '#161A22' });
fs.writeFileSync(out, resvg.render().asPng());
console.log('wrote', out);
