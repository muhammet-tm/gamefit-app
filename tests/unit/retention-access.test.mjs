// Who can do what. The claims in the retention migration's header, each one
// attempted as the role in question and required to fail or succeed.
//
// The harness reproduces Supabase's default privileges, under which every new
// table and function in `public` is handed to anon and authenticated. So a
// forgotten `revoke` in the migration shows up here as a failing test.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, rows, asRole } from './pg-harness.mjs';
import { USERS, loadFixture } from './retention-fixture.mjs';

const DENIED = /permission denied/;

let db;
const alice = USERS.alice.id;
const bilal = USERS.bilal.id;

before(async () => {
  db = await createDatabase();
  await loadFixture(db);
});

after(async () => {
  await db?.close();
});

const todayInDubai = async () =>
  (await rows(db, `select (now() at time zone 'Asia/Dubai')::date::text as d`))[0].d;

const openDaysToday = async (userId) =>
  (
    await rows(
      db,
      `select count(*)::integer as n from public.activity_days
        where user_id = $1 and day = (now() at time zone 'Asia/Dubai')::date`,
      [userId],
    )
  )[0].n;

describe('record_app_open', () => {
  it("records today's Dubai date for the caller and returns it", async () => {
    const returned = await asRole(db, 'authenticated', alice, async () =>
      (await rows(db, 'select public.record_app_open()::text as day'))[0].day,
    );
    assert.equal(returned, await todayInDubai());
    assert.equal(await openDaysToday(alice), 1);
  });

  it('is idempotent: opening the app ten times is still one row', async () => {
    await asRole(db, 'authenticated', alice, async () => {
      for (let i = 0; i < 10; i++) await rows(db, 'select public.record_app_open()');
    });
    assert.equal(await openDaysToday(alice), 1);
  });

  it('writes only the row of whoever is signed in', async () => {
    // The function takes no arguments, so there is no id or date to forge.
    // Calling it as alice must leave bilal untouched.
    assert.equal(await openDaysToday(bilal), 0);
    await assert.rejects(
      asRole(db, 'authenticated', alice, () =>
        rows(db, 'select public.record_app_open($1::uuid)', [bilal]),
      ),
      /does not exist/,
      'there is no variant that accepts a user id',
    );
    assert.equal(await openDaysToday(bilal), 0);
  });

  it('refuses a session with no user', async () => {
    await assert.rejects(
      asRole(db, 'authenticated', null, () => rows(db, 'select public.record_app_open()')),
      /not authenticated/,
    );
  });

  it('is not callable by anonymous visitors', async () => {
    await assert.rejects(
      asRole(db, 'anon', null, () => rows(db, 'select public.record_app_open()')),
      DENIED,
    );
  });
});

describe('activity_days is closed to clients', () => {
  for (const role of ['authenticated', 'anon']) {
    it(`${role} cannot read it`, async () => {
      await assert.rejects(
        asRole(db, role, alice, () => rows(db, 'select * from public.activity_days')),
        DENIED,
      );
    });

    it(`${role} cannot insert, change, or delete rows`, async () => {
      await assert.rejects(
        asRole(db, role, alice, () =>
          rows(db, `insert into public.activity_days (user_id, day) values ($1, '2026-01-01')`, [
            bilal,
          ]),
        ),
        DENIED,
        'insert for another user',
      );
      await assert.rejects(
        asRole(db, role, alice, () =>
          rows(db, `insert into public.activity_days (user_id, day) values ($1, '2026-01-01')`, [
            alice,
          ]),
        ),
        DENIED,
        'insert a back-dated row for oneself',
      );
      await assert.rejects(
        asRole(db, role, alice, () =>
          rows(db, `update public.activity_days set day = '2026-01-01'`),
        ),
        DENIED,
      );
      await assert.rejects(
        asRole(db, role, alice, () => rows(db, 'delete from public.activity_days')),
        DENIED,
      );
    });
  }

  it('rejects a source the table does not know', async () => {
    await assert.rejects(
      rows(db, `insert into public.activity_days (user_id, day, source) values ($1, '2026-01-01', 'bogus')`, [alice]),
      /check constraint/,
    );
  });

  it('removes a user\'s days when the account is deleted', async () => {
    const before = await rows(db, 'select count(*)::integer as n from public.activity_days where user_id = $1', [USERS.gus.id]);
    assert.ok(before[0].n > 0);
    await db.query('delete from auth.users where id = $1', [USERS.gus.id]);
    const after = await rows(db, 'select count(*)::integer as n from public.activity_days where user_id = $1', [USERS.gus.id]);
    assert.equal(after[0].n, 0);
  });
});

