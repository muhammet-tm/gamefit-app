// The export script, end to end: fixture -> real SQL -> script -> file text.
//
// The script is handed a stand-in for the Supabase client that runs the same
// SQL function in the in-process database, so what is checked here is the
// exact text that would land in the CSV and JSON files.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, rows } from './pg-harness.mjs';
import { AS_OF, USERS, loadFixture } from './retention-fixture.mjs';
import {
  DEFINITIONS,
  BASES,
  parseArgs,
  describeKey,
  collectReports,
  renderExport,
  toCsv,
} from '../../scripts/export-retention.mjs';

let db;
let calls;

/** Same contract as supabase.rpc, backed by the test database. */
async function rpc(name, args) {
  assert.equal(name, 'retention_report', 'the script calls one function only');
  calls.push(args);
  const [row] = await rows(
    db,
    `select public.retention_report(
              p_as_of => $1::date, p_sources => $2::text[], p_onboarded_only => $3::boolean,
              p_signup_from => $4::date, p_signup_to => $5::date, p_window_days => $6::integer) as r`,
    [
      args.p_as_of,
      `{${args.p_sources.join(',')}}`,
      args.p_onboarded_only,
      args.p_signup_from,
      args.p_signup_to,
      args.p_window_days,
    ],
  );
  return row.r;
}

before(async () => {
  db = await createDatabase();
  await loadFixture(db);
});

after(async () => {
  await db?.close();
});

const exportFor = async (options) => {
  calls = [];
  const collected = await collectReports(rpc, options);
  const files = renderExport(collected, options, '2026-04-13T08:00:00.000Z');
  return { collected, files: Object.fromEntries(files.map((f) => [f.name, f.text])) };
};

describe('export-retention: what gets written', () => {
  it('writes three CSV files and a summary, named after the as-of day', async () => {
    const { files } = await exportFor({ asOf: AS_OF });
    assert.deepEqual(Object.keys(files), [
      'retention_2026-04-12_cohorts.csv',
      'retention_2026-04-12_active-days.csv',
      'retention_2026-04-12_weekly.csv',
      'retention_2026-04-12_summary.json',
    ]);
  });

  it('asks for every definition and basis, all pinned to one as-of day', async () => {
    await exportFor({ asOf: AS_OF });
    assert.equal(calls.length, DEFINITIONS.length * BASES.length);
    assert.ok(calls.every((c) => c.p_as_of === AS_OF));
  });

  it('pins later calls to the day the server chose when none was given', async () => {
    const { collected } = await exportFor({});
    assert.equal(calls[0].p_as_of, null, 'the first call lets the server decide');
    assert.ok(calls.slice(1).every((c) => c.p_as_of === collected.asOf));
  });

  it('the cohorts CSV carries the hand-computed figures, formatted consistently', async () => {
    const { files } = await exportFor({ asOf: AS_OF });
    const lines = files['retention_2026-04-12_cohorts.csv'].trimEnd().split('\n');

    assert.equal(
      lines[0],
      'definition,basis,cohort_week,cohort_size,day_n,eligible,retained_on_day,rate_on_day,retained_on_or_after,rate_on_or_after,app_open_tracked',
    );
    // 6 reports x (3 cohorts + pooled) x 5 days, plus the header.
    assert.equal(lines.length, 1 + 6 * 4 * 5);

    // The same numbers retention-sql.test.mjs derives by hand.
    assert.ok(lines.includes('any,all_signups,2026-03-02,3,1,3,1,0.3333,3,1.0000,false'));
    assert.ok(lines.includes('any,all_signups,ALL,7,1,6,3,0.5000,5,0.8333,false'));
    assert.ok(lines.includes('any,all_signups,ALL,7,30,5,1,0.2000,2,0.4000,false'));
    assert.ok(lines.includes('core,all_signups,ALL,7,7,5,1,0.2000,3,0.6000,'));
    assert.ok(lines.includes('workout,all_signups,ALL,7,14,5,0,0.0000,0,0.0000,'));
    assert.ok(lines.includes('any,onboarded,ALL,4,1,4,3,0.7500,4,1.0000,false'));
    // Nobody eligible: both rates blank, not 0.
    assert.ok(lines.includes('any,all_signups,2026-04-06,2,7,0,0,,0,,true'));
  });

  it('the active-days and weekly CSVs carry the hand-computed figures', async () => {
    const { files } = await exportFor({ asOf: AS_OF });
    const days = files['retention_2026-04-12_active-days.csv'].trimEnd().split('\n');
    assert.ok(days.includes('any,all_signups,ALL,30,7,5,3.00,2.60,2.00,4.00,4,1'));
    assert.ok(days.includes('any,all_signups,2026-04-06,30,2,0,,,,,,0'));
    assert.ok(days.includes('core,all_signups,ALL,30,7,5,2.00,1.60,0.00,3.00,3,2'));

    const weeks = files['retention_2026-04-12_weekly.csv'].trimEnd().split('\n');
    assert.ok(weeks.includes('any,all_signups,2026-03-02,3,2,2,3,1.5000,0,0,0.0000'));
    assert.ok(weeks.includes('any,all_signups,2026-04-06,7,3,1,1,0.3333,1,2,0.6667'));
    assert.ok(weeks.includes('workout,all_signups,2026-03-16,5,0,0,0,,0,0,'));
  });

  it('the summary holds the pooled figures and a checksum for each CSV', async () => {
    const { files } = await exportFor({ asOf: AS_OF });
    const summary = JSON.parse(files['retention_2026-04-12_summary.json']);

    assert.equal(summary.as_of, AS_OF);
    assert.equal(summary.time_zone, 'Asia/Dubai');
    assert.equal(summary.app_open_tracking_since, '2026-03-16');
    assert.deepEqual(summary.accounts.all_signups, {
      in_scope: 7, onboarded: 4, first_signup_day: '2026-03-02', last_signup_day: '2026-04-12', excluded: 2,
    });
    assert.deepEqual(summary.results.any.all_signups.retention.day_7, {
      eligible: 5, retained_on_day: 2, rate_on_day: 0.4, retained_on_or_after: 4, rate_on_or_after: 0.8,
    });
    assert.equal(summary.results.any.all_signups.active_days.median, 3);
    assert.equal(summary.results.any.all_signups.engagement.workouts_per_active_user_week, 0.5333);
    assert.equal(summary.results.any.all_signups.engagement.coach_requests_per_active_user, 0.6667);

    assert.deepEqual(summary.files.map((f) => f.name), [
      'retention_2026-04-12_cohorts.csv',
      'retention_2026-04-12_active-days.csv',
      'retention_2026-04-12_weekly.csv',
    ]);
    assert.ok(summary.files.every((f) => /^[0-9a-f]{64}$/.test(f.sha256)));
    assert.ok(summary.notes.length > 0);
  });

  it('is reproducible: the same as-of day gives byte-identical files', async () => {
    const first = await exportFor({ asOf: AS_OF });
    const second = await exportFor({ asOf: AS_OF });
    assert.deepEqual(first.files, second.files);
  });

  it('contains no email address and no user id', async () => {
    const { files } = await exportFor({ asOf: AS_OF });
    const everything = Object.values(files).join('\n');
    assert.ok(!everything.includes('@'), 'no email address');
    for (const user of Object.values(USERS)) {
      assert.ok(!everything.includes(user.id), 'no user id');
    }
  });

  it('puts the signup window in the file name so two exports cannot overwrite each other', async () => {
    const { files } = await exportFor({ asOf: AS_OF, from: '2026-03-09', to: '2026-03-15' });
    const name = 'retention_2026-04-12_signups-2026-03-09-to-2026-03-15_cohorts.csv';
    assert.ok(name in files);
    assert.ok(files[name].includes('any,all_signups,ALL,2,1,2,1,0.5000,1,0.5000,false'));
  });
});

