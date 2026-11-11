// Cohort arithmetic, checked against answers worked out by hand.
//
// Every expected number below is derived from tests/unit/retention-fixture.mjs
// and nothing else. The derivation is written next to each table so that a
// failing test can be settled by reading, without running anything.
//
// Run with: npm run test:unit
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, rows } from './pg-harness.mjs';
import { AS_OF, USERS, loadFixture } from './retention-fixture.mjs';

const ANY = '{app_open,workout,coach}'; // the default definition of "active"
const CORE = '{workout,coach}'; //          actions only, available for all history
const WORKOUT = '{workout}'; //             the strictest definition

let db;

before(async () => {
  db = await createDatabase();
  await loadFixture(db);
});

after(async () => {
  await db?.close();
});

// ---------------------------------------------------------------- helpers

/** retention_cohorts() as plain rows with dates and rates as text. */
async function cohorts({
  asOf = AS_OF,
  sources = ANY,
  onboardedOnly = false,
  from = null,
  to = null,
} = {}) {
  const result = await rows(
    db,
    `select coalesce(cohort_week::text, 'ALL') as cohort,
            day_n, cohort_size, eligible,
            retained_on_day, rate_on_day::text as rate_on_day,
            retained_on_or_after, rate_on_or_after::text as rate_on_or_after,
            app_open_tracked
       from public.retention_cohorts(
              p_as_of => $1::date, p_sources => $2::text[], p_onboarded_only => $3::boolean,
              p_signup_from => $4::date, p_signup_to => $5::date)`,
    [asOf, sources, onboardedOnly, from, to],
  );
  return result.map((r) => [
    r.cohort,
    r.day_n,
    r.cohort_size,
    r.eligible,
    r.retained_on_day,
    r.rate_on_day,
    r.retained_on_or_after,
    r.rate_on_or_after,
    r.app_open_tracked,
  ]);
}

const only = (table, cohort) => table.filter((r) => r[0] === cohort);

async function activeDays({ asOf = AS_OF, sources = ANY, windowDays = 30 } = {}) {
  const result = await rows(
    db,
    `select coalesce(cohort_week::text, 'ALL') as cohort, cohort_size, users,
            median_active_days::text as median, mean_active_days::text as mean,
            p25_active_days::text as p25, p75_active_days::text as p75,
            max_active_days, users_with_zero_days
       from public.retention_active_days(
              p_as_of => $1::date, p_sources => $2::text[], p_window_days => $3::integer)`,
    [asOf, sources, windowDays],
  );
  return result.map((r) => [
    r.cohort,
    r.cohort_size,
    r.users,
    r.median,
    r.mean,
    r.p25,
    r.p75,
    r.max_active_days,
    r.users_with_zero_days,
  ]);
}

async function weekly({ asOf = AS_OF, sources = ANY } = {}) {
  const result = await rows(
    db,
    `select week_start::text as week, registered_users, active_users,
            workout_users, workouts, workouts_per_active_user::text as wpau,
            coach_users, coach_requests, coach_requests_per_active_user::text as cpau
       from public.retention_weekly_engagement(p_as_of => $1::date, p_sources => $2::text[])`,
    [asOf, sources],
  );
  return result.map((r) => [
    r.week,
    r.registered_users,
    r.active_users,
    r.workout_users,
    r.workouts,
    r.wpau,
    r.coach_users,
    r.coach_requests,
    r.cpau,
  ]);
}

async function report({
  asOf = AS_OF,
  sources = ANY,
  onboardedOnly = false,
  from = null,
  to = null,
} = {}) {
  const [row] = await rows(
    db,
    `select public.retention_report(
              p_as_of => $1::date, p_sources => $2::text[], p_onboarded_only => $3::boolean,
              p_signup_from => $4::date, p_signup_to => $5::date) as r`,
    [asOf, sources, onboardedOnly, from, to],
  );
  return row.r;
}

// ---------------------------------------------------------------- the calendar

