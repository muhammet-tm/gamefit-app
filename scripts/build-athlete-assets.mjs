// Builds the athlete web images in public/athletes/ from the full-size source
// PNGs (1664x2496, one per athlete and pose).
//
//   node scripts/build-athlete-assets.mjs <sourceDir>
//
// The sources are about 6 MB each and are kept outside the repository, in the
// owner's "Design directions/Athletes" folder. Their names follow
// GameFit_athlete_<id>_<pose>.png. The outputs are committed, like the brand
// kit, so a build never needs the sources or ffmpeg.
//
// Per athlete it writes two widths of each pose (for srcset) and one square
// face crop from the relaxed image for the small round avatars. Requires
// ffmpeg on PATH with libwebp.
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ATHLETES, ATHLETE_POSES, ATHLETE_IMAGE_WIDTHS, ATHLETE_FACE_SIZE,
} from '../src/components/avatar/athletes.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src || !existsSync(src)) {
  console.error('usage: node scripts/build-athlete-assets.mjs <sourceDir>');
  process.exit(1);
}
const out = join(root, 'public', 'athletes');
mkdirSync(out, { recursive: true });

const SRC_W = 1664;
const SRC_H = 2496;
const FACE_SIDE = 500; // source pixels: head plus a little neck and shoulder

function webp(input, filter, file, quality) {
  const r = spawnSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', input, '-vf', filter,
    '-c:v', 'libwebp', '-quality', String(quality), '-compression_level', '6',
    '-frames:v', '1', file,
  ], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${file}: ${r.stderr || r.error}`);
  return statSync(file).size;
}

let files = 0;
let bytes = 0;
const missing = [];
for (const a of ATHLETES) {
  for (const pose of ATHLETE_POSES) {
    const input = join(src, `GameFit_athlete_${a.id}_${pose}.png`);
    if (!existsSync(input)) { missing.push(input); continue; }
    for (const w of ATHLETE_IMAGE_WIDTHS) {
      const h = Math.round((w * SRC_H) / SRC_W);
      bytes += webp(input, `scale=${w}:${h}:flags=lanczos`, join(out, `${a.id}-${pose}-${w}.webp`), 76);
      files++;
    }
  }
  const idle = join(src, `GameFit_athlete_${a.id}_idle.png`);
  if (existsSync(idle)) {
    const x = Math.round((SRC_W - FACE_SIDE) / 2);
    const y = Math.max(0, a.faceY - FACE_SIDE / 2);
    bytes += webp(idle,
      `crop=${FACE_SIDE}:${FACE_SIDE}:${x}:${y},scale=${ATHLETE_FACE_SIZE}:${ATHLETE_FACE_SIZE}:flags=lanczos`,
      join(out, `${a.id}-face.webp`), 80);
    files++;
  }
}

if (missing.length) {
  console.error(`missing ${missing.length} source image(s):\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
console.log(`wrote ${files} images to public/athletes (${(bytes / 1024).toFixed(0)} KB)`);