describe('the exclusion list is closed to clients', () => {
  it('a signed-in user cannot read it or take themselves off it', async () => {
    await assert.rejects(
      asRole(db, 'authenticated', USERS.qa.id, () =>
        rows(db, 'select * from public.analytics_excluded_users'),
      ),
      DENIED,
    );
    await assert.rejects(
      asRole(db, 'authenticated', USERS.qa.id, () =>
        rows(db, 'delete from public.analytics_excluded_users'),
      ),
      DENIED,
    );
  });
});

describe('reporting functions are service-role only', () => {
  const REPORTING = [
    'public.retention_cohorts()',
    'public.retention_active_days()',
    'public.retention_weekly_engagement()',
    'public.retention_report()',
  ];
  const HELPERS = [
    `public.retention_scope('2026-04-12', false, null, null)`,
    `public.retention_activity('2026-04-12', array['workout'])`,
    `public.retention_tracking_since('2026-04-12')`,
    `public.retention_validate(array['workout'], array[1], 30)`,
  ];

  for (const fn of REPORTING) {
    it(`${fn}: service role yes, everyone else no`, async () => {
      for (const role of ['authenticated', 'anon']) {
        await assert.rejects(
          asRole(db, role, alice, () => rows(db, `select * from ${fn}`)),
          DENIED,
          `${role} must not be able to call ${fn}`,
        );
      }
      await assert.doesNotReject(
        asRole(db, 'service_role', null, () => rows(db, `select * from ${fn}`)),
      );
    });
  }

  it('an admin account gets no special access through the API', async () => {
    // profiles.role = 'admin' is still the `authenticated` database role.
    await assert.rejects(
      asRole(db, 'authenticated', USERS.admin.id, () =>
        rows(db, 'select public.retention_report()'),
      ),
      DENIED,
    );
  });

  for (const fn of HELPERS) {
    // Two of these return per-user rows, so they stay internal: the reporting
    // functions run as the owner and reach them; nothing else does.
    it(`${fn.split('(')[0]}: no API role at all`, async () => {
      for (const role of ['authenticated', 'anon', 'service_role']) {
        await assert.rejects(
          asRole(db, role, alice, () => rows(db, `select * from ${fn}`)),
          DENIED,
          `${role} must not be able to call ${fn}`,
        );
      }
    });
  }

  it('every function this migration added has an explicit, minimal grant', async () => {
    // Belt and braces for the per-function tests above: read the grants
    // straight from the catalog, so a function added later without a revoke
    // fails here even if nobody wrote a test for it.
    const grants = await rows(
      db,
      `select p.proname as name,
              has_function_privilege('anon', p.oid, 'execute') as anon,
              has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
              has_function_privilege('service_role', p.oid, 'execute') as service_role
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and (p.proname like 'retention\\_%' or p.proname = 'record_app_open')
        order by p.proname`,
    );
    assert.deepEqual(
      grants.map((g) => [g.name, g.anon, g.authenticated, g.service_role]),
      [
        ['record_app_open', false, true, true],
        ['retention_active_days', false, false, true],
        ['retention_activity', false, false, false],
        ['retention_cohorts', false, false, true],
        ['retention_report', false, false, true],
        ['retention_scope', false, false, false],
        ['retention_tracking_since', false, false, false],
        ['retention_validate', false, false, false],
        ['retention_weekly_engagement', false, false, true],
      ],
    );
  });
});
