// Unit tests for the coach pup: what it says (src/lib/coach.js), the poses it
// can take (src/components/brand/pupRig.js), and the one name both runtimes use.
// Run with: npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COACH_NAME, coachMoment, completionLine } from '../../src/lib/coach.js';
import { POSES, POSE_NAMES } from '../../src/components/brand/pupRig.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
// A fixed evening and a fixed morning, local time, so the streak rule is testable.
const EVENING = new Date(2026, 10, 15, 20, 0);
const MORNING = new Date(2026, 10, 15, 9, 0);
const TODAY = new Date(2026, 10, 15, 7, 30).toISOString();
const YESTERDAY = new Date(2026, 10, 14, 18, 0).toISOString();

test('a new player is waved at and pointed to the first workout', () => {
  const m = coachMoment({}, MORNING);
  assert.equal(m.pose, 'wave');
  assert.equal(m.action, 'train');
});

test('training today: thumbs up, or a cheer when it also hit the weekly target', () => {
  assert.equal(coachMoment({ last_workout_date: TODAY, weekly_workout_count: 1, weekly_goal: 3 }, MORNING).pose, 'thumbsUp');
  const hit = coachMoment({ last_workout_date: TODAY, weekly_workout_count: 3, weekly_goal: 3 }, MORNING);
  assert.equal(hit.pose, 'cheer');
  assert.match(hit.line, /3 of 3/);
});

test('target already met on an earlier day reads as a rest day', () => {
  const m = coachMoment({ last_workout_date: YESTERDAY, weekly_workout_count: 4, weekly_goal: 3, current_streak: 2 }, EVENING);
  assert.equal(m.pose, 'sleep');
  assert.equal(m.action, null);
});

test('a live streak is only flagged as at risk in the evening', () => {
  const user = { last_workout_date: YESTERDAY, weekly_workout_count: 1, weekly_goal: 3, current_streak: 4 };
  const evening = coachMoment(user, EVENING);
  assert.equal(evening.pose, 'worried');
  assert.match(evening.line, /4-day streak/);
  assert.equal(coachMoment(user, MORNING).pose, 'point');
});

test('the remaining count is spelled out, with a singular for the last one', () => {
  const two = coachMoment({ last_workout_date: YESTERDAY, weekly_workout_count: 1, weekly_goal: 3 }, MORNING);
  assert.match(two.line, /^2 workouts/);
  const one = coachMoment({ last_workout_date: YESTERDAY, weekly_workout_count: 2, weekly_goal: 3 }, MORNING);
  assert.match(one.line, /^One more workout/);
});

test('workout complete: error, then badge, then near rank-up, then streak', () => {
  assert.equal(completionLine({ saveError: 'x', badge: 'First Sweat' }).pose, 'sad');
  assert.equal(completionLine({ badge: 'First Sweat', near: true, nextRank: 'Novice II', toGo: 10 }).pose, 'cheer');
  const near = completionLine({ near: true, nextRank: 'Novice II', toGo: 40, streak: 5 });
  assert.equal(near.pose, 'point');
  assert.match(near.line, /40 XP to Novice II/);
  assert.equal(completionLine({ streak: 5 }).pose, 'fistPump');
  assert.equal(completionLine({ streak: 1 }).pose, 'thumbsUp');
  // "near" with nothing left to earn (the top rank) falls through to the streak
  assert.equal(completionLine({ near: true, nextRank: undefined, toGo: 0, streak: 3 }).pose, 'fistPump');
});

test('every pose the app asks for exists in the rig', () => {
  const asked = new Set<string>();
  for (const r of [coachMoment({}), coachMoment({ last_workout_date: TODAY, weekly_workout_count: 9 })]) asked.add(r.pose);
  for (const s of [{ saveError: 'x' }, { badge: 'b' }, { near: true, nextRank: 'r', toGo: 1 }, { streak: 3 }, {}]) {
    asked.add(completionLine(s).pose);
  }
  // Poses written into page source as pose="..." or pose: '...'
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
    const p = `${dir}/${f}`;
    return statSync(p).isDirectory() ? walk(p) : /\.(jsx|js)$/.test(f) ? [p] : [];
  });
  // Only files that draw the pup: athlete pictures have poses of their own
  // (celebrate, elite) under the same prop name.
  for (const file of walk(`${root}src`)) {
    const src = readFileSync(file, 'utf-8');
    if (!/brand\/Coach(Pup|Line)'/.test(src)) continue;
    for (const m of src.matchAll(/\bpose(?:=|: )["']([a-zA-Z]+)["']/g)) asked.add(m[1]);
  }
  const missing = [...asked].filter((p) => !(p in POSES));
  assert.deepEqual(missing, [], `poses used but not defined: ${missing.join(', ')}`);
});

test('every pose sets the fields the rig reads', () => {
  for (const name of POSE_NAMES) {
    const p = POSES[name];
    for (const k of ['armL', 'armR', 'head', 'eyes', 'mouth', 'ears', 'tail']) {
      assert.ok(k in p, `${name} is missing ${k}`);
    }
  }
});

test('the app and the Edge Functions use the same coach name', () => {
  const server = readFileSync(`${root}supabase/functions/_shared/coach.ts`, 'utf-8');
  const m = server.match(/COACH_NAME = '([^']+)'/);
  assert.ok(m, 'COACH_NAME not found in supabase/functions/_shared/coach.ts');
  assert.equal(m[1], COACH_NAME);
});

test('no user-facing source spells the coach name out instead of using the constant', () => {
  const files = [
    'src/pages/Coach.jsx', 'src/pages/AvatarCoach.jsx', 'src/pages/Premium.jsx', 'src/pages/Onboarding.jsx',
    'src/pages/legal/Privacy.jsx', 'src/pages/legal/Terms.jsx', 'src/lib/RouteMeta.jsx', 'src/lib/mockData.js',
    'src/components/gamefit/NotificationsPanel.jsx', 'supabase/functions/coach-g/index.ts',
    'supabase/functions/stripe-webhook/index.ts', 'vite.config.js',
  ];
  for (const f of files) {
    const code = readFileSync(`${root}${f}`, 'utf-8').replace(/\/\/.*$/gm, '');
    assert.ok(!code.includes(COACH_NAME), `${f} spells out "${COACH_NAME}"`);
  }
});
