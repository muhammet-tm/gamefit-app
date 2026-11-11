# Retention measurement

GameFit's published paper says the app enhances user retention. Until this change, nothing in the
system measured retention at all, and the paper's dropout figure came from a blog post. This
document defines what is now measured, shows how each figure is calculated, states what the
figures cannot support, and lists the steps to turn the measurement on and export it.

The measurement uses the Supabase database only. No third-party analytics service is involved.

## What counts as an active day

A user is active on a calendar day when the server recorded at least one of three events for that
user on that day.

| Source | Event | Where it is stored | Available from |
|---|---|---|---|
| `workout` | A workout was logged | `workouts.created_at` | The first signup |
| `coach` | A Coach G request was accepted | `ai_request_logs.created_at` | The first signup |
| `app_open` | The app was opened, or brought back to the foreground, while signed in | `activity_days` (new) | The day the migration is applied |

Days are Asia/Dubai calendar days for every user, because that is the day boundary the streak and
the leaderboard already use. Dubai is four hours ahead of Coordinated Universal Time (UTC) all
year, so the day changes at 20:00 UTC. A workout logged at 19:59:59 UTC and one logged a second
later belong to different days.

All three sources are stamped by the server. The browser never supplies a date or a user
identifier: `record_app_open()` takes no arguments, reads the user from the session, and reads the
date from the database clock.

A coach request counts when the server accepted it and did not refund it. The coach function
writes the usage row before it calls the model and removes the row when the call fails. A request
refused at the free limit leaves no row and does not count.

Two kinds of activity are left out on purpose. Meal logs are excluded because the browser is
allowed to write the timestamp on that table, which makes the date self-reported. Personal records
and shop purchases are excluded because each one implies an app open on the same day, so they add
nothing once app opens are recorded.

## What is recorded that was not recorded before

One new fact per user per day: the date on which the user opened the app while signed in. The
`activity_days` table holds a user identifier, a date, and a source label. It holds no time of day,
location, device, or screen name. The rows are deleted with the account.

The browser reports an open when the app is visible and a user is signed in. It checks when the
session first becomes available and each time the tab or installed app returns to the foreground.
A tab left in the background does not count. The browser remembers the last day it reported, so a
typical user causes one request per day. That memory only saves a network call. The primary key on
`activity_days` is what guarantees one row per user per day.

## The figures

Each figure is calculated in SQL by a function in
`supabase/migrations/20261111130001_retention_measurement.sql`. The examples below use an account
from the test fixture, so the unit tests check every one of them.

The example account signed up on Monday 2 March 2026 at 00:00 Dubai time, which is day 0. It was
active on 3 March (day 1), 9 March (day 7), 16 March (day 14), 23 March (day 21), and 5 April
(day 34). The data is read as of 12 April.

### Cohort retention

Accounts are grouped by the week they signed up in, Monday to Sunday. For each cohort and each
checkpoint N (1, 7, 14, 21, and 30 days by default), `retention_cohorts()` returns two rates.

Classic N-day retention is the share of eligible accounts that were active on exactly day N. The
example account was not active on day 30 (1 April), so it does not count as retained at day 30.

Unbounded retention is the share of eligible accounts that were active on day N or on any later
day up to the as-of day. The example account was active on day 34, so it does count as retained
at day 30 under this definition. Unbounded retention can only rise as the as-of day moves forward.
A figure quoted without its as-of day cannot be reproduced.

An account is eligible for checkpoint N only when its day N falls on or before the as-of day.
Accounts that have not reached day N are left out of both the numerator and the denominator. An
account that signed up 5 days ago therefore has no effect on the day-7 rate. When no account in a
row is eligible, the rate is empty, which is different from zero.

Each row also carries the number of eligible accounts. A rate should always be reported with that
number.

### Median active days

`retention_active_days()` counts, for each account, the distinct days it was active during its
first 30 calendar days (day 0 to day 29), and returns the median, mean, and quartiles per cohort
and overall. The example account has 4 active days in that window, because 5 April is day 34 and
falls outside it. Only accounts whose full window has elapsed are counted, and an account with no
activity counts as 0 days. The window length is a parameter.

### Workouts and coach requests per active user

