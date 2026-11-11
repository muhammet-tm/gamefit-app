#!/usr/bin/env node
// Export GameFit's retention figures to dated CSV files and a JSON summary.
//
// The point of this script is that no retention number is ever typed by hand:
// the database computes it (supabase/migrations/20261111130001_retention_measurement.sql),
// this script writes it down, and the paper reads the files. The script does
// no arithmetic of its own. It only asks, formats, and saves.
//
// Usage (PowerShell; the key is typed or pasted hidden, and never stored):
//
//   $env:SUPABASE_SERVICE_ROLE_KEY = [Net.NetworkCredential]::new('', (Read-Host "Service role key" -AsSecureString)).Password
//   npm run export:retention -- --out "FOLDER-WHERE-THE-PAPER-KEEPS-ITS-DATA"
//
// Options:
//   --as-of YYYY-MM-DD   last Dubai day to include (default: yesterday in Dubai)
//   --from  YYYY-MM-DD   only accounts that signed up on or after this Dubai day
//   --to    YYYY-MM-DD   only accounts that signed up on or before this Dubai day
//   --window N           days in the "active days" window (default 30)
//   --out   DIR          where to write (default ./retention-exports, which
//                        Git ignores; study data does not belong in the repo)
//
// Environment:
//   SUPABASE_URL or VITE_SUPABASE_URL   the project URL (public). The npm
//                                       script reads .env.local, which has it.
//   SUPABASE_SERVICE_ROLE_KEY           the service role key (secret)
//
// The service role key bypasses every access rule in the database. It is read
// from the environment, used for the request, and never printed, logged, or
// written to a file. Do not put it in .env.local or any file in this folder.
//
// What comes out contains counts and rates only: no email, no user id, no
// individual's activity.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// What "active" means in each exported table. The first is the headline
// definition; the other two are for sensitivity analysis and for cohorts that
// signed up before app opens were recorded.
export const DEFINITIONS = [
  {
    key: 'any',
    label: 'App open, logged workout, or Coach G request',
    sources: ['app_open', 'workout', 'coach'],
  },
  { key: 'core', label: 'Logged workout or Coach G request', sources: ['workout', 'coach'] },
  { key: 'workout', label: 'Logged workout only', sources: ['workout'] },
];

// Who is in the denominator.
export const BASES = [
  { key: 'all_signups', label: 'Every registered account', onboardedOnly: false },
  { key: 'onboarded', label: 'Accounts that completed onboarding', onboardedOnly: true },
];

export const NOTES = [
  'All days are Asia/Dubai calendar days. Day 0 is the signup day.',
  'eligible counts accounts whose day N is on or before as_of. Accounts that have not reached day N are in neither the numerator nor the denominator.',
  'rate_on_day is classic N-day retention: active on exactly day N.',
  'rate_on_or_after is unbounded retention: active on day N or any later day up to as_of. It can only rise as as_of moves forward, so quote it together with as_of.',
  'A blank rate means no account was eligible. It is not zero.',
  'App opens are recorded only from app_open_tracking_since, the first day an app open was recorded for a counted account. For cohorts that signed up earlier, app_open_tracked is false and the "any" definition understates their early days; use "core" or "workout" for those cohorts.',
  'A coach request is one the server accepted and did not refund. Requests refused at the free limit are not counted.',
  'In the weekly table and the engagement totals, workouts and coach requests are counted only for accounts that were active under the row\'s definition. Under "any" and "core" that is every workout and every coach request. Under "workout", coach requests from accounts that logged no workout in that week are left out.',
  'accounts.excluded counts accounts that meet the as-of day, signup window, and onboarding conditions and are left out only because they are admin or flagged.',
  'Accounts with role admin and accounts listed in analytics_excluded_users are excluded. Accounts deleted before the export are absent from every figure.',
  'Weekly rows cover complete Monday-to-Sunday weeks only.',
];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse command-line options. Throws a plain-English Error on bad input. */
export function parseArgs(argv) {
  const options = { asOf: null, from: null, to: null, windowDays: 30, out: 'retention-exports', help: false };
  const names = { '--as-of': 'asOf', '--from': 'from', '--to': 'to', '--out': 'out', '--window': 'windowDays' };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    const key = names[arg];
    if (!key) throw new Error(`Unknown option: ${arg}`);
    const value = argv[++i];
    if (value === undefined) throw new Error(`${arg} needs a value`);

    if (key === 'windowDays') {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1) throw new Error('--window must be a whole number of days, 1 or more');
      options.windowDays = n;
    } else if (key === 'out') {
      options.out = value;
    } else {
      if (!DATE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
        throw new Error(`${arg} must be a date written as YYYY-MM-DD`);
      }
      options[key] = value;
    }
  }
  if (options.from && options.to && options.from > options.to) {
    throw new Error('--from must not be later than --to');
  }
  return options;
}

