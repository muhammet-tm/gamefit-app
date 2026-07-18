-- GameFit server-authoritative game logic.
--
-- The browser only reports WHAT the user did ("30 min Running, High").
-- Everything the user could cheat with — XP, coins, streaks, levels, badges,
-- purchases — is computed here, inside transactions, using Asia/Dubai for all
-- day boundaries. All functions are SECURITY DEFINER (they bypass RLS and the
-- column grants) and are callable only by logged-in users.

-- ============================================================ helpers

create or replace function public.level_for_xp(p_xp integer)
returns integer
language sql
immutable
as $$
  -- thresholds: L1=0, L2=500, L3=1500, L4=3000, L5=5500,
  --             L6=8000, L7=12000, L8=18000, L9=26000, L10=35000
  select count(*)::integer
  from unnest(array[0, 500, 1500, 3000, 5500, 8000, 12000, 18000, 26000, 35000]) as t
  where p_xp >= t;
$$;

create or replace function public.avatar_tier_for_level(p_level integer)
returns integer
language sql
immutable
as $$
  select case
    when p_level <= 2 then 1
    when p_level <= 4 then 2
    when p_level <= 6 then 3
    when p_level <= 9 then 4
    else 5
  end;
$$;

create or replace function public.dubai_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Dubai')::date;
$$;

-- Recompute the full badge set for a user. Mirrors src/lib/badges.js.
create or replace function public.compute_badges(
  p_user_id uuid,
  p_total_xp integer,
  p_level integer,
  p_best_streak integer
)
returns text[]
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_types integer;
  v_high integer;
  v_badges text[] := '{}';
begin
  select count(*), count(distinct exercise_type),
         count(*) filter (where intensity_level = 'High')
    into v_count, v_types, v_high
    from workouts where user_id = p_user_id;

  if v_count >= 1   then v_badges := v_badges || 'first_sweat'; end if;
  if v_count >= 10  then v_badges := v_badges || 'ten_workouts'; end if;
  if v_count >= 50  then v_badges := v_badges || 'fifty_workouts'; end if;
  if v_count >= 100 then v_badges := v_badges || 'century'; end if;

  if p_best_streak >= 3  then v_badges := v_badges || 'streak_3'; end if;
  if p_best_streak >= 7  then v_badges := v_badges || 'streak_7'; end if;
  if p_best_streak >= 30 then v_badges := v_badges || 'streak_30'; end if;

  if p_total_xp >= 1000  then v_badges := v_badges || 'xp_1000'; end if;
  if p_total_xp >= 5000  then v_badges := v_badges || 'xp_5000'; end if;
  if p_total_xp >= 10000 then v_badges := v_badges || 'xp_10000'; end if;

  if v_types >= 5  then v_badges := v_badges || 'variety'; end if;
  if v_high >= 10  then v_badges := v_badges || 'high_intensity'; end if;

  if p_level >= 5  then v_badges := v_badges || 'level_5'; end if;
  if p_level >= 10 then v_badges := v_badges || 'level_10'; end if;

  return v_badges;
end;
$$;

-- ============================================================ log_workout

