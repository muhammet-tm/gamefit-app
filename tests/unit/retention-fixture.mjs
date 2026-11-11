// The fixed fixture for the retention tests: ten accounts whose signup and
// activity times are known, so every expected figure in
// retention-sql.test.mjs can be worked out by hand from this file alone.
//
// All timestamps are UTC, as Postgres stores them. Dubai is UTC+4 all year,
// so the Dubai calendar day changes at 20:00:00 UTC. Several rows sit one
// second either side of that instant on purpose: counting by UTC date instead
// of Dubai date would move each of them to the wrong day or the wrong week.
//
// Calendar for 2026: 2 March, 9 March, 16 March, 23 March, 30 March, 6 April
// and 13 April are Mondays.
//
// The tests look at the data "as of" Sunday 12 April 2026 (Dubai), so some
// rows below fall after that day and must be ignored.

export const AS_OF = '2026-04-12';

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const USERS = {
  // ---- cohort week of Monday 2 March -------------------------------------
  // Dubai Mon 2 Mar 00:00:00. In UTC this is still Sunday 1 March, which
  // would belong to the previous week's cohort.
  alice: { id: id(1), signup: '2026-03-01T20:00:00Z', onboarded: true },
  // Dubai Tue 3 Mar 12:00.
  bilal: { id: id(2), signup: '2026-03-03T08:00:00Z', onboarded: true },
  // Dubai Sun 8 Mar 23:59:59, the last second of this cohort week.
  chen: { id: id(3), signup: '2026-03-08T19:59:59Z', onboarded: false },

  // ---- cohort week of Monday 9 March -------------------------------------
  // Dubai Mon 9 Mar 00:00:00: one second after chen, and a week later.
  dana: { id: id(4), signup: '2026-03-08T20:00:00Z', onboarded: true },
  // Dubai Wed 11 Mar 14:00. Never does anything.
  emre: { id: id(5), signup: '2026-03-11T10:00:00Z', onboarded: false },

  // ---- cohort week of Monday 6 April (too young for most checkpoints) ----
  // Dubai Mon 6 Apr 09:00. Day 1 has passed by the as-of day; day 7 has not.
  farah: { id: id(6), signup: '2026-04-06T05:00:00Z', onboarded: true },
  // Dubai Sun 12 Apr 01:00 (UTC date 11 Apr). Signed up on the as-of day
  // itself, so not even day 1 has passed.
  gus: { id: id(7), signup: '2026-04-11T21:00:00Z', onboarded: false },

  // ---- must never be counted ---------------------------------------------
  // Flagged in analytics_excluded_users. Very active, to make a leak obvious.
  qa: { id: id(8), signup: '2026-03-02T06:00:00Z', onboarded: true, excluded: 'qa' },
  // profiles.role = 'admin': excluded without needing a flag.
  admin: { id: id(9), signup: '2026-03-10T06:00:00Z', onboarded: true, role: 'admin' },
  // Dubai Mon 13 Apr 00:30 (UTC date 12 Apr): signed up after the as-of day.
  late: { id: id(10), signup: '2026-04-12T20:30:00Z', onboarded: true },
};

// [user, UTC time]                              Dubai day      day N for that user
export const WORKOUTS = [
  ['alice', '2026-03-02T21:30:00Z'], //          3 Mar 01:30    day 1  (UTC date says day 0)
  ['alice', '2026-03-09T19:59:59Z'], //          9 Mar 23:59:59 day 7  (last second of it)
  ['alice', '2026-04-13T10:00:00Z'], //          13 Apr         after the as-of day
  ['bilal', '2026-03-03T09:00:00Z'], //          3 Mar 13:00    day 0
  ['bilal', '2026-03-03T15:00:00Z'], //          3 Mar 19:00    day 0  (second workout, same day)
  ['bilal', '2026-03-10T20:30:00Z'], //          11 Mar 00:30   day 8  (UTC date says day 7)
  ['dana', '2026-03-09T20:00:00Z'], //           10 Mar 00:00   day 1  (first second of it)
  ['dana', '2026-03-15T19:59:59Z'], //           15 Mar 23:59:59 day 6 (one second short of day 7)
  ['farah', '2026-04-07T19:00:00Z'], //          7 Apr 23:00    day 1
  ['farah', '2026-04-12T20:00:00Z'], //          13 Apr 00:00   after the as-of day (her day 7)
  ['gus', '2026-04-12T20:15:00Z'], //            13 Apr 00:15   after the as-of day (his day 1)
  ['qa', '2026-03-03T06:00:00Z'],
  ['qa', '2026-03-09T06:00:00Z'],
  ['qa', '2026-03-16T06:00:00Z'],
  ['qa', '2026-03-23T06:00:00Z'],
  ['qa', '2026-04-01T06:00:00Z'],
  ['admin', '2026-03-11T06:00:00Z'],
  ['admin', '2026-03-17T06:00:00Z'],
];