describe('fixture calendar', () => {
  it('the dates the fixture calls Mondays are Mondays', () => {
    for (const day of ['2026-03-02', '2026-03-09', '2026-03-16', '2026-04-06', '2026-04-13']) {
      assert.equal(new Date(`${day}T00:00:00Z`).getUTCDay(), 1, `${day} should be a Monday`);
    }
    assert.equal(new Date(`${AS_OF}T00:00:00Z`).getUTCDay(), 0, 'the as-of day is a Sunday');
  });
});

// ---------------------------------------------------------------- Dubai days

describe('signup day and cohort week use the Dubai calendar', () => {
  it('places each account on its Dubai day, including the ones at midnight', async () => {
    const scope = await rows(
      db,
      `select p.email, s.signup_day::text as signup_day, s.cohort_week::text as cohort_week
         from public.retention_scope($1::date, false, null, null) s
         join public.profiles p on p.id = s.user_id
        order by s.signup_day, p.email`,
      [AS_OF],
    );
    assert.deepEqual(
      scope.map((r) => [r.email.split('@')[0], r.signup_day, r.cohort_week]),
      [
        // 20:00:00 UTC on Sunday 1 March is already Monday 2 March in Dubai.
        ['alice', '2026-03-02', '2026-03-02'],
        ['bilal', '2026-03-03', '2026-03-02'],
        // 19:59:59 UTC on 8 March: the last second of Sunday, so still this week.
        ['chen', '2026-03-08', '2026-03-02'],
        // One second later: Monday 9 March, the next cohort.
        ['dana', '2026-03-09', '2026-03-09'],
        ['emre', '2026-03-11', '2026-03-09'],
        ['farah', '2026-04-06', '2026-04-06'],
        // 21:00 UTC on 11 April is Sunday 12 April in Dubai.
        ['gus', '2026-04-12', '2026-04-06'],
        // qa (flagged), admin (role) and late (signed up 13 April Dubai time,
        // after the as-of day) are absent.
      ],
    );
  });

  it('counts activity on its Dubai day, including the rows at midnight', async () => {
    const activity = await rows(
      db,
      `select a.day::text as day
         from public.retention_activity($1::date, $2::text[]) a
        where a.user_id = $3
        order by a.day`,
      [AS_OF, ANY, USERS.alice.id],
    );
    assert.deepEqual(
      activity.map((r) => r.day),
      [
        '2026-03-03', // workout at 21:30 UTC on 2 March
        '2026-03-09', // workout at 19:59:59 UTC on 9 March
        '2026-03-16', // coach request at 20:00:00 UTC on 15 March
        '2026-03-23', // app open
        '2026-04-05', // app open
        // Nothing from 13 April: it is after the as-of day.
      ],
    );
  });
});

// ---------------------------------------------------------------- cohort retention