/**
 * Say what kind of key this is without revealing it. Supabase's classic keys
 * are JWTs whose payload names the role; the newer `sb_secret_` keys are not.
 * Returns 'service_role', 'anon', 'publishable', or 'unknown'.
 */
export function describeKey(key) {
  if (typeof key !== 'string' || key.length === 0) return 'missing';
  if (key.startsWith('sb_secret_')) return 'service_role';
  if (key.startsWith('sb_publishable_')) return 'publishable';
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (payload.role === 'service_role') return 'service_role';
      if (payload.role === 'anon') return 'anon';
    } catch { /* not a JWT we can read */ }
  }
  return 'unknown';
}

/**
 * Ask the database for one report per definition and basis.
 *
 * `rpc(name, args)` must resolve to the function's result or throw. The first
 * call lets the server choose the as-of day when none was given; every later
 * call is pinned to that same day, so all six reports describe one moment
 * even if the script runs across Dubai midnight.
 */
export async function collectReports(rpc, options = {}) {
  let asOf = options.asOf ?? null;
  const reports = [];

  for (const definition of DEFINITIONS) {
    for (const basis of BASES) {
      const report = await rpc('retention_report', {
        p_as_of: asOf,
        p_sources: definition.sources,
        p_onboarded_only: basis.onboardedOnly,
        p_signup_from: options.from ?? null,
        p_signup_to: options.to ?? null,
        p_window_days: options.windowDays ?? 30,
      });
      if (!report || report.schema_version !== 1) {
        throw new Error('The database returned a report this script does not understand.');
      }
      asOf = report.as_of;
      reports.push({ definition, basis, report });
    }
  }
  return { asOf, reports };
}

// ---------------------------------------------------------------- formatting

const fixed = (digits) => (value) => (value === null || value === undefined ? '' : Number(value).toFixed(digits));
const rate = fixed(4);
const stat = fixed(2);
const plain = (value) => (value === null || value === undefined ? '' : String(value));

