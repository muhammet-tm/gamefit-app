// Unit tests for the athlete cast module and its fit with the stored
// avatar_config. Run with: npm run test:unit
//
// The rules under test decide what every existing profile shows the moment
// the cast ships, so the legacy mapping is pinned here pair by pair.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ATHLETES, ATHLETE_IDS, ATHLETE_POSES, ATHLETE_IMAGE_WIDTHS, DISCIPLINE_BY_CLASS,
  athleteForConfig, configForAthlete, athletePose, isRestDay, athleteImage, athleteFace,
} from '../../src/components/avatar/athletes.js';
import { normalizeAvatarConfig } from '../../src/components/avatar/migrate.js';
import { AVATAR_CLASSES } from '../../src/components/avatar/palettes.js';

test('the cast is ten people, one man and one woman per discipline', () => {
  assert.equal(ATHLETES.length, 10);
  assert.equal(new Set(ATHLETE_IDS).size, 10);
  for (const cls of AVATAR_CLASSES) {
    const pair = ATHLETES.filter(a => a.classKey === cls).map(a => a.body).sort();
    assert.deepEqual(pair, ['female', 'male'], `discipline ${DISCIPLINE_BY_CLASS[cls]}`);
  }
});

test('a profile from before the cast keeps its discipline and body', () => {
  const expected = {
    'warrior/male': 'omar', 'warrior/female': 'aisha',
    'archer/male': 'daniel', 'archer/female': 'nadia',
    'ninja/male': 'kofi', 'ninja/female': 'yara',
    'knight/male': 'rami', 'knight/female': 'mei',
    'mage/male': 'arjun', 'mage/female': 'sara',
  };
  for (const [key, id] of Object.entries(expected)) {
    const [cls, body] = key.split('/');
    const cfg = normalizeAvatarConfig({ version: 3, class: cls, body, skin_tone: 'tan', hair: 'short_black' });
    assert.equal(athleteForConfig(cfg).id, id, key);
  }
});

test('missing or broken configs fall back to a real athlete', () => {
  assert.equal(athleteForConfig(normalizeAvatarConfig(null)).id, 'omar');
  assert.equal(athleteForConfig(normalizeAvatarConfig(null, { gender: 'female' })).id, 'aisha');
  assert.equal(athleteForConfig({ athlete: 'nobody', class: 'nope' }).id, 'omar');
});

test('a picked athlete survives normalisation and pins class and body', () => {
  for (const id of ATHLETE_IDS) {
    const saved = configForAthlete(id);
    const cfg = normalizeAvatarConfig(saved);
    assert.equal(cfg.athlete, id);
    assert.equal(athleteForConfig(cfg).id, id);
    const a = ATHLETES.find(x => x.id === id)!;
    assert.equal(cfg.class, a.classKey);
    assert.equal(cfg.body, a.body);
  }
  // A stale class next to a valid athlete is corrected, not trusted.
  const cfg = normalizeAvatarConfig({ ...configForAthlete('mei'), class: 'warrior', body: 'male' });
  assert.equal(cfg.class, 'knight');
  assert.equal(cfg.body, 'female');
});

test('an unknown athlete id is dropped and the class decides', () => {
  const cfg = normalizeAvatarConfig({ version: 3, class: 'archer', body: 'female', athlete: 'zed' });
  assert.equal(cfg.athlete, undefined);
  assert.equal(athleteForConfig(cfg).id, 'nadia');
});

test('pose choice: moment, then elite rank, then rest day', () => {
  assert.equal(athletePose({ tier: 1 }), 'idle');
  assert.equal(athletePose({ tier: 4, resting: true }), 'rest');
  assert.equal(athletePose({ tier: 5, resting: true }), 'elite');
  assert.equal(athletePose({ tier: 5, moment: 'celebrate' }), 'celebrate');
  assert.equal(athletePose({ tier: 2, moment: 'celebrate', resting: true }), 'celebrate');
});

test('a rest day needs the weekly target met and nothing logged today', () => {
  const now = new Date(2026, 10, 14, 18, 0);
  const today = new Date(2026, 10, 14, 7, 0).toISOString();
  const yesterday = new Date(2026, 10, 13, 7, 0).toISOString();
  assert.equal(isRestDay({ weekly_goal: 3, weekly_workout_count: 2, last_workout_date: yesterday }, now), false);
  assert.equal(isRestDay({ weekly_goal: 3, weekly_workout_count: 3, last_workout_date: yesterday }, now), true);
  assert.equal(isRestDay({ weekly_goal: 3, weekly_workout_count: 3, last_workout_date: today }, now), false);
  assert.equal(isRestDay({ weekly_workout_count: 3 }, now), true); // goal defaults to 3
  assert.equal(isRestDay(null, now), false);
});

test('every image the app can ask for exists in public/athletes', () => {
  const publicDir = fileURLToPath(new URL('../../public', import.meta.url));
  for (const id of ATHLETE_IDS) {
    assert.ok(existsSync(publicDir + athleteFace(id)), athleteFace(id));
    for (const pose of ATHLETE_POSES) {
      for (const w of ATHLETE_IMAGE_WIDTHS) {
        assert.ok(existsSync(publicDir + athleteImage(id, pose, w)), athleteImage(id, pose, w));
      }
    }
  }
});
