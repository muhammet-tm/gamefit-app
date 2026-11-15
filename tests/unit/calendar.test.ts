// Unit tests for the coach's free allowance: the browser's "4 / 10" counter
// and the server's cap must read the same month, and a request that produced
// nothing usable must not cost a credit. Run with: npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dubaiDay, dubaiMonth as clientMonth } from '../../src/lib/activityDay.js';
import { dubaiDate, dubaiMonth as serverMonth } from '../../supabase/functions/_shared/calendar.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (rel: string) => readFileSync(`${root}${rel}`, 'utf-8');

test('the month turns at Dubai midnight, four hours before UTC midnight', () => {
  const cases: [string, string][] = [
    ['2026-11-30T19:59:59Z', '2026-11'],
    ['2026-11-30T20:00:00Z', '2026-12'], // 00:00 on 1 December in Dubai
    ['2026-12-31T19:59:59Z', '2026-12'],
    ['2026-12-31T20:00:00Z', '2027-01'], // and the year turns with it
    ['2027-02-28T20:00:00Z', '2027-03'],
  ];
  for (const [instant, month] of cases) {
    const at = new Date(instant);
    assert.equal(serverMonth(at), month, `server at ${instant}`);
    assert.equal(clientMonth(at), month, `browser at ${instant}`);
  }
});

test('browser and server agree on the day and the month for every hour of two years', () => {
  const start = Date.UTC(2026, 0, 1);
  const end = Date.UTC(2028, 0, 1);
  for (let t = start; t < end; t += 60 * 60 * 1000) {
    const at = new Date(t);
    assert.equal(dubaiDate(at), dubaiDay(at), `day at ${at.toISOString()}`);
    assert.equal(serverMonth(at), clientMonth(at), `month at ${at.toISOString()}`);
  }
});

test('neither side derives the month from a local or UTC clock', () => {
  const fn = read('supabase/functions/coach-g/index.ts');
  assert.doesNotMatch(fn, /\.get(FullYear|Month|Date)\(\)/,
    'coach-g reads a local-time getter: that is the runtime time zone, not Dubai');
  const ctx = read('src/lib/GameFitContext.jsx');
  assert.doesNotMatch(ctx, /toISOString\(\)\.slice\(0, ?7\)/,
    'the counter is filtered by the UTC month again');
});

test('every failure after the credit is reserved hands the credit back', () => {
  const fn = read('supabase/functions/coach-g/index.ts');
  const reserved = fn.indexOf('reservedMonthKey = bucket.key;');
  assert.ok(reserved > 0, 'could not find where coach-g reserves the credit');
  const after = fn.slice(reserved);
  // [^;] keeps each match inside one return statement.
  const failures = [...after.matchAll(/return json\([^;]*?, (\d{3})\);/g)]
    .filter((m) => Number(m[1]) >= 400);
  assert.ok(failures.length >= 3, `expected the 502, 422 and 500 returns, found ${failures.length}`);
  for (const m of failures) {
    const before = after.slice(Math.max(0, m.index! - 400), m.index);
    assert.match(before, /await refundCredit\(\);/,
      `the ${m[1]} response is returned without refunding the credit`);
  }
});

test('the plan button counts a credit only when the plan arrived', () => {
  const coach = read('src/pages/Coach.jsx');
  const start = coach.indexOf("type: 'plan'");
  const handler = coach.slice(start, coach.indexOf('setPlanLoading(false);', start));
  const catchAt = handler.indexOf('} catch (err) {');
  assert.ok(catchAt > 0, 'could not find the plan request handler');
  assert.match(handler.slice(0, catchAt), /incrementAIRequests\(\);/, 'not counted on success');
  assert.doesNotMatch(handler.slice(catchAt), /incrementAIRequests\(\);/,
    'a refused or refunded plan request is counted');
});
