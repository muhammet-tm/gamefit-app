// Quick zoom render of one avatar for detail review.
// Usage: npx tsx scripts/render-focus.mjs <class> <tier> <outfile> [width] [theme]
// theme is 'dark' (default) or 'light'; it picks both the palette and the
// ground, since a mismatched pair tests a combination the app never shows.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';

import Avatar from '../src/components/avatar/Avatar.jsx';
import { bakeAvatarVars } from '../src/components/avatar/palettes.js';

const [cls = 'warrior', tier = '4', out = 'focus.png', width = '600', theme = 'dark'] = process.argv.slice(2);
const GROUND = theme === 'light' ? '#DFE8EE' : '#1A3242';

const markup = renderToStaticMarkup(
  React.createElement(Avatar, {
    avatarClass: cls, tier: Number(tier), skinTone: 'tan', hair: 'short_black',
    animate: false, size: 200, theme,
  }),
);
const baked = bakeAvatarVars(markup, {
  avatarClass: cls, skinTone: 'tan', hair: 'short_black', body: 'male', theme,
});

const withNs = baked.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
const resvg = new Resvg(withNs, { fitTo: { mode: 'width', value: Number(width) }, background: GROUND });
fs.writeFileSync(out, resvg.render().asPng());
console.log('wrote', out);