describe('retention_cohorts, default definition (app open, workout, or coach request)', () => {
  // Active days per account, up to 12 April:
  //   alice (day 0 = 2 Mar)   3 Mar d1, 9 Mar d7, 16 Mar d14, 23 Mar d21, 5 Apr d34
  //   bilal (day 0 = 3 Mar)   3 Mar d0, 11 Mar d8, 24 Mar d21
  //   chen  (day 0 = 8 Mar)   16 Mar d8, 22 Mar d14
  //   dana  (day 0 = 9 Mar)   10 Mar d1, 15 Mar d6, 16 Mar d7, 30 Mar d21, 8 Apr d30
  //   emre  (day 0 = 11 Mar)  none
  //   farah (day 0 = 6 Apr)   6 Apr d0, 7 Apr d1, 12 Apr d6
  //   gus   (day 0 = 12 Apr)  12 Apr d0
  //
  // "on day N" / "on day N or later":
  //            d1     d7     d14    d21    d30
  //   alice    y/y    y/y    y/y    y/y    n/y
  //   bilal    n/y    n/y    n/y    y/y    n/n
  //   chen     n/y    n/y    y/y    n/n    n/n
  //   dana     y/y    y/y    n/y    y/y    y/y
  //   emre     n/n    n/n    n/n    n/n    n/n
  //   farah    y/y    day 7 is 13 April: not reached yet
  //   gus      day 1 is 13 April: not reached yet

  //  cohort, day, size, eligible, on day, rate, on or after, rate, app-open tracked
  const EXPECTED = [
    ['2026-03-02', 1, 3, 3, 1, '0.3333', 3, '1.0000', false],
    ['2026-03-02', 7, 3, 3, 1, '0.3333', 3, '1.0000', false],
    ['2026-03-02', 14, 3, 3, 2, '0.6667', 3, '1.0000', false],
    ['2026-03-02', 21, 3, 3, 2, '0.6667', 2, '0.6667', false],
    ['2026-03-02', 30, 3, 3, 0, '0.0000', 1, '0.3333', false],
    ['2026-03-09', 1, 2, 2, 1, '0.5000', 1, '0.5000', false],
    ['2026-03-09', 7, 2, 2, 1, '0.5000', 1, '0.5000', false],
    ['2026-03-09', 14, 2, 2, 0, '0.0000', 1, '0.5000', false],
    ['2026-03-09', 21, 2, 2, 1, '0.5000', 1, '0.5000', false],
    ['2026-03-09', 30, 2, 2, 1, '0.5000', 1, '0.5000', false],
    // Only farah has reached day 1; nobody has reached day 7. A rate with no
    // one eligible is null, never zero.
    ['2026-04-06', 1, 2, 1, 1, '1.0000', 1, '1.0000', true],
    ['2026-04-06', 7, 2, 0, 0, null, 0, null, true],
    ['2026-04-06', 14, 2, 0, 0, null, 0, null, true],
    ['2026-04-06', 21, 2, 0, 0, null, 0, null, true],
    ['2026-04-06', 30, 2, 0, 0, null, 0, null, true],
    // Pooled: the three cohorts added together, eligible users only.
    ['ALL', 1, 7, 6, 3, '0.5000', 5, '0.8333', false],
    ['ALL', 7, 7, 5, 2, '0.4000', 4, '0.8000', false],
    ['ALL', 14, 7, 5, 2, '0.4000', 4, '0.8000', false],
    ['ALL', 21, 7, 5, 3, '0.6000', 3, '0.6000', false],
    ['ALL', 30, 7, 5, 1, '0.2000', 2, '0.4000', false],
  ];

  it('matches the hand-computed table for every cohort and day', async () => {
    assert.deepEqual(await cohorts(), EXPECTED);
  });

  it('gives the same figures whatever time zone the database session is in', async () => {
    // Every table, not only this one: a single expression that leaned on the
    // session time zone anywhere would show up as a difference here.
    const snapshot = async () => ({
      cohorts: await cohorts(),
      activeDays: await activeDays(),
      weekly: await weekly(),
      report: await report(),
    });
    const reference = await snapshot();
    assert.deepEqual(reference.cohorts, EXPECTED);

    for (const zone of ['America/Los_Angeles', 'Pacific/Kiritimati', 'Asia/Dubai']) {
      await db.exec(`set timezone = '${zone}'`);
      try {
        assert.deepEqual(await snapshot(), reference, `session time zone ${zone}`);
      } finally {
        await db.exec('reset timezone');
      }
    }
  });

  it('treats a workout one second before Dubai midnight as the earlier day', async () => {
    // dana's second workout is at 23:59:59 on 15 March, her day 6. Her day 7
    // is retained only because of the app open on 16 March. Under the
    // workout-only definition she is therefore NOT retained on day 7.
    const [day7] = only(await cohorts({ sources: WORKOUT }), '2026-03-09').filter((r) => r[1] === 7);
    assert.deepEqual(day7.slice(3, 8), [2, 0, '0.0000', 0, '0.0000']);
  });
});

