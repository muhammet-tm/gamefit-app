-- Retention measurement, from data the database already holds.
--
-- GameFit's paper claims to improve user retention, and until now nothing in
-- the system measured it. This migration adds the measurement and nothing
-- else: no third-party service, no change to XP, coins, streaks, or the
-- leaderboard.
--
-- ---------------------------------------------------------------------------
-- What counts as an active day
-- ---------------------------------------------------------------------------
-- A user is ACTIVE on a calendar day (Asia/Dubai, the same day boundary the
-- economy uses) when the server recorded at least one of these on that day:
--
--   'workout'   a logged workout          (public.workouts.created_at)
--   'coach'     an accepted Coach G call  (public.ai_request_logs.created_at)
--   'app_open'  the app was opened or brought back to the foreground while
--               signed in                 (public.activity_days, new below)
--
-- "Accepted" is exact: coach-g writes the usage row before it calls the model
-- and removes it when the call fails, so a row is a request the user made
-- that was not refunded. A request refused at the free cap leaves no row.
--
-- All three are stamped by the server, never by the browser. Workouts and
-- coach requests are read from their own tables rather than copied, so there
-- is one source of truth for each and the history reaches back to the first
-- signup. App opens were never recorded before, which is why they need a
-- table, and why they exist only from the day this migration is applied.
--
-- Deliberately NOT counted:
--   * meal logs: the client may write `created_at` and `logged_date` on that
--     table, so their dates are self-reported;
--   * personal records and shop purchases: both imply an app open on the same
--     day, so they add nothing once app opens are recorded.
--
-- Every reporting function takes `p_sources`, so the same question can be
-- asked under a stricter definition (workouts only) without new code.
--
-- ---------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------
--   record_app_open()        signed-in users; writes only the caller's own row
--   retention_*() reporting  service role only (and the dashboard SQL editor)
--   retention_scope/activity/validate helpers: owner only
--
-- Supabase grants EXECUTE on new functions in `public` to anon, authenticated
-- and service_role by default, so every function below revokes explicitly.

-- ============================================================ activity_days
-- Append-only. One row per user per Dubai day per source; with the single
-- source allowed today that is at most one row per user per day. The table
-- stores a date and nothing else: no time of day, no device, no page.
create table public.activity_days (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  source text not null default 'app_open' check (source in ('app_open')),
  primary key (user_id, day, source)
);

comment on table public.activity_days is
  'Days on which a signed-in user opened the app (Asia/Dubai date only). Written only by record_app_open(). Workouts and coach requests are NOT copied here; retention functions read them from their own tables.';

alter table public.activity_days enable row level security;

-- No policies and no grants: clients cannot read or write this table by any
-- path except record_app_open(). Rows leave only through the profile cascade
-- when an account is deleted.
revoke all on public.activity_days from anon, authenticated;

-- ============================================================ record_app_open
-- Takes no arguments on purpose. The user comes from the session and the day
-- from the server clock, so there is nothing a client could forge: not
-- another user's id, not another date.
create or replace function public.record_app_open()
returns date
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_day date := (now() at time zone 'Asia/Dubai')::date;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  insert into activity_days (user_id, day, source)
  values (v_user_id, v_day, 'app_open')
  on conflict do nothing;

  -- The client keeps this to avoid calling again on the same Dubai day.
  return v_day;
end;
$$;

-- ============================================================ exclusions
-- Accounts that must never appear in a retention figure: the QA account the
-- end-to-end tests log in with, throwaway test accounts, and staff. Accounts
-- with profiles.role = 'admin' are excluded automatically and need no row.
create table public.analytics_excluded_users (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('qa', 'test', 'staff')),
  added_at timestamptz not null default now()
);

comment on table public.analytics_excluded_users is
  'Accounts left out of every retention_* figure. Service-role only.';

alter table public.analytics_excluded_users enable row level security;
revoke all on public.analytics_excluded_users from anon, authenticated;

-- ============================================================ helpers

