-- GameFit initial schema
-- Tables: profiles, workouts, meal_logs, ai_request_logs, coin_transactions,
--         strava_connections (service-only), accessories (catalog).
-- Server-owned columns (economy, premium, strava) are never client-writable —
-- enforced in 20260706120002_security.sql via RLS + column grants.

-- ============================================================ profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,

  -- user-editable profile fields
  first_name text,
  last_name text,
  fitness_goal text,
  fitness_level text,
  age integer check (age is null or age between 16 and 100),
  height_cm numeric check (height_cm is null or height_cm between 100 and 250),
  weight_kg numeric check (weight_kg is null or weight_kg between 30 and 300),
  bmi numeric check (bmi is null or bmi between 5 and 100),
  gender text check (gender is null or gender in ('male', 'female')),
  avatar_config jsonb not null default '{}'::jsonb,
  connected_apps text[] not null default '{}',
  onboarding_complete boolean not null default false,
  theme_preference text not null default 'dark' check (theme_preference in ('dark', 'light')),
  calorie_goal integer check (calorie_goal is null or calorie_goal between 800 and 8000),

  -- server-owned: game economy (written only by SECURITY DEFINER functions)
  total_xp integer not null default 0,
  current_level integer not null default 1,
  total_coins_earned integer not null default 0,
  total_coins_spent integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_workout_day date,
  badges text[] not null default '{}',
  owned_accessories text[] not null default '{}',
  equipped_accessory text,

  -- server-owned: premium (written only by the stripe-webhook function)
  account_type text not null default 'regular' check (account_type in ('regular', 'premium')),
  premium_since timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,

  -- server-owned: admin flag
  role text not null default 'user' check (role in ('user', 'admin')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth user. Economy/premium/strava columns are server-owned.';

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- create a profile row for every new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================ strava_connections
-- OAuth tokens live here, NOT on profiles: no API access for any client role.
-- Only Edge Functions using the service-role key can read/write them.
create table public.strava_connections (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null,
  athlete jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================ workouts
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_type text not null,
  duration_min integer not null check (duration_min between 1 and 600),
  intensity_level text not null check (intensity_level in ('Low', 'Medium', 'High')),
  xp_earned integer not null,
  coins_earned integer not null,
  total_xp_after integer not null,
  level_before integer not null,
  level_after integer not null,
  streak_count integer not null,
  notes text not null default '' check (char_length(notes) <= 500),
  created_at timestamptz not null default now()
);

create index workouts_user_created_idx on public.workouts (user_id, created_at desc);
create index workouts_created_idx on public.workouts (created_at desc);

-- ============================================================ meal_logs
create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  meal_name text not null check (char_length(meal_name) between 1 and 200),
  meal_type text check (meal_type in
    ('Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack')),
  calories numeric not null check (calories between 0 and 10000),
  protein_g numeric check (protein_g is null or protein_g between 0 and 1000),
  carbs_g numeric check (carbs_g is null or carbs_g between 0 and 1000),
  fat_g numeric check (fat_g is null or fat_g between 0 and 1000),
  image_url text,
  logged_date date not null default ((now() at time zone 'Asia/Dubai')::date),
  health_score numeric check (health_score is null or health_score between 0 and 10),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now()
);

create index meal_logs_user_date_idx on public.meal_logs (user_id, logged_date desc);

-- ============================================================ ai_request_logs
create table public.ai_request_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  request_type text not null check (request_type in ('plan', 'nutrition', 'chat', 'meal_analysis')),
  month_key text not null,
  logged_date date not null,
  created_at timestamptz not null default now()
);

create index ai_request_logs_user_month_idx on public.ai_request_logs (user_id, month_key);

-- ============================================================ coin_transactions
-- Append-only ledger of every coin movement besides workout earnings
-- (those live on the workout rows themselves).
create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('purchase', 'level_bonus', 'adjustment')),
  item_id text,
  amount integer not null,          -- negative = spend, positive = grant
  balance_after integer not null,
  created_at timestamptz not null default now()
);

create index coin_transactions_user_idx on public.coin_transactions (user_id, created_at desc);

-- ============================================================ accessories catalog
-- Server-side source of truth for shop prices. Client may read, never write.
create table public.accessories (
  id text primary key,
  label text not null,
  emoji text not null,
  cost integer not null check (cost > 0),
  effect text not null default '',
  category text not null check (category in ('head', 'aura', 'gear', 'back', 'badge')),
  is_active boolean not null default true
);

insert into public.accessories (id, label, emoji, cost, effect, category) values
  ('halo',        'Golden Halo',    '😇', 80,  'Crown of champions',   'head'),
  ('crown',       'War Crown',      '👑', 150, 'For true legends',     'head'),
  ('flames',      'Fire Aura',      '🔥', 120, 'Burning intensity',    'aura'),
  ('lightning',   'Thunder Aura',   '⚡', 200, 'Storm power',          'aura'),
  ('shield_glow', 'Glowing Shield', '🛡️', 100, 'Radiant defense',      'gear'),
  ('sword_glow',  'Neon Blade',     '⚔️', 130, 'Cuts through limits',  'gear'),
  ('wings',       'Angel Wings',    '🪽', 300, 'Ascended form',        'back'),
  ('cape',        'Hero Cape',      '🦸', 180, 'Legendary swagger',    'back'),
  ('star_badge',  'Star Badge',     '⭐', 60,  'Proven champion',      'badge'),
  ('diamond',     'Diamond Badge',  '💎', 250, 'Elite status',         'badge');
