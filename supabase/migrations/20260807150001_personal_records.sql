-- Personal records: self-reported strength PRs (best weight x reps per
-- exercise). Writes go only through log_pr(), which decides whether an entry
-- is a new record and awards the two cosmetic PR badges. Deliberately NO
-- coins or XP: PRs are unverifiable self-reports and must never feed the
-- leaderboard economy.

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise text not null check (char_length(exercise) between 2 and 60),
  weight_kg numeric not null check (weight_kg > 0 and weight_kg <= 600),
  reps integer not null check (reps between 1 and 100),
  achieved_on date not null default ((now() at time zone 'Asia/Dubai')::date),
  created_at timestamptz not null default now()
);

create index personal_records_user_ex_idx
  on public.personal_records (user_id, lower(exercise), weight_kg desc, reps desc);

alter table public.personal_records enable row level security;

create policy "read own prs"
  on public.personal_records for select
  to authenticated
  using (user_id = auth.uid());

-- Users may remove their own mistyped entries; no economy impact.
create policy "delete own prs"
  on public.personal_records for delete
  to authenticated
  using (user_id = auth.uid());

-- Inserts/updates only via log_pr(); nothing for anonymous visitors.
revoke insert, update on public.personal_records from anon, authenticated;
revoke all on public.personal_records from anon;

create or replace function public.log_pr(
  p_exercise text,
  p_weight_kg numeric,
  p_reps integer,
  p_achieved_on date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_exercise text := regexp_replace(btrim(coalesce(p_exercise, '')), '\s+', ' ', 'g');
  v_today date := (now() at time zone 'Asia/Dubai')::date;
  v_date date := coalesce(p_achieved_on, (now() at time zone 'Asia/Dubai')::date);
  v_prev_weight numeric;
  v_prev_reps integer;
  v_has_prev boolean := false;
  v_is_record boolean := false;
  v_badges text[];
  v_new_badges text[] := '{}';
  v_row personal_records;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if char_length(v_exercise) < 2 or char_length(v_exercise) > 60 then
    raise exception 'exercise name must be 2-60 characters' using errcode = '22023';
  end if;
  if p_weight_kg is null or p_weight_kg <= 0 or p_weight_kg > 600 then
    raise exception 'weight must be between 0 and 600 kg' using errcode = '22023';
  end if;
  if p_reps is null or p_reps < 1 or p_reps > 100 then
    raise exception 'reps must be between 1 and 100' using errcode = '22023';
  end if;
  if v_date > v_today then
    raise exception 'date cannot be in the future' using errcode = '22023';
  end if;

  -- spam guard, same spirit as log_workout's daily caps
  if (select count(*) from personal_records
      where user_id = v_user and created_at > now() - interval '1 day') >= 20 then
    raise exception 'daily PR limit reached (20 per day)' using errcode = 'P0001';
  end if;

  select weight_kg, reps into v_prev_weight, v_prev_reps
  from personal_records
  where user_id = v_user and lower(exercise) = lower(v_exercise)
  order by weight_kg desc, reps desc
  limit 1;
  v_has_prev := found;

  if not v_has_prev then
    v_is_record := true;
  elsif p_weight_kg > v_prev_weight
     or (p_weight_kg = v_prev_weight and p_reps > v_prev_reps) then
    v_is_record := true;
  end if;

  insert into personal_records (user_id, exercise, weight_kg, reps, achieved_on)
  values (v_user, v_exercise, p_weight_kg, p_reps, v_date)
  returning * into v_row;

  -- cosmetic badges only (no coins/XP for self-reported lifts)
  select badges into v_badges from profiles where id = v_user for update;
  if not ('record_setter' = any(v_badges)) then
    v_badges := array_append(v_badges, 'record_setter');
    v_new_badges := array_append(v_new_badges, 'record_setter');
  end if;
  if v_is_record and v_has_prev and not ('record_breaker' = any(v_badges)) then
    v_badges := array_append(v_badges, 'record_breaker');
    v_new_badges := array_append(v_new_badges, 'record_breaker');
  end if;
  if array_length(v_new_badges, 1) > 0 then
    update profiles set badges = v_badges where id = v_user;
  end if;

  return jsonb_build_object(
    'record', to_jsonb(v_row),
    'is_new_record', v_is_record,
    'previous_best', case when not v_has_prev then null
      else jsonb_build_object('weight_kg', v_prev_weight, 'reps', v_prev_reps) end,
    'new_badges', to_jsonb(v_new_badges)
  );
end;
$$;
