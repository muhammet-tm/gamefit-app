// The browser side of retention measurement: which Dubai day it is, and when
// an app open is reported. No browser and no network: the rule is a plain
// function with everything it touches passed in.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Prove the result does not depend on the machine's own time zone by running
// in one that is eleven or twelve hours away from Dubai.
process.env.TZ = 'America/Los_Angeles';

const { dubaiDay, shouldRecordOpen, createAppOpenRecorder } = await import(
  '../../src/lib/activityDay.js'
);

describe('dubaiDay', () => {
  it('changes at 20:00:00 UTC, which is midnight in Dubai', () => {
    assert.equal(dubaiDay(new Date('2026-03-01T19:59:59Z')), '2026-03-01');
    assert.equal(dubaiDay(new Date('2026-03-01T20:00:00Z')), '2026-03-02');
  });

  it('handles month and year ends', () => {
    assert.equal(dubaiDay(new Date('2026-01-31T20:00:00Z')), '2026-02-01');
    assert.equal(dubaiDay(new Date('2026-12-31T19:59:59Z')), '2026-12-31');
    assert.equal(dubaiDay(new Date('2026-12-31T20:00:00Z')), '2027-01-01');
    assert.equal(dubaiDay(new Date('2028-02-28T20:00:00Z')), '2028-02-29'); // leap year
  });

  it('always returns zero-padded YYYY-MM-DD, the format Postgres returns', () => {
    assert.match(dubaiDay(new Date('2026-03-05T00:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(dubaiDay(new Date('2026-03-05T00:00:00Z')), '2026-03-05');
  });
});

describe('shouldRecordOpen', () => {
  const lateEvening = new Date('2026-03-01T19:59:59Z'); // 1 March, 23:59:59 in Dubai
  const justAfter = new Date('2026-03-01T20:00:00Z'); //   2 March, 00:00:00 in Dubai

  it('is true when nothing has been recorded yet', () => {
    assert.equal(shouldRecordOpen(null, lateEvening), true);
  });

  it('is false for the rest of the same Dubai day', () => {
    assert.equal(shouldRecordOpen('2026-03-01', lateEvening), false);
  });

  it('is true again one second later, when the Dubai day has changed', () => {
    assert.equal(shouldRecordOpen('2026-03-01', justAfter), true);
  });
});

/** A recorder wired to fakes, with a log of what it did. */
function harness({ userId = 'user-1', visible = true, server, at = '2026-03-01T10:00:00Z' } = {}) {
  const state = {
    userId,
    visible,
    now: new Date(at),
    stored: new Map(),
    serverCalls: 0,
    server: server ?? (() => ({ day: dubaiDay(state.now), missing: false })),
  };
  const record = createAppOpenRecorder({
    getUserId: async () => state.userId,
    recordOnServer: async () => {
      state.serverCalls += 1;
      return state.server();
    },
    readLastDay: (id) => state.stored.get(id) ?? null,
    writeLastDay: (id, day) => state.stored.set(id, day),
    isVisible: () => state.visible,
    now: () => state.now,
  });
  return { state, record };
}

describe('createAppOpenRecorder', () => {
  it('reports the first open of the day and remembers the day the server returned', async () => {
    const { state, record } = harness();
    assert.equal(await record(), 'recorded');
    assert.equal(state.serverCalls, 1);
    assert.equal(state.stored.get('user-1'), '2026-03-01');
  });

  it('does not call the server again on the same Dubai day', async () => {
    const { state, record } = harness();
    await record();
    assert.equal(await record(), 'already-recorded');
    assert.equal(await record(), 'already-recorded');
    assert.equal(state.serverCalls, 1);
  });

  it('reports again once Dubai midnight has passed', async () => {
    const { state, record } = harness({ at: '2026-03-01T19:59:59Z' });
    await record();
    state.now = new Date('2026-03-01T20:00:00Z');
    assert.equal(await record(), 'recorded');
    assert.equal(state.serverCalls, 2);
    assert.equal(state.stored.get('user-1'), '2026-03-02');
  });

  it('does nothing when nobody is signed in', async () => {
    const { state, record } = harness({ userId: null });
    assert.equal(await record(), 'signed-out');
    assert.equal(state.serverCalls, 0);
  });

  it('does nothing while the app is in the background', async () => {
    const { state, record } = harness({ visible: false });
    assert.equal(await record(), 'hidden');
    assert.equal(state.serverCalls, 0);
    state.visible = true;
    assert.equal(await record(), 'recorded');
  });

  it('keeps each user on a shared device separate', async () => {
    const { state, record } = harness();
    await record();
    state.userId = 'user-2';
    assert.equal(await record(), 'recorded');
    assert.equal(state.serverCalls, 2);
  });

  it('retries after a failed call, because nothing was remembered', async () => {
    let fail = true;
    const { state, record } = harness({
      server: () => (fail ? { day: null, missing: false } : { day: '2026-03-01', missing: false }),
    });
    assert.equal(await record(), 'failed');
    assert.equal(state.stored.size, 0);
    fail = false;
    assert.equal(await record(), 'recorded');
  });

  it('stops asking when the database does not have the function yet', async () => {
    const { state, record } = harness({ server: () => ({ day: null, missing: true }) });
    assert.equal(await record(), 'unavailable');
    assert.equal(await record(), 'skipped');
    assert.equal(state.serverCalls, 1);
  });

  it('never throws, even when everything it depends on does', async () => {
    const record = createAppOpenRecorder({
      getUserId: async () => {
        throw new Error('network down');
      },
      recordOnServer: async () => {
        throw new Error('unreachable');
      },
      readLastDay: () => {
        throw new Error('storage blocked');
      },
      writeLastDay: () => {
        throw new Error('storage blocked');
      },
      isVisible: () => true,
    });
    assert.equal(await record(), 'failed');
    assert.equal(await record(), 'failed', 'and it is not left stuck in flight');
  });

  it('does not send two requests when two triggers fire at once', async () => {
    const { state, record } = harness();
    const [a, b] = await Promise.all([record(), record()]);
    assert.deepEqual([a, b].sort(), ['recorded', 'skipped']);
    assert.equal(state.serverCalls, 1);
  });
});