-- Rejects bad arguments loudly. A typo in a source name would otherwise
-- return a plausible table of zeros.
create or replace function public.retention_validate(
  p_sources text[],
  p_days integer[],
  p_window_days integer
)
returns void
language plpgsql
immutable
set search_path = public, pg_temp
as $$
begin
  if p_sources is null or cardinality(p_sources) = 0 then
    raise exception 'p_sources must name at least one source' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(p_sources) s
              where s is null or s not in ('app_open', 'workout', 'coach')) then
    raise exception 'p_sources may contain only app_open, workout, coach' using errcode = '22023';
  end if;
  if p_days is null or cardinality(p_days) = 0
     or exists (select 1 from unnest(p_days) d where d is null or d < 0 or d > 3650) then
    raise exception 'p_days must be whole days between 0 and 3650' using errcode = '22023';
  end if;
  if p_window_days is null or p_window_days < 1 or p_window_days > 3650 then
    raise exception 'p_window_days must be between 1 and 3650' using errcode = '22023';
  end if;
end;
$$;

-- The accounts a figure is about: everyone who signed up on or before the
-- as-of day, minus admins and flagged accounts, optionally narrowed to a
-- signup window (a study's recruitment period) or to people who finished
-- onboarding.
--
--   signup_day   Dubai calendar date of profiles.created_at. This is "day 0".
--   cohort_week  the Monday (Dubai) of the week that day falls in.
create or replace function public.retention_scope(
  p_as_of date,
  p_onboarded_only boolean,
  p_signup_from date,
  p_signup_to date
)
returns table (user_id uuid, signup_day date, cohort_week date, onboarded boolean)
language sql
stable
set search_path = public, pg_temp
as $$
  select s.id,
         s.signup_day,
         date_trunc('week', s.signup_day::timestamp)::date,
         s.onboarding_complete
    from (
      select p.id,
             (p.created_at at time zone 'Asia/Dubai')::date as signup_day,
             p.onboarding_complete
        from profiles p
       where p.role <> 'admin'
         and not exists (select 1 from analytics_excluded_users x where x.user_id = p.id)
    ) s
   where s.signup_day <= p_as_of
     and (p_signup_from is null or s.signup_day >= p_signup_from)
     and (p_signup_to is null or s.signup_day <= p_signup_to)
     and (not coalesce(p_onboarded_only, false) or s.onboarding_complete);
$$;

-- One row per (user, Dubai day) on which the user was active under the chosen
-- sources, up to and including the as-of day. UNION removes duplicates, so a
-- day with a workout, a coach request, and an app open is still one day.
create or replace function public.retention_activity(
  p_as_of date,
  p_sources text[]
)
returns table (user_id uuid, day date)
language sql
stable
set search_path = public, pg_temp
as $$
  select a.user_id, a.day
    from activity_days a
   where 'app_open' = any (p_sources)
     and a.source = 'app_open'
     and a.day <= p_as_of
  union
  select w.user_id, (w.created_at at time zone 'Asia/Dubai')::date
    from workouts w
   where 'workout' = any (p_sources)
     and (w.created_at at time zone 'Asia/Dubai')::date <= p_as_of
  union
  select r.user_id, (r.created_at at time zone 'Asia/Dubai')::date
    from ai_request_logs r
   where 'coach' = any (p_sources)
     and (r.created_at at time zone 'Asia/Dubai')::date <= p_as_of;
$$;

-- The first Dubai day on which an app open was recorded for an account that
-- counts, looking no later than the as-of day. Excluded accounts are ignored
-- on purpose: a QA or staff session that reaches the new code before real
-- users do must not make earlier cohorts look fully recorded.
create or replace function public.retention_tracking_since(p_as_of date)
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select min(a.day)
    from activity_days a
    join retention_scope(p_as_of, false, null, null) s on s.user_id = a.user_id
   where a.source = 'app_open'
     and a.day <= p_as_of;
$$;

-- ============================================================ retention_cohorts
-- Cohort retention by signup week, one row per cohort and day N, plus pooled
-- rows over all cohorts (is_pooled = true, cohort_week null).
--
-- For a user who signed up on Dubai day D:
--
--   eligible              D + N is on or before the as-of day. A user whose
--                         day N has not happened yet is left out of BOTH the
--                         numerator and the denominator, so a young cohort
--                         cannot drag a rate down.
--   retained_on_day       active on exactly D + N. This is classic N-day
--                         retention.
--   retained_on_or_after  active on D + N or on any later day up to the
--                         as-of day. This is unbounded (rolling) retention.
--                         It can only rise as the as-of day moves forward, so
--                         it must always be reported together with as_of.
--
--   app_open_tracked      true when every user in the row signed up on or
--                         after the first app open recorded for a counted
--                         account (retention_tracking_since). When false, the
--                         cohort's early days predate app-open recording and
--                         an 'app_open' figure understates them. Null when
--                         p_sources does not include 'app_open'.
--
-- p_as_of defaults to yesterday in Dubai: today is still in progress.
create or replace function public.retention_cohorts(
  p_as_of date default null,
  p_sources text[] default array['app_open', 'workout', 'coach'],
  p_onboarded_only boolean default false,
  p_signup_from date default null,
  p_signup_to date default null,
  p_days integer[] default array[1, 7, 14, 21, 30]
)
returns table (
  cohort_week date,
  is_pooled boolean,
  cohort_size integer,
  day_n integer,
  eligible integer,
  retained_on_day integer,
  rate_on_day numeric,
  retained_on_or_after integer,
  rate_on_or_after numeric,
  app_open_tracked boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_as_of date := coalesce(p_as_of, (now() at time zone 'Asia/Dubai')::date - 1);
  v_tracking_since date;
begin
  perform retention_validate(p_sources, p_days, 30);
  v_tracking_since := retention_tracking_since(v_as_of);

  return query
  with scope as (
    select s.user_id, s.signup_day, s.cohort_week
      from retention_scope(v_as_of, p_onboarded_only, p_signup_from, p_signup_to) s
  ), activity as (
    select a.user_id, a.day from retention_activity(v_as_of, p_sources) a
  ), grid as (
    -- One row per account and checkpoint. The join brings in all of that
    -- account's active days at once, so the cost grows with the number of
    -- active days and not with accounts multiplied by all activity.
    select s.user_id,
           s.cohort_week as cw,
           d.n,
           (s.signup_day + d.n <= v_as_of) as is_eligible,
           coalesce(bool_or(a.day = s.signup_day + d.n), false) as on_day,
           coalesce(bool_or(a.day >= s.signup_day + d.n), false) as on_or_after,
           (v_tracking_since is not null and s.signup_day >= v_tracking_since) as tracked
      from scope s
     cross join (select distinct x as n from unnest(p_days) x) d
      left join activity a on a.user_id = s.user_id
     group by s.user_id, s.cohort_week, s.signup_day, d.n
  ), agg as (
    select g.cw,
           (grouping(g.cw) = 1) as pooled,
           g.n,
           count(*)::integer as size,
           (count(*) filter (where g.is_eligible))::integer as n_eligible,
           (count(*) filter (where g.is_eligible and g.on_day))::integer as n_on_day,
           (count(*) filter (where g.is_eligible and g.on_or_after))::integer as n_on_or_after,
           bool_and(g.tracked) as all_tracked
      from grid g
     group by grouping sets ((g.cw, g.n), (g.n))
  )
  select a.cw,
         a.pooled,
         a.size,
         a.n,
         a.n_eligible,
         a.n_on_day,
         round(a.n_on_day::numeric / nullif(a.n_eligible, 0), 4),
         a.n_on_or_after,
         round(a.n_on_or_after::numeric / nullif(a.n_eligible, 0), 4),
         case when 'app_open' = any (p_sources) then a.all_tracked end
    from agg a
   order by a.pooled, a.cw, a.n;
end;
$$;

-- ============================================================ retention_active_days
-- How many distinct days each user was active in their first p_window_days
-- calendar days, counting the signup day as day 0 (so the default window is
-- day 0 to day 29). Summarised per signup-week cohort and pooled.
--
-- `users` counts only those whose whole window has elapsed by the as-of day;
-- everyone else is left out so a half-observed user cannot lower the median.
-- A user with no activity at all counts as 0 days, not as missing.
create or replace function public.retention_active_days(
  p_as_of date default null,
  p_sources text[] default array['app_open', 'workout', 'coach'],
  p_onboarded_only boolean default false,
  p_signup_from date default null,
  p_signup_to date default null,
  p_window_days integer default 30
)
returns table (
  cohort_week date,
  is_pooled boolean,
  cohort_size integer,
  users integer,
  median_active_days numeric,
  mean_active_days numeric,
  p25_active_days numeric,
  p75_active_days numeric,
  max_active_days integer,
  users_with_zero_days integer
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_as_of date := coalesce(p_as_of, (now() at time zone 'Asia/Dubai')::date - 1);
begin
  perform retention_validate(p_sources, array[1], p_window_days);

  return query
  with scope as (
    select s.user_id, s.signup_day, s.cohort_week
      from retention_scope(v_as_of, p_onboarded_only, p_signup_from, p_signup_to) s
  ), activity as (
    select a.user_id, a.day from retention_activity(v_as_of, p_sources) a
  ), per_user as (
    -- `activity` already holds one row per account and day, so counting rows
    -- inside the window counts distinct active days. An account with no
    -- activity survives the left join and counts as 0.
    select s.cohort_week as cw,
           (s.signup_day + (p_window_days - 1) <= v_as_of) as observed,
           (count(a.day) filter (
              where a.day >= s.signup_day
                and a.day <= s.signup_day + (p_window_days - 1)))::integer as n_days
      from scope s
      left join activity a on a.user_id = s.user_id
     group by s.user_id, s.cohort_week, s.signup_day
  )
  select u.cw,
         (grouping(u.cw) = 1),
         count(*)::integer,
         (count(*) filter (where u.observed))::integer,
         round((percentile_cont(0.5) within group (order by u.n_days)
                  filter (where u.observed))::numeric, 2),
         round((avg(u.n_days) filter (where u.observed))::numeric, 2),
         round((percentile_cont(0.25) within group (order by u.n_days)
                  filter (where u.observed))::numeric, 2),
         round((percentile_cont(0.75) within group (order by u.n_days)
                  filter (where u.observed))::numeric, 2),
         (max(u.n_days) filter (where u.observed))::integer,
         (count(*) filter (where u.observed and u.n_days = 0))::integer
    from per_user u
   group by grouping sets ((u.cw), ())
   order by 2, 1;
end;
$$;

-- ============================================================ retention_weekly_engagement
-- One row per COMPLETE calendar week (Monday to Sunday, Asia/Dubai), from the
-- first signup week in scope to the last week that ended on or before the
-- as-of day. A week still in progress is left out.
--
--   registered_users   accounts in scope that had signed up by the week's end
--   active_users       of those, how many were active at least once that week
--   workouts           workouts logged that week by the active users
--   coach_requests     Coach G calls that week by the active users
--   *_per_active_user  the count divided by active_users (null when no one
--                      was active, never zero)
--
-- Numerators count only actions by users who were active that week under
-- p_sources. With the default sources that is every workout and every coach
-- request, because each one makes its author active.
create or replace function public.retention_weekly_engagement(
  p_as_of date default null,
  p_sources text[] default array['app_open', 'workout', 'coach'],
  p_onboarded_only boolean default false,
  p_signup_from date default null,
  p_signup_to date default null
)
returns table (
  week_start date,
  registered_users integer,
  active_users integer,
  workout_users integer,
  workouts integer,
  workouts_per_active_user numeric,
  coach_users integer,
  coach_requests integer,
  coach_requests_per_active_user numeric
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_as_of date := coalesce(p_as_of, (now() at time zone 'Asia/Dubai')::date - 1);
  -- Monday of the last week whose Sunday is on or before the as-of day.
  v_last_week date := date_trunc('week', (v_as_of + 1)::timestamp)::date - 7;
begin
  perform retention_validate(p_sources, array[1], 30);

  return query
  with scope as (
    select s.user_id, s.signup_day, s.cohort_week
      from retention_scope(v_as_of, p_onboarded_only, p_signup_from, p_signup_to) s
  ), weeks as (
    select gs::date as ws
      from generate_series(
             (select min(s.cohort_week) from scope s)::timestamp,
             v_last_week::timestamp,
             interval '7 days') gs
  ), active as (
    select distinct date_trunc('week', a.day::timestamp)::date as ws, a.user_id
      from retention_activity(v_as_of, p_sources) a
      join scope s on s.user_id = a.user_id
  ), workout_counts as (
    select date_trunc('week', (w.created_at at time zone 'Asia/Dubai'))::date as ws,
           w.user_id,
           count(*)::integer as n
      from workouts w
      join scope s on s.user_id = w.user_id
     where (w.created_at at time zone 'Asia/Dubai')::date <= v_as_of
     group by 1, 2
  ), coach_counts as (
    select date_trunc('week', (r.created_at at time zone 'Asia/Dubai'))::date as ws,
           r.user_id,
           count(*)::integer as n
      from ai_request_logs r
      join scope s on s.user_id = r.user_id
     where (r.created_at at time zone 'Asia/Dubai')::date <= v_as_of
     group by 1, 2
  ), per_week as (
    select k.ws,
           (select count(*) from scope s where s.signup_day <= k.ws + 6)::integer as registered,
           (select count(*) from active a where a.ws = k.ws)::integer as n_active,
           (select count(*) from workout_counts c
              join active a on a.ws = c.ws and a.user_id = c.user_id
             where c.ws = k.ws)::integer as n_workout_users,
           (select coalesce(sum(c.n), 0) from workout_counts c
              join active a on a.ws = c.ws and a.user_id = c.user_id
             where c.ws = k.ws)::integer as n_workouts,
           (select count(*) from coach_counts c
              join active a on a.ws = c.ws and a.user_id = c.user_id
             where c.ws = k.ws)::integer as n_coach_users,
           (select coalesce(sum(c.n), 0) from coach_counts c
              join active a on a.ws = c.ws and a.user_id = c.user_id
             where c.ws = k.ws)::integer as n_coach
      from weeks k
  )
  select w.ws,
         w.registered,
         w.n_active,
         w.n_workout_users,
         w.n_workouts,
         round(w.n_workouts::numeric / nullif(w.n_active, 0), 4),
         w.n_coach_users,
         w.n_coach,
         round(w.n_coach::numeric / nullif(w.n_active, 0), 4)
    from per_week w
   order by w.ws;
end;
$$;

-- ============================================================ retention_report
-- Everything above in one call and one database snapshot, as JSON. This is
-- what scripts/export-retention.mjs reads, so that a figure in the paper is
-- produced by this file and never retyped.
--
-- `totals` holds the headline engagement figures:
--   workouts_per_active_user_week        all workouts in complete weeks,
--                                        divided by active user-weeks
--   coach_requests_per_active_user_week  the same for Coach G calls
--   coach_requests_per_active_user       all Coach G calls up to the as-of
--                                        day, divided by the users who were
--                                        active at least once
create or replace function public.retention_report(
  p_as_of date default null,
  p_sources text[] default array['app_open', 'workout', 'coach'],
  p_onboarded_only boolean default false,
  p_signup_from date default null,
  p_signup_to date default null,
  p_window_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_as_of date := coalesce(p_as_of, (now() at time zone 'Asia/Dubai')::date - 1);
  v_accounts jsonb;
  v_cohorts jsonb;
  v_active_days jsonb;
  v_weekly jsonb;
  v_totals jsonb;
  v_active_ever integer;
  v_coach_total integer;
  v_workout_total integer;
begin
  perform retention_validate(p_sources, array[1], p_window_days);

  select jsonb_build_object(
           'in_scope', count(*),
           'onboarded', count(*) filter (where s.onboarded),
           'first_signup_day', min(s.signup_day),
           'last_signup_day', max(s.signup_day),
           -- Accounts that meet every condition above (as-of day, signup
           -- window, onboarding) and are left out only because they are
           -- admin or flagged. An excluded account outside the window is not
           -- "excluded from this report"; it was never in it.
           'excluded', (
             select count(*)
               from (select p.id, p.role, p.onboarding_complete,
                            (p.created_at at time zone 'Asia/Dubai')::date as signup_day
                       from profiles p) e
              where e.signup_day <= v_as_of
                and (p_signup_from is null or e.signup_day >= p_signup_from)
                and (p_signup_to is null or e.signup_day <= p_signup_to)
                and (not coalesce(p_onboarded_only, false) or e.onboarding_complete)
                and (e.role = 'admin'
                     or exists (select 1 from analytics_excluded_users x
                                 where x.user_id = e.id))))
    into v_accounts
    from retention_scope(v_as_of, p_onboarded_only, p_signup_from, p_signup_to) s;

  select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) into v_cohorts
    from retention_cohorts(v_as_of, p_sources, p_onboarded_only,
                           p_signup_from, p_signup_to) c;

  select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb) into v_active_days
    from retention_active_days(v_as_of, p_sources, p_onboarded_only,
                               p_signup_from, p_signup_to, p_window_days) d;

  select coalesce(jsonb_agg(to_jsonb(w)), '[]'::jsonb),
         jsonb_build_object(
           'complete_weeks', count(*),
           'active_user_weeks', coalesce(sum(w.active_users), 0),
           'workouts_in_complete_weeks', coalesce(sum(w.workouts), 0),
           'workouts_per_active_user_week',
             round(sum(w.workouts)::numeric / nullif(sum(w.active_users), 0), 4),
           'coach_requests_in_complete_weeks', coalesce(sum(w.coach_requests), 0),
           'coach_requests_per_active_user_week',
             round(sum(w.coach_requests)::numeric / nullif(sum(w.active_users), 0), 4))
    into v_weekly, v_totals
    from retention_weekly_engagement(v_as_of, p_sources, p_onboarded_only,
                                     p_signup_from, p_signup_to) w;

  with scope as (
    select s.user_id
      from retention_scope(v_as_of, p_onboarded_only, p_signup_from, p_signup_to) s
  ), active_ever as (
    select distinct a.user_id
      from retention_activity(v_as_of, p_sources) a
      join scope s on s.user_id = a.user_id
  )
  select (select count(*) from active_ever)::integer,
         (select count(*) from ai_request_logs r
            join active_ever e on e.user_id = r.user_id
           where (r.created_at at time zone 'Asia/Dubai')::date <= v_as_of)::integer,
         (select count(*) from workouts w
            join active_ever e on e.user_id = w.user_id
           where (w.created_at at time zone 'Asia/Dubai')::date <= v_as_of)::integer
    into v_active_ever, v_coach_total, v_workout_total;

  v_totals := v_totals || jsonb_build_object(
    'active_users_ever', v_active_ever,
    'workouts_total', v_workout_total,
    'coach_requests_total', v_coach_total,
    'coach_requests_per_active_user',
      round(v_coach_total::numeric / nullif(v_active_ever, 0), 4));

  return jsonb_build_object(
    'schema_version', 1,
    'as_of', v_as_of,
    'time_zone', 'Asia/Dubai',
    'sources', to_jsonb(p_sources),
    'onboarded_only', coalesce(p_onboarded_only, false),
    'signup_from', p_signup_from,
    'signup_to', p_signup_to,
    'window_days', p_window_days,
    'app_open_tracking_since', retention_tracking_since(v_as_of),
    'accounts', v_accounts,
    'cohorts', v_cohorts,
    'active_days', v_active_days,
    'weekly', v_weekly,
    'totals', v_totals
  );
end;
$$;

-- ============================================================ permissions

-- The one function a browser may call.
revoke all on function public.record_app_open() from public, anon;
grant execute on function public.record_app_open() to authenticated;

-- Reporting: the service role only. No logged-in user, admin or not, can call
-- these through the API; the owner can also run them in the dashboard SQL
-- editor, which connects as the database owner.
revoke all on function public.retention_cohorts(date, text[], boolean, date, date, integer[])
  from public, anon, authenticated;
revoke all on function public.retention_active_days(date, text[], boolean, date, date, integer)
  from public, anon, authenticated;
revoke all on function public.retention_weekly_engagement(date, text[], boolean, date, date)
  from public, anon, authenticated;
revoke all on function public.retention_report(date, text[], boolean, date, date, integer)
  from public, anon, authenticated;

grant execute on function public.retention_cohorts(date, text[], boolean, date, date, integer[])
  to service_role;
grant execute on function public.retention_active_days(date, text[], boolean, date, date, integer)
  to service_role;
grant execute on function public.retention_weekly_engagement(date, text[], boolean, date, date)
  to service_role;
grant execute on function public.retention_report(date, text[], boolean, date, date, integer)
  to service_role;

-- Helpers return per-user rows, so nobody calls them through the API at all.
-- The reporting functions above run as the owner and still reach them.
revoke all on function public.retention_validate(text[], integer[], integer)
  from public, anon, authenticated, service_role;
revoke all on function public.retention_scope(date, boolean, date, date)
  from public, anon, authenticated, service_role;
revoke all on function public.retention_activity(date, text[])
  from public, anon, authenticated, service_role;
revoke all on function public.retention_tracking_since(date)
  from public, anon, authenticated, service_role;