// Coach G requests. [user, UTC time]
export const COACH_REQUESTS = [
  ['alice', '2026-03-15T20:00:00Z'], //          16 Mar 00:00   day 14 (UTC date says day 13)
  ['bilal', '2026-03-24T10:00:00Z'], //          24 Mar 14:00   day 21
  ['dana', '2026-04-08T07:00:00Z'], //           8 Apr 11:00    day 30
  ['dana', '2026-04-08T08:00:00Z'], //           8 Apr 12:00    day 30 (second request, same day)
  ['farah', '2026-04-13T06:00:00Z'], //          13 Apr 10:00   after the as-of day
  ['qa', '2026-03-16T07:00:00Z'],
  ['admin', '2026-03-18T07:00:00Z'],
];

// App opens are stored as a Dubai date already. [user, Dubai day]
// The earliest one from an account that counts is 16 March, so that is when
// "app-open recording began" in this fixture: the two March cohorts signed up
// before it, the April one after. The QA account has an earlier open, on
// 3 March, which must NOT move that date: a tester reaching the new code
// first does not mean real users were being recorded.
export const APP_OPENS = [
  ['alice', '2026-03-23'], // day 21
  ['alice', '2026-04-05'], // day 34: keeps her "on or after day 30" without being active on day 30
  ['alice', '2026-04-13'], // after the as-of day
  ['chen', '2026-03-16'], // day 8
  ['chen', '2026-03-22'], // day 14
  ['dana', '2026-03-16'], // day 7
  ['dana', '2026-03-30'], // day 21
  ['dana', '2026-04-08'], // day 30 (same day as her two coach requests: still one active day)
  ['farah', '2026-04-06'], // day 0
  ['farah', '2026-04-07'], // day 1 (same day as her workout)
  ['farah', '2026-04-12'], // day 6
  ['gus', '2026-04-12'], // day 0
  ['qa', '2026-03-03'], // earlier than any counted account's first open
  ['qa', '2026-03-16'],
  ['qa', '2026-03-17'],
  ['qa', '2026-04-10'],
  ['late', '2026-04-13'],
];

/** Write the fixture into a freshly migrated database. */
export async function loadFixture(db) {
  for (const [name, u] of Object.entries(USERS)) {
    // The auth trigger creates the profile row, exactly as a real signup does.
    await db.query('insert into auth.users (id, email) values ($1, $2)', [
      u.id,
      `${name}@example.test`,
    ]);
    await db.query(
      `update public.profiles
          set created_at = $2::timestamptz, onboarding_complete = $3, role = $4
        where id = $1`,
      [u.id, u.signup, u.onboarded, u.role ?? 'user'],
    );
    if (u.excluded) {
      await db.query(
        'insert into public.analytics_excluded_users (user_id, reason) values ($1, $2)',
        [u.id, u.excluded],
      );
    }
  }

  for (const [name, at] of WORKOUTS) {
    await db.query(
      `insert into public.workouts
         (user_id, exercise_type, duration_min, intensity_level, xp_earned,
          coins_earned, total_xp_after, level_before, level_after, streak_count, created_at)
       values ($1, 'Running', 30, 'Medium', 90, 9, 90, 1, 1, 1, $2::timestamptz)`,
      [USERS[name].id, at],
    );
  }

  for (const [name, at] of COACH_REQUESTS) {
    await db.query(
      `insert into public.ai_request_logs (user_id, request_type, month_key, logged_date, created_at)
       values ($1, 'chat', to_char($2::timestamptz at time zone 'Asia/Dubai', 'YYYY-MM'),
               ($2::timestamptz at time zone 'Asia/Dubai')::date, $2::timestamptz)`,
      [USERS[name].id, at],
    );
  }

  for (const [name, day] of APP_OPENS) {
    await db.query(
      `insert into public.activity_days (user_id, day, source) values ($1, $2::date, 'app_open')`,
      [USERS[name].id, day],
    );
  }
}