create or replace function public.log_workout(
  p_exercise_type text,
  p_duration_min integer,
  p_intensity text,
  p_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile profiles%rowtype;
  v_today date := dubai_today();
  v_day_start timestamptz;
  v_today_count integer;
  v_today_minutes integer;
  v_mult numeric;
  v_xp integer;
  v_base_coins integer;
  v_streak integer;
  v_streak_mult numeric;
  v_coins integer;
  v_new_total_xp integer;
  v_new_level integer;
  v_level_bonus integer := 0;
  v_new_badges text[];
  v_prev_badges text[];
  v_workout workouts%rowtype;
  v_diff integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- ---- validate input (server never trusts the client)
  if p_exercise_type is null or p_exercise_type not in
     ('Running', 'Cycling', 'Weight Training', 'Swimming', 'Yoga', 'HIIT',
      'Boxing', 'Basketball', 'Football', 'Walking', 'Other') then
    raise exception 'invalid exercise type' using errcode = '22023';
  end if;
  if p_duration_min is null or p_duration_min < 1 or p_duration_min > 600 then
    raise exception 'duration must be between 1 and 600 minutes' using errcode = '22023';
  end if;
  if p_intensity is null or p_intensity not in ('Low', 'Medium', 'High') then
    raise exception 'invalid intensity' using errcode = '22023';
  end if;
  if p_notes is not null and char_length(p_notes) > 500 then
    raise exception 'notes too long (max 500 chars)' using errcode = '22023';
  end if;

  -- ---- lock the profile row: serializes concurrent workouts/purchases per user
  select * into v_profile from profiles where id = v_user_id for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  -- ---- daily caps (Asia/Dubai day)
  v_day_start := (v_today::timestamp at time zone 'Asia/Dubai');
  select count(*), coalesce(sum(duration_min), 0)
    into v_today_count, v_today_minutes
    from workouts
    where user_id = v_user_id and created_at >= v_day_start;

  if v_today_count >= 10 then
    raise exception 'daily workout limit reached (10 per day)' using errcode = 'P0001';
  end if;
  if v_today_minutes + p_duration_min > 600 then
    raise exception 'daily training limit reached (600 minutes per day)' using errcode = 'P0001';
  end if;

  -- ---- XP (parity with the original client math: 2 XP/min x intensity)
  v_mult := case p_intensity when 'Low' then 1.0 when 'Medium' then 1.5 else 2.0 end;
  v_xp := round(p_duration_min * 2 * v_mult);
  v_base_coins := floor(v_xp / 10.0);

  -- ---- streak (same-day workouts KEEP the streak; missing a day resets it)
  if v_profile.last_workout_day is null then
    v_streak := 1;
  else
    v_diff := v_today - v_profile.last_workout_day;
    v_streak := case
      when v_diff = 0 then greatest(v_profile.current_streak, 1)
      when v_diff = 1 then v_profile.current_streak + 1
      else 1
    end;
  end if;

  -- streak coin bonus: 3+ days = x1.25, 7+ days = x1.5
  v_streak_mult := case when v_streak >= 7 then 1.5 when v_streak >= 3 then 1.25 else 1.0 end;
  v_coins := round(v_base_coins * v_streak_mult);

  -- ---- level
  v_new_total_xp := v_profile.total_xp + v_xp;
  v_new_level := level_for_xp(v_new_total_xp);
  if v_new_level > v_profile.current_level then
    v_level_bonus := v_new_level * 50;
  end if;

  -- ---- write the workout row
  insert into workouts (user_id, exercise_type, duration_min, intensity_level,
                        xp_earned, coins_earned, total_xp_after,
                        level_before, level_after, streak_count, notes)
  values (v_user_id, p_exercise_type, p_duration_min, p_intensity,
          v_xp, v_coins, v_new_total_xp,
          v_profile.current_level, v_new_level, v_streak, coalesce(p_notes, ''))
  returning * into v_workout;

  -- ---- badges
  v_prev_badges := v_profile.badges;
  v_new_badges := compute_badges(v_user_id, v_new_total_xp, v_new_level,
                                 greatest(v_profile.best_streak, v_streak));

  -- ---- update the profile counters
  update profiles set
    total_xp = v_new_total_xp,
    current_level = v_new_level,
    total_coins_earned = total_coins_earned + v_coins + v_level_bonus,
    current_streak = v_streak,
    best_streak = greatest(best_streak, v_streak),
    last_workout_day = v_today,
    badges = v_new_badges
  where id = v_user_id;

  -- ---- ledger entry for the level-up bonus
  if v_level_bonus > 0 then
    insert into coin_transactions (user_id, kind, item_id, amount, balance_after)
    values (v_user_id, 'level_bonus', 'level_' || v_new_level, v_level_bonus,
            v_profile.total_coins_earned + v_coins + v_level_bonus - v_profile.total_coins_spent);
  end if;

  return jsonb_build_object(
    'workout', to_jsonb(v_workout),
    'user', jsonb_build_object(
      'total_xp', v_new_total_xp,
      'current_level', v_new_level,
      'avatar_tier', avatar_tier_for_level(v_new_level),
      'coins', v_profile.total_coins_earned + v_coins + v_level_bonus - v_profile.total_coins_spent,
      'current_streak', v_streak,
      'best_streak', greatest(v_profile.best_streak, v_streak),
      'last_workout_day', v_today
    ),
    'level_up', case when v_level_bonus > 0 then jsonb_build_object(
      'new_level', v_new_level,
      'new_tier', avatar_tier_for_level(v_new_level),
      'bonus_coins', v_level_bonus
    ) end,
    'new_badges', to_jsonb(
      (select coalesce(array_agg(b), '{}') from unnest(v_new_badges) b
       where not (b = any(v_prev_badges)))
    )
  );
end;
$$;

-- ============================================================ purchase_accessory

create or replace function public.purchase_accessory(
  p_action text,
  p_accessory_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile profiles%rowtype;
  v_cost integer;
  v_balance integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_action not in ('purchase', 'equip', 'unequip') then
    raise exception 'invalid action' using errcode = '22023';
  end if;

  select * into v_profile from profiles where id = v_user_id for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  if p_action = 'unequip' then
    update profiles set equipped_accessory = null where id = v_user_id;
    return jsonb_build_object(
      'ok', true,
      'coins', v_profile.total_coins_earned - v_profile.total_coins_spent,
      'owned_accessories', to_jsonb(v_profile.owned_accessories),
      'equipped_accessory', null
    );
  end if;

  if p_action = 'equip' then
    if not (p_accessory_id = any(v_profile.owned_accessories)) then
      raise exception 'accessory not owned' using errcode = 'P0001';
    end if;
    update profiles set equipped_accessory = p_accessory_id where id = v_user_id;
    return jsonb_build_object(
      'ok', true,
      'coins', v_profile.total_coins_earned - v_profile.total_coins_spent,
      'owned_accessories', to_jsonb(v_profile.owned_accessories),
      'equipped_accessory', p_accessory_id
    );
  end if;

  -- purchase: price comes from the server-side catalog, never the client
  select cost into v_cost from accessories where id = p_accessory_id and is_active;
  if not found then
    raise exception 'unknown accessory' using errcode = '22023';
  end if;
  if p_accessory_id = any(v_profile.owned_accessories) then
    raise exception 'already owned' using errcode = 'P0001';
  end if;

  v_balance := v_profile.total_coins_earned - v_profile.total_coins_spent;
  if v_balance < v_cost then
    raise exception 'not enough coins' using errcode = 'P0001';
  end if;

  update profiles set
    total_coins_spent = total_coins_spent + v_cost,
    owned_accessories = owned_accessories || p_accessory_id,
    equipped_accessory = p_accessory_id
  where id = v_user_id;

  insert into coin_transactions (user_id, kind, item_id, amount, balance_after)
  values (v_user_id, 'purchase', p_accessory_id, -v_cost, v_balance - v_cost);

  return jsonb_build_object(
    'ok', true,
    'coins', v_balance - v_cost,
    'owned_accessories', to_jsonb(v_profile.owned_accessories || p_accessory_id),
    'equipped_accessory', p_accessory_id
  );
end;
$$;

-- ============================================================ get_leaderboard

create or replace function public.get_leaderboard(
  p_scope text default 'alltime',
  p_limit integer default 50
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_entries jsonb;
  v_me jsonb;
  v_week_start timestamptz;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  p_limit := least(coalesce(p_limit, 50), 100);

  if p_scope = 'weekly' then
    -- Monday 00:00 Asia/Dubai
    v_week_start := (date_trunc('week', now() at time zone 'Asia/Dubai')
                     at time zone 'Asia/Dubai');

    with weekly as (
      select w.user_id, sum(w.xp_earned)::integer as xp
      from workouts w
      where w.created_at >= v_week_start
      group by w.user_id
    ), ranked as (
      select p.id as user_id,
             coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' ||
                      coalesce(left(p.last_name, 1) || '.', '')), ''),
                      coalesce(p.full_name, 'Athlete')) as display_name,
             wk.xp as total_xp,
             p.current_level,
             avatar_tier_for_level(p.current_level) as avatar_tier,
             p.avatar_config,
             p.equipped_accessory,
             rank() over (order by wk.xp desc) as rank
      from weekly wk
      join profiles p on p.id = wk.user_id
      where p.onboarding_complete
    )
    select jsonb_agg(to_jsonb(r) order by r.rank) filter (where r.rank <= p_limit),
           to_jsonb((select r2 from ranked r2 where r2.user_id = v_user_id))
      into v_entries, v_me
      from ranked r;
  else
    with ranked as (
      select p.id as user_id,
             coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' ||
                      coalesce(left(p.last_name, 1) || '.', '')), ''),
                      coalesce(p.full_name, 'Athlete')) as display_name,
             p.total_xp,
             p.current_level,
             avatar_tier_for_level(p.current_level) as avatar_tier,
             p.avatar_config,
             p.equipped_accessory,
             rank() over (order by p.total_xp desc) as rank
      from profiles p
      where p.onboarding_complete and p.total_xp > 0
    )
    select jsonb_agg(to_jsonb(r) order by r.rank) filter (where r.rank <= p_limit),
           to_jsonb((select r2 from ranked r2 where r2.user_id = v_user_id))
      into v_entries, v_me
      from ranked r;
  end if;

  return jsonb_build_object(
    'entries', coalesce(v_entries, '[]'::jsonb),
    'me', v_me,
    'total_players', (select count(*) from profiles where onboarding_complete and total_xp > 0)
  );