describe('retention_cohorts under stricter definitions', () => {
  it('workout or coach request only', async () => {
    // Active days without app opens:
    //   alice 3 Mar d1, 9 Mar d7, 16 Mar d14     bilal 3 Mar d0, 11 Mar d8, 24 Mar d21
    //   dana 10 Mar d1, 15 Mar d6, 8 Apr d30     farah 7 Apr d1     chen, emre, gus: none
    const table = await cohorts({ sources: CORE });
    assert.deepEqual(only(table, '2026-03-02'), [
      ['2026-03-02', 1, 3, 3, 1, '0.3333', 2, '0.6667', null],
      ['2026-03-02', 7, 3, 3, 1, '0.3333', 2, '0.6667', null],
      ['2026-03-02', 14, 3, 3, 1, '0.3333', 2, '0.6667', null],
      ['2026-03-02', 21, 3, 3, 1, '0.3333', 1, '0.3333', null],
      ['2026-03-02', 30, 3, 3, 0, '0.0000', 0, '0.0000', null],
    ]);
    assert.deepEqual(only(table, 'ALL'), [
      ['ALL', 1, 7, 6, 3, '0.5000', 4, '0.6667', null],
      ['ALL', 7, 7, 5, 1, '0.2000', 3, '0.6000', null],
      ['ALL', 14, 7, 5, 1, '0.2000', 3, '0.6000', null],
      ['ALL', 21, 7, 5, 1, '0.2000', 2, '0.4000', null],
      ['ALL', 30, 7, 5, 1, '0.2000', 1, '0.2000', null],
    ]);
  });

  it('workout only', async () => {
    // alice 3 Mar d1, 9 Mar d7. bilal 3 Mar d0, 11 Mar d8 (so "on day 7" no,
    // "day 7 or later" yes). dana 10 Mar d1, 15 Mar d6. farah 7 Apr d1.
    assert.deepEqual(only(await cohorts({ sources: WORKOUT }), 'ALL'), [
      ['ALL', 1, 7, 6, 3, '0.5000', 4, '0.6667', null],
      ['ALL', 7, 7, 5, 1, '0.2000', 2, '0.4000', null],
      ['ALL', 14, 7, 5, 0, '0.0000', 0, '0.0000', null],
      ['ALL', 21, 7, 5, 0, '0.0000', 0, '0.0000', null],
      ['ALL', 30, 7, 5, 0, '0.0000', 0, '0.0000', null],
    ]);
  });

  it('only accounts that finished onboarding', async () => {
    // alice, bilal, dana and farah. chen, emre and gus drop out of both the
    // numerator and the denominator.
    assert.deepEqual(only(await cohorts({ onboardedOnly: true }), 'ALL'), [
      ['ALL', 1, 4, 4, 3, '0.7500', 4, '1.0000', false],
      ['ALL', 7, 4, 3, 2, '0.6667', 3, '1.0000', false],
      ['ALL', 14, 4, 3, 1, '0.3333', 3, '1.0000', false],
      ['ALL', 21, 4, 3, 3, '1.0000', 3, '1.0000', false],
      ['ALL', 30, 4, 3, 1, '0.3333', 2, '0.6667', false],
    ]);
  });
});

describe('the as-of day', () => {
  it('moving it forward one day admits what was waiting behind it', async () => {
    // As of Monday 13 April:
    //   farah reaches day 7, and her 00:00:00 workout that day counts;
    //   gus reaches day 1, and his 00:15 workout counts;
    //   alice's 13 April workout puts her back "on or after" days 21 and 30
    //   under the actions-only definition.
    const any = await cohorts({ asOf: '2026-04-13' });
    assert.deepEqual(only(any, '2026-04-06').slice(0, 2), [
      ['2026-04-06', 1, 2, 2, 2, '1.0000', 2, '1.0000', true],
      ['2026-04-06', 7, 2, 1, 1, '1.0000', 1, '1.0000', true],
    ]);
    // "late" signed up on 13 April, so a fourth cohort appears with nobody
    // eligible for anything yet.
    assert.deepEqual(only(any, '2026-04-13')[0], ['2026-04-13', 1, 1, 0, 0, null, 0, null, true]);

    const core = await cohorts({ asOf: '2026-04-13', sources: CORE });
    assert.deepEqual(
      only(core, '2026-03-02').slice(3),
      [
        ['2026-03-02', 21, 3, 3, 1, '0.3333', 2, '0.6667', null],
        ['2026-03-02', 30, 3, 3, 0, '0.0000', 1, '0.3333', null],
      ],
      'unbounded retention rose; classic retention did not',
    );
  });

  it('defaults to yesterday in Dubai, because today is not over', async () => {
    // One statement, so both sides read the same now(): this cannot flake
    // when the test happens to run across Dubai midnight.
    const [row] = await rows(
      db,
      `select (public.retention_report() ->> 'as_of') as as_of,
              ((now() at time zone 'Asia/Dubai')::date - 1)::text as yesterday`,
    );
    assert.equal(row.as_of, row.yesterday);
  });
});

