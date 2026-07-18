-- Fix: `text[] || 'literal'` resolves as array||array and Postgres tries to
-- parse the string as an array literal ("malformed array literal").
-- Use array_append everywhere an element is appended.

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

  if v_count >= 1   then v_badges := array_append(v_badges, 'first_sweat'); end if;
  if v_count >= 10  then v_badges := array_append(v_badges, 'ten_workouts'); end if;
  if v_count >= 50  then v_badges := array_append(v_badges, 'fifty_workouts'); end if;
  if v_count >= 100 then v_badges := array_append(v_badges, 'century'); end if;

  if p_best_streak >= 3  then v_badges := array_append(v_badges, 'streak_3'); end if;
  if p_best_streak >= 7  then v_badges := array_append(v_badges, 'streak_7'); end if;
  if p_best_streak >= 30 then v_badges := array_append(v_badges, 'streak_30'); end if;

  if p_total_xp >= 1000  then v_badges := array_append(v_badges, 'xp_1000'); end if;
  if p_total_xp >= 5000  then v_badges := array_append(v_badges, 'xp_5000'); end if;
  if p_total_xp >= 10000 then v_badges := array_append(v_badges, 'xp_10000'); end if;

  if v_types >= 5  then v_badges := array_append(v_badges, 'variety'); end if;
  if v_high >= 10  then v_badges := array_append(v_badges, 'high_intensity'); end if;

  if p_level >= 5  then v_badges := array_append(v_badges, 'level_5'); end if;
  if p_level >= 10 then v_badges := array_append(v_badges, 'level_10'); end if;

  return v_badges;
end;
$$;

-- purchase_accessory: same appending pattern made explicit (the typed
-- parameter resolved correctly, but array_append is unambiguous).
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
    owned_accessories = array_append(owned_accessories, p_accessory_id),
    equipped_accessory = p_accessory_id
  where id = v_user_id;

  insert into coin_transactions (user_id, kind, item_id, amount, balance_after)
  values (v_user_id, 'purchase', p_accessory_id, -v_cost, v_balance - v_cost);

  return jsonb_build_object(
    'ok', true,
    'coins', v_balance - v_cost,
    'owned_accessories', to_jsonb(array_append(v_profile.owned_accessories, p_accessory_id)),
    'equipped_accessory', p_accessory_id
  );
end;
$$;