describe('export-retention: command line', () => {
  it('has sensible defaults', () => {
    assert.deepEqual(parseArgs([]), {
      asOf: null, from: null, to: null, windowDays: 30, out: 'retention-exports', help: false,
    });
  });

  it('reads every option', () => {
    assert.deepEqual(
      parseArgs(['--as-of', '2026-04-12', '--from', '2026-03-01', '--to', '2026-03-31',
        '--window', '14', '--out', 'somewhere else']),
      { asOf: '2026-04-12', from: '2026-03-01', to: '2026-03-31', windowDays: 14, out: 'somewhere else', help: false },
    );
  });

  it('rejects what it cannot use, in plain words', () => {
    assert.throws(() => parseArgs(['--as-of', '12/04/2026']), /YYYY-MM-DD/);
    assert.throws(() => parseArgs(['--as-of']), /needs a value/);
    assert.throws(() => parseArgs(['--window', '0']), /whole number/);
    assert.throws(() => parseArgs(['--from', '2026-04-01', '--to', '2026-03-01']), /later than/);
    assert.throws(() => parseArgs(['--verbose']), /Unknown option/);
  });
});

describe('export-retention: the key check', () => {
  const jwt = (payload) =>
    ['x', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'x'].join('.');

  it('tells a service role key from the public one without printing either', () => {
    assert.equal(describeKey(jwt({ role: 'service_role' })), 'service_role');
    assert.equal(describeKey(jwt({ role: 'anon' })), 'anon');
    assert.equal(describeKey('sb_secret_example'), 'service_role');
    assert.equal(describeKey('sb_publishable_example'), 'publishable');
    assert.equal(describeKey(''), 'missing');
    assert.equal(describeKey(undefined), 'missing');
    assert.equal(describeKey('not-a-key'), 'unknown');
  });
});

describe('toCsv', () => {
  it('quotes only what needs quoting and ends with a newline', () => {
    assert.equal(
      toCsv(['a', 'b'], [[1, 'plain'], [null, 'has,comma'], [true, 'has "quote"']]),
      'a,b\n1,plain\n,"has,comma"\ntrue,"has ""quote"""\n',
    );
  });
});