`retention_weekly_engagement()` returns one row per complete calendar week. Workouts per active
user is the number of workouts logged that week divided by the number of accounts active that
week. Coach requests per active user per week is calculated the same way. A week still in progress
on the as-of day is omitted. When nobody was active in a week, the ratio is empty.

`retention_report()` adds one figure over the whole period: all Coach G requests up to the as-of
day divided by the number of accounts that were active at least once.

In each of these ratios, the numerator counts only the accounts in the denominator. Under the
`any` and `core` definitions that is every workout and every coach request, because each one
makes its author active. Under the `workout` definition, a coach request from an account that
logged no workout in that week is left out, so the coach figures are narrower there.

### Three definitions and two denominators

The export repeats every table under three definitions of active and two denominators, so that a
result can be checked for sensitivity to the definition.

| Key | Active means | Use |
|---|---|---|
| `any` | App open, workout, or coach request | Headline figure, for cohorts that signed up after app opens were recorded |
| `core` | Workout or coach request | Comparable across all history |
| `workout` | Workout only | The strictest reading |

| Key | Denominator |
|---|---|
| `all_signups` | Every registered account, including accounts that never confirmed an email address |
| `onboarded` | Accounts that completed onboarding |

## What these figures cannot support

Measuring retention does not show that gamification improves it. The figures describe how GameFit
users behaved. A claim that the app enhances retention needs a comparison, such as a control
condition without the game mechanics or a cited benchmark measured under the same definition.
None exists in this system.

App opens before the migration date were never recorded and cannot be recovered. For a cohort that
signed up earlier, the `any` definition understates its early days. The export marks such cohorts
with `app_open_tracked = false`, and the `core` and `workout` definitions are unaffected. The
start of recording is taken as the first app open by a counted account, so a tester who reaches
the new code before real users does not move it, provided the tester's account is flagged.

The `onboarded` denominator rests on a flag the app sets when the onboarding wizard finishes. The
server does not verify it.

The system does not know who is a study participant. A study cohort is selected by signup dates
(`--from` and `--to`), which includes anyone else who registered in that window. Accounts that are
not participants must be flagged for exclusion by hand.

Deleted accounts disappear from every figure. If people who stop using the app also delete their
accounts, retention is overstated, and the size of that effect is unknown.

Rates from small cohorts are unstable. The functions return counts and rates and do not calculate
confidence intervals.

The following are not recorded and cannot be reported: session length, the number of opens within
a day, the time of day, the screens viewed, and visits made while signed out. An app left open
across midnight without a workout or coach request is counted only on the first day. Every user's
day is cut at Dubai midnight, wherever the user is.

## Who can read the figures

The four reporting functions can be called only with the service role key, or from the Supabase
SQL editor. No signed-in user can call them, including an account with the admin role. The two
helper functions that return per-user rows cannot be called through the API by any role. Accounts
with the admin role, and accounts listed in `analytics_excluded_users`, are excluded from every
figure.

`tests/unit/retention-access.test.mjs` attempts each of these as the role in question.

## Steps to turn it on

The order matters. The database must have the new function before the new frontend is live.
Otherwise every signed-in visit makes a request that fails, and no app opens are recorded.

1. Merge the branch into `main` locally with `git merge --no-ff feat/retention-measurement`. Do
   not push yet. Pushing `main` is the release: on 11 November 2026 a merge to `main` on GitHub
   redeployed Edge Functions automatically within seconds, and migrations may be applied the same
   way. If the branch goes through a pull request instead, run steps 2 to 4 from the branch's own
   checkout before merging the pull request, because merging it is then the release.

2. Apply the migration from the checkout that is linked to the Supabase project. The command
   lists the migrations it is about to apply and asks for confirmation. It should list
   `20261111130001_retention_measurement.sql` and nothing unexpected.

   ```bash
   npx supabase db push
   ```

3. Confirm the permissions in production. Run this in the Supabase SQL editor.

   ```sql
   select p.proname,
          has_function_privilege('anon', p.oid, 'execute') as anon,
          has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
          has_function_privilege('service_role', p.oid, 'execute') as service_role
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname like 'retention\_%' or p.proname = 'record_app_open')
    order by p.proname;
   ```

   `anon` must be false on every row. `authenticated` must be true for `record_app_open` only.
   `service_role` must be false for `retention_activity`, `retention_scope`,
   `retention_tracking_since`, and `retention_validate`, and true for the rest.

