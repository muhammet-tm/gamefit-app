// Builds the Kit Bag item images in public/kitbag/ from the transparent
// cut-outs (GameFit_item_<id>.png).
//
//   node scripts/build-kitbag-assets.mjs <cutoutDir>
//
// The items were generated on flat green with Seedream 5.0 Flash and keyed
// out with key_items.py; the cut-outs and the generation record live outside
// the repository in the owner's "Design directions/Athletes/kitbag_items"
// folder. Outputs are committed, so a build never needs them or ffmpeg.
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KIT_ITEMS, kitImage } from '../src/components/avatar/kitbag.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src || !existsSync(src)) {
  console.error('usage: node scripts/build-kitbag-assets.mjs <cutoutDir>');
  process.exit(1);
}
mkdirSync(join(root, 'public', 'kitbag'), { recursive: true });

const MAX = 360; // longest side in px: sharp at 3x on the largest card
let bytes = 0;
for (const item of KIT_ITEMS.filter(i => i.slot !== 'finish')) {
  const input = join(src, `GameFit_item_${item.id}.png`);
  if (!existsSync(input)) { console.error('missing', input); process.exit(1); }
  const out = join(root, 'public', kitImage(item.id));
  const scale = item.aspect >= 1 ? `scale=-2:${MAX}` : `scale=${MAX}:-2`;
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-vf', `${scale}:flags=lanczos`,
    '-c:v', 'libwebp', '-pix_fmt', 'yuva420p', '-quality', '85', '-frames:v', '1', out], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
  bytes += statSync(out).size;
  console.log(item.id);
}
console.log(`wrote ${KIT_ITEMS.filter(i => i.slot !== 'finish').length} item images (${(bytes / 1024).toFixed(0)} KB)`);