describe('the signup window', () => {
  it('keeps only accounts that signed up inside it, both ends included', async () => {
    // 9 to 15 March. dana signed up at 00:00:00 on the 9th and is in; chen
    // signed up one second earlier, on the 8th, and is out.
    const table = await cohorts({ from: '2026-03-09', to: '2026-03-15' });
    assert.deepEqual(
      table.map((r) => [r[0], r[1], r[2]]),
      [
        ['2026-03-09', 1, 2],
        ['2026-03-09', 7, 2],
        ['2026-03-09', 14, 2],
        ['2026-03-09', 21, 2],
        ['2026-03-09', 30, 2],
        ['ALL', 1, 2],
        ['ALL', 7, 2],
        ['ALL', 14, 2],
        ['ALL', 21, 2],
        ['ALL', 30, 2],
      ],
    );
  });
});

// ---------------------------------------------------------------- active days

describe('retention_active_days', () => {
  it('first 30 days (day 0 to day 29), default definition', async () => {
    // Only accounts whose 30th day has passed are counted:
    //   alice  window 2 Mar to 31 Mar   3, 9, 16, 23 Mar          4 days (5 Apr is outside)
    //   bilal  window 3 Mar to 1 Apr    3, 11, 24 Mar             3 days
    //   chen   window 8 Mar to 6 Apr    16, 22 Mar                2 days
    //   dana   window 9 Mar to 7 Apr    10, 15, 16, 30 Mar        4 days (8 Apr is day 30, outside)
    //   emre   window 11 Mar to 9 Apr   none                      0 days
    //   farah and gus: window not over yet.
    //
    //  cohort, size, users, median, mean, p25, p75, max, users with zero days
    assert.deepEqual(await activeDays(), [
      ['2026-03-02', 3, 3, '3.00', '3.00', '2.50', '3.50', 4, 0], // 2, 3, 4
      ['2026-03-09', 2, 2, '2.00', '2.00', '1.00', '3.00', 4, 1], // 0, 4
      ['2026-04-06', 2, 0, null, null, null, null, null, 0],
      ['ALL', 7, 5, '3.00', '2.60', '2.00', '4.00', 4, 1], // 0, 2, 3, 4, 4
    ]);
  });

  it('first 30 days, workout or coach request only', async () => {
    // alice 3 (3, 9, 16 Mar), bilal 3 (3, 11, 24 Mar), chen 0, dana 2 (10, 15 Mar), emre 0.
    const table = await activeDays({ sources: CORE });
    assert.deepEqual(only(table, 'ALL'), [['ALL', 7, 5, '2.00', '1.60', '0.00', '3.00', 3, 2]]);
  });

  it('first 7 days (day 0 to day 6)', async () => {
    // Everyone but gus has completed a 7-day window by 12 April.
    //   alice 1 (3 Mar)   bilal 1 (3 Mar: two workouts, one day)   chen 0
    //   dana 2 (10, 15 Mar)   emre 0   farah 3 (6, 7, 12 Apr)
    // Sorted: 0, 0, 1, 1, 2, 3. Mean 7/6.
    const table = await activeDays({ windowDays: 7 });
    assert.deepEqual(only(table, 'ALL'), [['ALL', 7, 6, '1.00', '1.17', '0.25', '1.75', 3, 2]]);
  });
});

// ---------------------------------------------------------------- weekly engagement