4. Flag the accounts that must not be counted. Run this once per account, with the reason `qa`,
   `test`, or `staff`. The QA account used by the end-to-end tests is the first one to flag.

   ```sql
   insert into public.analytics_excluded_users (user_id, reason)
   select id, 'qa' from public.profiles where email = 'ACCOUNT-EMAIL-HERE'
   on conflict (user_id) do nothing;
   ```

5. Push `main`. Vercel deploys the frontend.

6. Confirm that app opens arrive. Sign in to the live app, then run this in the SQL editor. Today's
   date in Dubai should appear with a count of at least 1.

   ```sql
   select day, count(*) as accounts
     from public.activity_days
    group by day
    order by day desc
    limit 7;
   ```

## Exporting the figures

The export script calls `retention_report()` and writes what it returns. It performs no
arithmetic, so a number in the paper traces back to one SQL function and one as-of day.

The script needs the service role key, which bypasses every access rule in the database. The key
is in the Supabase dashboard under Project Settings, API. Do not save it in `.env.local` or in any
file in this folder. In PowerShell, the following sets it for the current window only. The prompt
hides what is pasted, and the key reaches neither a file nor the command history.

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = [Net.NetworkCredential]::new('', (Read-Host "Service role key" -AsSecureString)).Password
```

Then run the export, pointing `--out` at the folder where the paper's data is kept. For the book
chapter, that is the `Retention data` subfolder of the chapter's working folder.

```powershell
npm run export:retention -- --out "PATH-TO-CHAPTER-FOLDER\Retention data"
```

Close the PowerShell window afterwards. The key is gone when the window closes.

| Option | Meaning | Default |
|---|---|---|
| `--as-of YYYY-MM-DD` | Last Dubai day to include | Yesterday in Dubai |
| `--from YYYY-MM-DD` | Earliest signup day to include | No limit |
| `--to YYYY-MM-DD` | Latest signup day to include | No limit |
| `--window N` | Length of the active-days window, in days | 30 |
| `--out DIR` | Output folder | `./retention-exports`, which Git ignores |

Four files are written, each named after the as-of day.

| File | Contents |
|---|---|
| `retention_<as-of>_cohorts.csv` | Classic and unbounded retention per signup week and checkpoint |
| `retention_<as-of>_active-days.csv` | Median, mean, and quartiles of active days per signup week |
| `retention_<as-of>_weekly.csv` | Active users, workouts, and coach requests per calendar week |
| `retention_<as-of>_summary.json` | Pooled figures, the parameters used, and a SHA-256 checksum of each CSV file |

The files contain counts and rates. They contain no email address and no user identifier. Running
the export twice with the same `--as-of` day produces identical CSV files, provided no account was
deleted or flagged in between.

The same figures can be read directly in the SQL editor.

```sql
select * from public.retention_cohorts();
select * from public.retention_cohorts(p_sources => array['workout']);
select * from public.retention_active_days(p_signup_from => '2026-11-15', p_signup_to => '2026-11-30');
```

## How the arithmetic is tested

`npm run test:unit` runs 80 tests. The retention tests load the project's migration files into
PGlite, a build of Postgres that runs inside the test process, so they exercise the SQL that
produces the figures and do not rely on a copy of it.

The fixture in `tests/unit/retention-fixture.mjs` has ten accounts with known signup and activity
times. Several sit one second on either side of Dubai midnight. Every expected value in
`tests/unit/retention-sql.test.mjs` was calculated by hand from that fixture, with the working
written beside it.

The tests were then checked against deliberately broken SQL. Fourteen faults were introduced one
at a time, including counting days in UTC, an off-by-one error in eligibility, and a missing
exclusion of flagged accounts. Each fault made at least one test fail.

The browser side has two layers. `tests/unit/activity-day.test.mjs` tests the rule for when an
open is reported, with the network and the clock replaced by stand-ins. `tests/app-open.spec.js`
signs in to the built app in Chromium with every Supabase call intercepted, and confirms that the
real app sends the report once, sends nothing on a second open the same day, and sends nothing
when signed out.
