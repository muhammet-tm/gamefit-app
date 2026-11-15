// Unit tests for src/lib/plural.js. Run with: npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pluralize } from '../../src/lib/plural.js';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('one is singular, everything else is plural', () => {
  assert.equal(pluralize(1, 'day'), '1 day');
  assert.equal(pluralize(0, 'day'), '0 days');
  assert.equal(pluralize(2, 'session'), '2 sessions');
  assert.equal(pluralize(1, 'more day', 'more days'), '1 more day');
});

test('missing or non-numeric counts read as zero, not NaN', () => {
  assert.equal(pluralize(undefined, 'day'), '0 days');
  assert.equal(pluralize(null, 'minute'), '0 minutes');
  assert.equal(pluralize('3', 'day'), '3 days');
});

test('the screens that showed "1 days" go through pluralize', () => {
  const sources = {
    'src/pages/Profile.jsx': /`\$\{user\.(best|current)_streak\} days`/,
    'src/components/gamefit/StreakCalendar.jsx': /Best: \{user\.best_streak\} days/,
    'src/pages/MonthlySummary.jsx': /\{data\.count\} sessions|\{stats\.bestDay\.duration\} minutes/,
  };
  for (const [file, bad] of Object.entries(sources)) {
    assert.doesNotMatch(readFileSync(`${root}${file}`, 'utf-8'), bad, `${file} still hard-codes a plural`);
  }
});
