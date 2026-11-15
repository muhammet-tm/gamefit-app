// Unit tests for the Kit Bag catalog and placement (src/components/avatar/kitbag.js).
// Run with: npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  KIT_ITEMS, KIT_SLOTS, FRAME, kitImage, normalizeKit, placeItem, wearShows, anchorsFor, itemsForSlot,
} from '../../src/components/avatar/kitbag.js';
import { ATHLETE_IDS, ATHLETE_POSES } from '../../src/components/avatar/athletes.js';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('the catalog is five floor, four wear, and three finish items', () => {
  assert.equal(new Set(KIT_ITEMS.map(i => i.id)).size, KIT_ITEMS.length);
  assert.deepEqual(KIT_SLOTS.map(s => itemsForSlot(s).length), [5, 4, 3]);
});

test('display prices match the server catalog in the Kit Bag migration', () => {
  const dir = root + 'supabase/migrations/';
  const file = readdirSync(dir).find(f => f.endsWith('_kit_bag.sql'));
  const sql = readFileSync(dir + file, 'utf8');
  const rows = [...sql.matchAll(/\('([a-z_]+)',\s*'[^']*',\s*'',\s*(\d+),\s*'[^']*',\s*'(floor|wear|finish)'\)/g)];
  assert.equal(rows.length, KIT_ITEMS.length, 'one catalog row per client item');
  for (const [, id, cost, category] of rows) {
    const item = KIT_ITEMS.find(i => i.id === id);
    assert.ok(item, `client knows ${id}`);
    assert.equal(item.cost, Number(cost), `${id} price`);
    assert.equal(item.slot, category, `${id} slot`);
  }
});

test('every floor and wear item has its image', () => {
  for (const item of KIT_ITEMS.filter(i => i.slot !== 'finish')) {
    assert.ok(existsSync(root + 'public' + kitImage(item.id)), kitImage(item.id));
  }
});

test('anchors exist and are sane for all forty pictures', () => {
  for (const id of ATHLETE_IDS) {
    for (const pose of ATHLETE_POSES) {
      const a = anchorsFor(id, pose);
      assert.ok(a, `${id} ${pose}`);
      assert.ok(a.top < a.eyes && a.eyes < a.chin, `${id} ${pose}: top < eyes < chin`);
      assert.ok(a.cx > 500 && a.cx < 1160 && a.faceW > 120 && a.faceW < 260, `${id} ${pose}: centre and width`);
    }
  }
});

test('every placed item stays inside the picture frame', () => {
  for (const id of ATHLETE_IDS) {
    for (const pose of ATHLETE_POSES) {
      for (const item of KIT_ITEMS.filter(i => i.slot !== 'finish')) {
        const box = placeItem(item.id, id, pose);
        if (!box) continue;
        assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.w <= FRAME.w && box.y + box.h <= FRAME.h,
          `${item.id} on ${id} ${pose}: ${JSON.stringify(box)}`);
      }
    }
  }
});

test('wear items stay off pictures where they would clash', () => {
  for (const pose of ATHLETE_POSES) {
    assert.equal(wearShows('aisha', pose, 'training_cap'), false, `no cap over the hijab (${pose})`);
    assert.equal(wearShows('aisha', pose, 'sweatband'), false, `no sweatband over the hijab (${pose})`);
    assert.equal(wearShows('yara', pose, 'training_cap'), false, `no cap over Yara's bun (${pose})`);
    assert.equal(placeItem('training_cap', 'aisha', pose), null);
  }
  assert.equal(wearShows('daniel', 'rest', 'training_cap'), false, 'Daniel already wears a cap on rest days');
  assert.equal(wearShows('daniel', 'elite', 'finisher_medal'), false, 'Daniel already wears a medal in elite kit');
  assert.equal(wearShows('yara', 'idle', 'sweatband'), true, 'a sweatband still suits Yara');
  // Glasses never clash: they show in every picture.
  for (const id of ATHLETE_IDS) for (const pose of ATHLETE_POSES) assert.ok(wearShows(id, pose, 'sport_glasses'));
  // Floor items never depend on the picture.
  assert.ok(placeItem('kettlebell', 'aisha', 'celebrate'));
});

test('normalizeKit keeps only known, owned items in their own slots', () => {
  assert.deepEqual(normalizeKit({ floor: 'kettlebell', wear: 'finisher_medal' }, ['kettlebell', 'finisher_medal']),
    { floor: 'kettlebell', wear: 'finisher_medal' });
  assert.deepEqual(normalizeKit({ floor: 'kettlebell' }, []), {}, 'unowned items are dropped');
  assert.deepEqual(normalizeKit({ floor: 'training_cap' }, ['training_cap']), {}, 'an item in the wrong slot is dropped');
  assert.deepEqual(normalizeKit({ wear: 'crown' }, ['crown']), {}, 'retired items are dropped');
  assert.deepEqual(normalizeKit(null, []), {});
  assert.deepEqual(normalizeKit({ finish: 'finish_tape' }), { finish: 'finish_tape' }, 'without an owned list, the stored kit is trusted');
});