function csvCell(value) {
  const text = plain(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** RFC 4180 CSV with a header row and a trailing newline. */
export function toCsv(header, rows) {
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}

export function buildCohortsCsv(reports) {
  const header = [
    'definition', 'basis', 'cohort_week', 'cohort_size', 'day_n', 'eligible',
    'retained_on_day', 'rate_on_day', 'retained_on_or_after', 'rate_on_or_after',
    'app_open_tracked',
  ];
  const rows = reports.flatMap(({ definition, basis, report }) =>
    report.cohorts.map((c) => [
      definition.key, basis.key, c.is_pooled ? 'ALL' : c.cohort_week, c.cohort_size, c.day_n,
      c.eligible, c.retained_on_day, rate(c.rate_on_day), c.retained_on_or_after,
      rate(c.rate_on_or_after), c.app_open_tracked,
    ]),
  );
  return { header, rows, text: toCsv(header, rows) };
}

export function buildActiveDaysCsv(reports) {
  const header = [
    'definition', 'basis', 'cohort_week', 'window_days', 'cohort_size', 'users',
    'median_active_days', 'mean_active_days', 'p25_active_days', 'p75_active_days',
    'max_active_days', 'users_with_zero_days',
  ];
  const rows = reports.flatMap(({ definition, basis, report }) =>
    report.active_days.map((d) => [
      definition.key, basis.key, d.is_pooled ? 'ALL' : d.cohort_week, report.window_days,
      d.cohort_size, d.users, stat(d.median_active_days), stat(d.mean_active_days),
      stat(d.p25_active_days), stat(d.p75_active_days), d.max_active_days, d.users_with_zero_days,
    ]),
  );
  return { header, rows, text: toCsv(header, rows) };
}

export function buildWeeklyCsv(reports) {
  const header = [
    'definition', 'basis', 'week_start', 'registered_users', 'active_users', 'workout_users',
    'workouts', 'workouts_per_active_user', 'coach_users', 'coach_requests',
    'coach_requests_per_active_user',
  ];
  const rows = reports.flatMap(({ definition, basis, report }) =>
    report.weekly.map((w) => [
      definition.key, basis.key, w.week_start, w.registered_users, w.active_users, w.workout_users,
      w.workouts, rate(w.workouts_per_active_user), w.coach_users, w.coach_requests,
      rate(w.coach_requests_per_active_user),
    ]),
  );
  return { header, rows, text: toCsv(header, rows) };
}

/** The small JSON summary: pooled figures and how they were produced. */
export function buildSummary({ asOf, reports }, { files = [], generatedAt = new Date().toISOString() } = {}) {
  const first = reports[0].report;
  const results = {};
  const accounts = {};

  for (const { definition, basis, report } of reports) {
    accounts[basis.key] = report.accounts;
    const pooledDays = report.active_days.find((d) => d.is_pooled) ?? null;
    results[definition.key] ??= {};
    results[definition.key][basis.key] = {
      retention: Object.fromEntries(
        report.cohorts
          .filter((c) => c.is_pooled)
          .map((c) => [
            `day_${c.day_n}`,
            {
              eligible: c.eligible,
              retained_on_day: c.retained_on_day,
              rate_on_day: c.rate_on_day,
              retained_on_or_after: c.retained_on_or_after,
              rate_on_or_after: c.rate_on_or_after,
            },
          ]),
      ),
      active_days: pooledDays && {
        window_days: report.window_days,
        users: pooledDays.users,
        median: pooledDays.median_active_days,
        mean: pooledDays.mean_active_days,
        p25: pooledDays.p25_active_days,
        p75: pooledDays.p75_active_days,
        users_with_zero_days: pooledDays.users_with_zero_days,
      },
      engagement: report.totals,
    };
  }

  return {
    schema_version: 1,
    generated_at: generatedAt,
    as_of: asOf,
    time_zone: first.time_zone,
    signup_from: first.signup_from,
    signup_to: first.signup_to,
    window_days: first.window_days,
    app_open_tracking_since: first.app_open_tracking_since,
    definitions: Object.fromEntries(DEFINITIONS.map((d) => [d.key, { label: d.label, sources: d.sources }])),
    bases: Object.fromEntries(BASES.map((b) => [b.key, b.label])),
    accounts,
    results,
    files,
    notes: NOTES,
  };
}

/** Everything the export writes, as { name, text } pairs. Pure: no disk. */
export function renderExport(collected, options = {}, generatedAt) {
  const { asOf, reports } = collected;
  const windowTag = options.from || options.to
    ? `_signups-${options.from ?? 'start'}-to-${options.to ?? 'end'}`
    : '';
  const stem = `retention_${asOf}${windowTag}`;

  const tables = [
    [`${stem}_cohorts.csv`, buildCohortsCsv(reports)],
    [`${stem}_active-days.csv`, buildActiveDaysCsv(reports)],
    [`${stem}_weekly.csv`, buildWeeklyCsv(reports)],
  ];
  const files = tables.map(([name, table]) => ({
    name,
    rows: table.rows.length,
    sha256: createHash('sha256').update(table.text).digest('hex'),
  }));
  const summary = buildSummary(collected, { files, generatedAt });

  return [
    ...tables.map(([name, table]) => ({ name, text: table.text })),
    { name: `${stem}_summary.json`, text: JSON.stringify(summary, null, 2) + '\n' },
  ];
}

// ---------------------------------------------------------------- command line

const USAGE = `Export GameFit retention figures.

  npm run export:retention -- [options]

Options:
  --as-of YYYY-MM-DD   last Dubai day to include (default: yesterday in Dubai)
  --from  YYYY-MM-DD   only accounts that signed up on or after this day
  --to    YYYY-MM-DD   only accounts that signed up on or before this day
  --window N           days in the "active days" window (default 30)
  --out   DIR          output folder (default ./retention-exports)

Needs SUPABASE_SERVICE_ROLE_KEY in the environment, and the project URL in
SUPABASE_URL or VITE_SUPABASE_URL (.env.local has the second one, and the npm
script reads that file). In PowerShell, set the key for this window only.
This form hides what you paste and keeps it out of files and command history:

  $env:SUPABASE_SERVICE_ROLE_KEY = [Net.NetworkCredential]::new('', (Read-Host "Service role key" -AsSecureString)).Password
`;

function explain(error) {
  // Only ever the message and the code: never the request, headers, or key.
  const code = error?.code ?? '';
  if (code === 'PGRST202') {
    return 'The retention functions are not in the database yet. Apply the migration first (see docs/RETENTION_MEASUREMENT.md).';
  }
  if (code === '42501') {
    return 'This key is not allowed to read retention figures. Use the service role key, not the anon key.';
  }
  return `The database refused the request: ${error?.message ?? 'unknown error'}${code ? ` (${code})` : ''}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(USAGE);
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    throw new Error('The project URL is missing. Run this from the project folder that has .env.local (it holds VITE_SUPABASE_URL), or set SUPABASE_URL.');
  }

  const kind = describeKey(key);
  if (kind === 'missing') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Run with --help to see how to set it safely.');
  }
  if (kind === 'anon' || kind === 'publishable') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY holds the public (anon) key. The export needs the service role key from Supabase: Project Settings, API.');
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const rpc = async (name, args) => {
    const { data, error } = await supabase.rpc(name, args);
    if (error) throw new Error(explain(error));
    return data;
  };

  const collected = await collectReports(rpc, options);
  const outputs = renderExport(collected, options);

  const outDir = path.resolve(options.out);
  mkdirSync(outDir, { recursive: true });
  for (const { name, text } of outputs) writeFileSync(path.join(outDir, name), text, 'utf8');

  const headline = collected.reports[0].report;
  const day = (n) => headline.cohorts.find((c) => c.is_pooled && c.day_n === n);
  const show = (c, field) => (c?.[field] === null || c?.[field] === undefined ? 'n/a' : `${(c[field] * 100).toFixed(1)}%`);

  console.log(`Retention as of ${collected.asOf} (Asia/Dubai)`);
  console.log(`Accounts in scope: ${headline.accounts.in_scope}  (excluded: ${headline.accounts.excluded})`);
  console.log(`App opens recorded since: ${headline.app_open_tracking_since ?? 'not yet'}`);
  console.log('Headline definition, all signups, pooled:');
  for (const n of [1, 7, 14, 21, 30]) {
    const c = day(n);
    console.log(
      `  day ${String(n).padStart(2)}: on day ${show(c, 'rate_on_day').padStart(6)}   on or after ${show(c, 'rate_on_or_after').padStart(6)}   (eligible ${c?.eligible ?? 0})`,
    );
  }
  console.log(`Wrote ${outputs.length} files to ${outDir}`);
  for (const { name } of outputs) console.log(`  ${name}`);
}

const invokedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();

if (invokedDirectly) {
  main().catch((error) => {
    console.error(`Export failed: ${error.message}`);
    process.exitCode = 1;
  });
}