end;
$$;

-- ============================================================ get_workout_stats
-- RPG stat radar for the Avatar Coach screen (port of the old getWorkoutStats).

create or replace function public.get_workout_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_strength numeric := 0;
  v_endurance numeric := 0;
  v_agility numeric := 0;
  v_recovery numeric := 0;
  w record;
  v_points numeric;
  v_total integer := 0;
  v_week integer := 0;
  v_intensity jsonb;
  v_types jsonb;
  v_recent jsonb;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  for w in
    select * from workouts where user_id = v_user_id
    order by created_at desc limit 20
  loop
    v_total := v_total + 1;
    if w.created_at >= now() - interval '7 days' then v_week := v_week + 1; end if;

    v_points := round(least(w.duration_min / 30.0, 3)
                * (case w.intensity_level when 'High' then 3 when 'Medium' then 2 else 1 end)
                * 10);

    if w.exercise_type in ('Weight Training', 'Bodyweight', 'Powerlifting', 'CrossFit', 'Resistance') then
      v_strength := v_strength + v_points;
    elsif w.exercise_type in ('Running', 'Cycling', 'Swimming', 'Cardio', 'Walking', 'Rowing') then
      v_endurance := v_endurance + v_points;
    elsif w.exercise_type in ('HIIT', 'Dance', 'Sports', 'Boxing', 'Kickboxing', 'Jump Rope', 'Basketball', 'Football') then
      v_agility := v_agility + v_points;
    elsif w.exercise_type in ('Yoga', 'Stretching', 'Pilates', 'Meditation', 'Rest') then
      v_recovery := v_recovery + v_points;
    else
      v_endurance := v_endurance + round(v_points * 0.5);
      v_agility := v_agility + round(v_points * 0.5);
    end if;
  end loop;

  select jsonb_build_object(
           'High',   count(*) filter (where intensity_level = 'High'),
           'Medium', count(*) filter (where intensity_level = 'Medium'),
           'Low',    count(*) filter (where intensity_level = 'Low'))
    into v_intensity
    from (select intensity_level from workouts where user_id = v_user_id
          order by created_at desc limit 20) t;

  select coalesce(jsonb_object_agg(exercise_type, cnt), '{}'::jsonb)
    into v_types
    from (select exercise_type, count(*) as cnt
          from (select exercise_type from workouts where user_id = v_user_id
                order by created_at desc limit 20) t
          group by exercise_type) g;

  select coalesce(jsonb_agg(jsonb_build_object(
           'exercise_type', exercise_type,
           'duration_min', duration_min,
           'intensity_level', intensity_level,
           'xp_earned', xp_earned,
           'date', created_at)), '[]'::jsonb)
    into v_recent
    from (select * from workouts where user_id = v_user_id
          order by created_at desc limit 5) t;

  return jsonb_build_object(
    'stats', jsonb_build_object(
      'strength',  least(100, round(v_strength / 5)),
      'endurance', least(100, round(v_endurance / 5)),
      'agility',   least(100, round(v_agility / 5)),
      'recovery',  least(100, round(v_recovery / 5))
    ),
    'summary', jsonb_build_object(
      'total', v_total,
      'this_week', v_week,
      'intensity_breakdown', coalesce(v_intensity, '{}'::jsonb),
      'type_frequency', v_types
    ),
    'recent_workouts', v_recent
  );