describe('retention_weekly_engagement', () => {
  it('one row per complete Dubai week, default definition', async () => {
    //  week, registered, active, workout users, workouts, per active,
    //  coach users, coach requests, per active
    assert.deepEqual(await weekly(), [
      // alice 1 workout, bilal 2 workouts on the same day.
      ['2026-03-02', 3, 2, 2, 3, '1.5000', 0, 0, '0.0000'],
      // alice 1, bilal 1, dana 2.
      ['2026-03-09', 5, 3, 3, 4, '1.3333', 0, 0, '0.0000'],
      // alice (coach request), chen and dana (app opens). No workouts.
      ['2026-03-16', 5, 3, 0, 0, '0.0000', 1, 1, '0.3333'],
      // alice (app open), bilal (coach request).
      ['2026-03-23', 5, 2, 0, 0, '0.0000', 1, 1, '0.5000'],
      // dana and alice, app opens only.
      ['2026-03-30', 5, 2, 0, 0, '0.0000', 0, 0, '0.0000'],
      // dana (two coach requests), farah (one workout), gus (app open).
      ['2026-04-06', 7, 3, 1, 1, '0.3333', 1, 2, '0.6667'],
    ]);
  });

  it('leaves out a week that has not finished', async () => {
    // As of Saturday 11 April the week of 6 April is still open.
    const table = await weekly({ asOf: '2026-04-11' });
    assert.equal(table.at(-1)[0], '2026-03-30');
  });

  it('reports a ratio as null, not zero, when nobody was active', async () => {
    // Workout-only definition: nobody logged a workout in the week of
    // 16 March, so nobody is active, and alice's coach request that week is
    // not attributed to anyone.
    const table = await weekly({ sources: WORKOUT });
    assert.deepEqual(
      table.find((r) => r[0] === '2026-03-16'),
      ['2026-03-16', 5, 0, 0, 0, null, 0, 0, null],
    );
    // Week of 6 April: only farah is active (one workout). dana's two coach
    // requests belong to a user who is not active under this definition.
    assert.deepEqual(
      table.find((r) => r[0] === '2026-04-06'),
      ['2026-04-06', 7, 1, 1, 1, '1.0000', 0, 0, '0.0000'],
    );
  });
});

// ---------------------------------------------------------------- the report

describe('retention_report', () => {
  it('carries the same rows as the table functions, in one snapshot', async () => {
    const r = await report();
    assert.equal(r.schema_version, 1);
    assert.equal(r.as_of, AS_OF);
    assert.equal(r.time_zone, 'Asia/Dubai');
    assert.deepEqual(r.sources, ['app_open', 'workout', 'coach']);
    assert.equal(r.window_days, 30);

    const table = await cohorts();
    assert.equal(r.cohorts.length, table.length);
    const pooledDay1 = r.cohorts.find((c) => c.is_pooled && c.day_n === 1);
    assert.deepEqual(
      [pooledDay1.cohort_size, pooledDay1.eligible, pooledDay1.retained_on_day,
        pooledDay1.rate_on_day, pooledDay1.retained_on_or_after, pooledDay1.rate_on_or_after],
      [7, 6, 3, 0.5, 5, 0.8333],
    );
    assert.equal(r.weekly.length, 6);
    assert.equal(r.active_days.find((d) => d.is_pooled).median_active_days, 3);
  });

  it('counts the accounts in scope and the accounts left out', async () => {
    const r = await report();
    assert.deepEqual(r.accounts, {
      in_scope: 7,
      onboarded: 4, // alice, bilal, dana, farah
      first_signup_day: '2026-03-02',
      last_signup_day: '2026-04-12',
      excluded: 2, // qa (flagged) and admin (role)
    });
    assert.equal(r.app_open_tracking_since, '2026-03-16');
  });

  it('counts as excluded only accounts the report would otherwise have held', async () => {
    // Signup window 9 to 15 March: dana and emre are in scope. The admin
    // account signed up on 10 March and is excluded from this report. The QA
    // account signed up on 2 March, outside the window: it was never in this
    // report, so it is not "excluded" from it.
    const r = await report({ from: '2026-03-09', to: '2026-03-15' });
    assert.deepEqual(r.accounts, {
      in_scope: 2,
      onboarded: 1, // dana
      first_signup_day: '2026-03-09',
      last_signup_day: '2026-03-11',
      excluded: 1, // admin only
    });
  });

  it('dates the start of app-open recording from counted accounts, up to the as-of day', async () => {
    // The QA account has an open on 3 March. If that counted, the cohort of
    // 9 March would be marked as fully recorded when none of its opens were.
    assert.equal((await report()).app_open_tracking_since, '2026-03-16');

    // As of 15 March no counted account has an open yet, so there is no
    // start date at all, whatever was recorded later.
    assert.equal((await report({ asOf: '2026-03-15' })).app_open_tracking_since, null);
    const early = await cohorts({ asOf: '2026-03-15' });
    assert.ok(early.every((r) => r[8] === false), 'no cohort is marked as tracked');
  });

  it('computes the headline engagement figures', async () => {
    const r = await report();
    assert.deepEqual(r.totals, {
      complete_weeks: 6,
      active_user_weeks: 15, //                      2 + 3 + 3 + 2 + 2 + 3
      workouts_in_complete_weeks: 8, //              3 + 4 + 0 + 0 + 0 + 1
      workouts_per_active_user_week: 0.5333, //      8 / 15
      coach_requests_in_complete_weeks: 4, //        0 + 0 + 1 + 1 + 0 + 2
      coach_requests_per_active_user_week: 0.2667, // 4 / 15
      active_users_ever: 6, //                       everyone but emre
      workouts_total: 8,
      coach_requests_total: 4,
      coach_requests_per_active_user: 0.6667, //     4 / 6
    });
  });

  it('keeps "in complete weeks" and "total" apart when the as-of day is mid-week', async () => {
    // As of Monday 13 April the last complete week is still 6 to 12 April, so
    // the weekly sums do not move. The totals do: three workouts (alice,
    // farah, gus) and one coach request (farah) happened on the 13th, and
    // "late" signed up and opened the app that day.
    const r = await report({ asOf: '2026-04-13' });
    assert.deepEqual(r.totals, {
      complete_weeks: 6,
      active_user_weeks: 15,
      workouts_in_complete_weeks: 8,
      workouts_per_active_user_week: 0.5333,
      coach_requests_in_complete_weeks: 4,
      coach_requests_per_active_user_week: 0.2667,
      active_users_ever: 7, //                   the six from before, plus late
      workouts_total: 11, //                     8 + 3
      coach_requests_total: 5, //                4 + 1
      coach_requests_per_active_user: 0.7143, // 5 / 7
    });
  });
});

