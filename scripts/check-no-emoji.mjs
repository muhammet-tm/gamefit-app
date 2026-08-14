// Fails if emoji reappear in UI source.
//
// Usage: npx tsx scripts/check-no-emoji.mjs [--list]
//
// The app shipped ~101 emoji across eight files. They were replaced with drawn
// lucide icons for three reasons that all still apply:
//
//   1. An emoji is rendered by the operating system, not by us. The same
//      screen looked different on Android, iOS, Windows and macOS, and several
//      glyphs (the flexed bicep, the herb, the coin) differ enough between
//      vendors to change what the label appears to mean.
//   2. They cannot be themed. Every other mark in the app answers to the
//      palette; an emoji is a fixed colour bitmap that ignores light mode.
//   3. Coverage is not guaranteed. A missing glyph renders as tofu, and at the
//      sizes these were used (text-3xl, text-5xl) that is very visible.
//
// Comments are exempt: prose describing past behaviour is not UI.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'src';
const LIST = process.argv.includes('--list');

// Pictographic ranges. Deliberately excludes arrows and maths symbols, which
// appear legitimately in comments and are rendered as text, not as emoji.
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{1F004}\u{1F0CF}\u{2648}-\u{2653}\u{26A0}-\u{27BF}\u{2B50}\u{2B55}\u{2705}\u{274C}\u{2764}]/u;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) yield full;
  }
}

const findings = [];
for (const file of walk(ROOT)) {
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    const hits = [...line].filter(c => EMOJI.test(c));
    if (hits.length) {
      findings.push({
        file, line: i + 1, count: hits.length,
        codes: hits.map(c => `U+${c.codePointAt(0).toString(16).toUpperCase()}`).join(' '),
        text: trimmed.slice(0, 90),
      });
    }
  });
}

if (!findings.length) {
  console.log('No emoji in UI source. Use lucide-react, or Icon.jsx for the discipline pictograms.');
  process.exit(0);
}

console.error(`${findings.reduce((n, f) => n + f.count, 0)} emoji found in UI source:`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  ${f.codes}`);
  if (LIST) console.error(`      ${f.text}`);
}
console.error('\nReplace with a lucide-react icon. If lucide has no equivalent, add it to');
console.error('src/components/gamefit/Icon.jsx, which holds the discipline pictograms.');
process.exit(1);