end;
$$;

-- ============================================================ get_monthly_stats
-- Monthly summary page (port of the old getMonthlyStats, same field names).

create or replace function public.get_monthly_stats(
  p_month integer default null,
  p_year integer default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_month integer := coalesce(p_month, extract(month from dubai_today())::integer);
  v_year integer := coalesce(p_year, extract(year from dubai_today())::integer);
  v_start date := make_date(v_year, v_month, 1);
  v_end date := (make_date(v_year, v_month, 1) + interval '1 month')::date;
  v_days integer := extract(day from (v_end - interval '1 day'))::integer;
  v_stats jsonb;
  v_breakdown jsonb;
  v_best jsonb;
  v_meal_cal numeric;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if v_month < 1 or v_month > 12 or v_year < 2020 or v_year > 2100 then
    raise exception 'invalid month/year' using errcode = '22023';
  end if;

  select coalesce(sum(calories), 0) into v_meal_cal
    from meal_logs
    where user_id = v_user_id and logged_date >= v_start and logged_date < v_end;

  with month_workouts as (
    select * from workouts
    where user_id = v_user_id
      and (created_at at time zone 'Asia/Dubai')::date >= v_start
      and (created_at at time zone 'Asia/Dubai')::date < v_end
  ), calc as (
    select *,
      round((case exercise_type
               when 'Weight Training' then 8 when 'Bodyweight' then 6
               when 'Cardio' then 10 when 'Running' then 12
               when 'Cycling' then 11 when 'HIIT' then 13
               when 'Yoga' then 4 when 'Swimming' then 11
               when 'Walking' then 5 else 8 end)
            * duration_min
            * (case intensity_level when 'Low' then 0.5 when 'High' then 1.5 else 1 end)
            / 60.0) as est_calories,
      (case when exercise_type in ('Weight Training', 'Bodyweight', 'Powerlifting', 'CrossFit')
            then 900 else 0 end) as est_weight
    from month_workouts
  )
  select jsonb_build_object(
           'totalWorkouts', count(*),
           'totalDuration', coalesce(sum(duration_min), 0),
           'totalXP', coalesce(sum(xp_earned), 0),
           'totalCaloriesBurned', coalesce(sum(est_calories), 0),
           'totalMealCalories', v_meal_cal,
           'totalWeightLifted', coalesce(sum(est_weight), 0),
           'averageCaloriesPerDay', round(v_meal_cal / v_days))
    into v_stats
    from calc;

  select coalesce(jsonb_object_agg(exercise_type, jsonb_build_object(
           'count', cnt, 'duration', dur, 'xp', xp)), '{}'::jsonb)
    into v_breakdown
    from (select exercise_type, count(*) as cnt, sum(duration_min) as dur,
                 sum(xp_earned) as xp
          from workouts
          where user_id = v_user_id
            and (created_at at time zone 'Asia/Dubai')::date >= v_start
            and (created_at at time zone 'Asia/Dubai')::date < v_end
          group by exercise_type) g;

  select to_jsonb(t) into v_best
    from (select created_at as date, exercise_type as exercise,
                 duration_min as duration, xp_earned as xp
          from workouts
          where user_id = v_user_id
            and (created_at at time zone 'Asia/Dubai')::date >= v_start
            and (created_at at time zone 'Asia/Dubai')::date < v_end
          order by xp_earned desc limit 1) t;

  return jsonb_build_object(
    'month', v_month,
    'year', v_year,
    'stats', v_stats,
    'breakdown', v_breakdown,
    'bestDay', v_best
  );
end;
$$;

-- ============================================================ permissions
-- RPCs are for logged-in users only.
revoke execute on function public.log_workout(text, integer, text, text) from public, anon;
revoke execute on function public.purchase_accessory(text, text) from public, anon;
revoke execute on function public.get_leaderboard(text, integer) from public, anon;
revoke execute on function public.get_workout_stats() from public, anon;
revoke execute on function public.get_monthly_stats(integer, integer) from public, anon;
revoke execute on function public.compute_badges(uuid, integer, integer, integer) from public, anon, authenticated;

grant execute on function public.log_workout(text, integer, text, text) to authenticated;
grant execute on function public.purchase_accessory(text, text) to authenticated;
grant execute on function public.get_leaderboard(text, integer) to authenticated;
grant execute on function public.get_workout_stats() to authenticated;
grant execute on function public.get_monthly_stats(integer, integer) to authenticated;