// ---------------------------------------------------------------- exclusions

describe('QA, test and staff accounts', () => {
  it('the flag is what keeps the QA account out', async () => {
    // Remove the flag and the QA account must appear: cohort of 2 March grows
    // from 3 to 4. Put it back and it must vanish again. This proves the test
    // above passes because of the exclusion, not by accident.
    await db.query('delete from public.analytics_excluded_users where user_id = $1', [USERS.qa.id]);
    try {
      const [day1] = only(await cohorts(), '2026-03-02');
      assert.equal(day1[2], 4, 'cohort size with the QA account included');
    } finally {
      await db.query(
        `insert into public.analytics_excluded_users (user_id, reason) values ($1, 'qa')`,
        [USERS.qa.id],
      );
    }
    const [day1] = only(await cohorts(), '2026-03-02');
    assert.equal(day1[2], 3);
  });

  it('an admin account is excluded without a flag', async () => {
    const flagged = await rows(db, 'select user_id from public.analytics_excluded_users');
    assert.ok(!flagged.some((f) => f.user_id === USERS.admin.id));
    // admin signed up 10 March; the cohort of 9 March is still dana and emre.
    const [day1] = only(await cohorts(), '2026-03-09');
    assert.equal(day1[2], 2);
  });
});

// ---------------------------------------------------------------- bad arguments

describe('argument checking', () => {
  it('rejects a source it does not know, instead of returning zeros', async () => {
    await assert.rejects(cohorts({ sources: '{workout,meal}' }), /only app_open, workout, coach/);
    await assert.rejects(cohorts({ sources: '{}' }), /at least one source/);
  });

  it('rejects an impossible day or window', async () => {
    await assert.rejects(
      rows(db, `select * from public.retention_cohorts(p_as_of => $1::date, p_days => array[-1])`, [AS_OF]),
      /p_days/,
    );
    await assert.rejects(activeDays({ windowDays: 0 }), /p_window_days/);
  });
});
