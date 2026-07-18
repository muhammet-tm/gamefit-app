-- GameFit security model
--
-- Principles:
--   1. Every table has RLS enabled; users see only their own rows.
--   2. Server-owned columns (economy, premium, strava, role) are protected by
--      COLUMN-LEVEL grants: the `authenticated` role can UPDATE only the
--      whitelisted profile columns. SECURITY DEFINER functions and the
--      service-role key bypass this.
--   3. workouts / ai_request_logs / coin_transactions accept NO client writes
--      at all — rows are created exclusively by SECURITY DEFINER functions
--      (log_workout) or Edge Functions using the service role.
--   4. strava_connections is invisible to clients entirely.

-- ============================================================ enable RLS
alter table public.profiles           enable row level security;
alter table public.strava_connections enable row level security;
alter table public.workouts           enable row level security;
alter table public.meal_logs          enable row level security;
alter table public.ai_request_logs    enable row level security;
alter table public.coin_transactions  enable row level security;
alter table public.accessories        enable row level security;

-- ============================================================ profiles
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No INSERT/DELETE policies: rows are created by the auth trigger and
-- removed by the auth.users cascade.

-- Column-level write protection: revoke blanket UPDATE, grant only the
-- user-editable columns. (SELECT stays table-wide — users may read all
-- their own columns; strava tokens are in a separate, ungranted table.)
revoke update on public.profiles from authenticated;
grant update (
  first_name,
  last_name,
  fitness_goal,
  fitness_level,
  age,
  height_cm,
  weight_kg,
  bmi,
  gender,
  avatar_config,
  connected_apps,
  onboarding_complete,
  theme_preference,
  calorie_goal
) on public.profiles to authenticated;

-- ============================================================ strava_connections
-- No policies and no grants: PostgREST cannot touch this table with the anon
-- or authenticated role. Only the service-role key (Edge Functions) can.
revoke all on public.strava_connections from anon, authenticated;

-- ============================================================ workouts
create policy "read own workouts"
  on public.workouts for select
  to authenticated
  using (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies + revoked grants: log_workout() is the
-- only write path.
revoke insert, update, delete on public.workouts from anon, authenticated;

-- ============================================================ meal_logs
create policy "read own meals"
  on public.meal_logs for select
  to authenticated
  using (user_id = auth.uid());

create policy "insert own meals"
  on public.meal_logs for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "update own meals"
  on public.meal_logs for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "delete own meals"
  on public.meal_logs for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================ ai_request_logs
create policy "read own ai usage"
  on public.ai_request_logs for select
  to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on public.ai_request_logs from anon, authenticated;

-- ============================================================ coin_transactions
create policy "read own coin ledger"
  on public.coin_transactions for select
  to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on public.coin_transactions from anon, authenticated;

-- ============================================================ accessories
create policy "catalog is readable"
  on public.accessories for select
  to authenticated
  using (is_active);

revoke insert, update, delete on public.accessories from anon, authenticated;

-- ============================================================ lock down anon
-- The app requires login for everything; anonymous visitors get nothing.
revoke all on public.profiles          from anon;
revoke all on public.workouts          from anon;
revoke all on public.meal_logs         from anon;
revoke all on public.ai_request_logs   from anon;
revoke all on public.coin_transactions from anon;
revoke all on public.accessories       from anon;
