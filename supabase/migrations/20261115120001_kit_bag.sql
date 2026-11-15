-- Kit Bag: real sports gear replaces the fantasy accessories (2026-11-15).
--
-- The athletes are painted illustrations, so the old items (War Crown, Angel
-- Wings and the rest) can no longer be drawn on them. The shop now sells
-- items in three slots, and a player equips one item per slot:
--   floor   a prop standing beside the athlete
--   wear    an item fitted on the athlete
--   finish  an effect that plays when a workout ends
--
-- The owner decided (14 Nov 2026) to refund the old items at their catalog
-- price rather than swap them for new ones. Old catalog rows are retired,
-- not deleted, because the coin ledger names them.
--
-- Deploy with `npx supabase db push` BEFORE the app update that calls
-- kit_bag(): the update has no fallback to purchase_accessory().

-- ============================================================ ledger
-- Refunds get their own kind so they read honestly in the history.
alter table public.coin_transactions drop constraint if exists coin_transactions_kind_check;
alter table public.coin_transactions add constraint coin_transactions_kind_check
  check (kind in ('purchase', 'level_bonus', 'adjustment', 'refund'));

-- ============================================================ catalog
alter table public.accessories drop constraint if exists accessories_category_check;
alter table public.accessories add constraint accessories_category_check
  check (category in ('head', 'aura', 'gear', 'back', 'badge', 'floor', 'wear', 'finish'));

update public.accessories
   set is_active = false
 where category in ('head', 'aura', 'gear', 'back', 'badge');

-- Prices must match KIT_ITEMS in src/components/avatar/kitbag.js, which
-- only displays them; this table is what purchases are charged against.
insert into public.accessories (id, label, emoji, cost, effect, category) values
  ('kettlebell',     'Kettlebell',     '', 150, 'Stands beside your athlete',  'floor'),
  ('boxing_gloves',  'Boxing gloves',  '', 130, 'Stands beside your athlete',  'floor'),
  ('water_bottle',   'Water bottle',   '',  60, 'Stands beside your athlete',  'floor'),
  ('gym_bag',        'Gym bag',        '', 120, 'Stands beside your athlete',  'floor'),
  ('yoga_block',     'Yoga block',     '',  60, 'Stands beside your athlete',  'floor'),
  ('sweatband',      'Sweatband',      '',  80, 'Worn on the head',            'wear'),
  ('training_cap',   'Training cap',   '', 100, 'Worn on the head',            'wear'),
  ('sport_glasses',  'Sport glasses',  '', 120, 'Worn over the eyes',          'wear'),
  ('finisher_medal', 'Finisher medal', '', 250, 'Worn on the chest',           'wear'),
  ('chalk_cloud',    'Chalk cloud',    '',  80, 'Plays when a workout ends',   'finish'),
  ('finish_tape',    'Finish tape',    '', 120, 'Plays when a workout ends',   'finish'),
  ('rank_confetti',  'Rank confetti',  '', 150, 'Plays when a workout ends',   'finish')
on conflict (id) do update
  set label = excluded.label, emoji = excluded.emoji, cost = excluded.cost,
      effect = excluded.effect, category = excluded.category, is_active = true;

-- ============================================================ refunds
-- Every retired item a player owns comes back at its catalog price. The
-- refund never exceeds what the player has spent, so a balance can only go
-- back to where it was, never above.
with owned as (
  select p.id as user_id,
         least(sum(a.cost), p.total_coins_spent)::integer as refund,
         array_agg(a.id order by a.id) as items
    from public.profiles p
    join public.accessories a
      on a.id = any(p.owned_accessories)
     and a.category in ('head', 'aura', 'gear', 'back', 'badge')
   group by p.id, p.total_coins_spent
), refunded as (
  update public.profiles p
     set total_coins_spent = p.total_coins_spent - o.refund,
         owned_accessories = array(
           select x from unnest(p.owned_accessories) as x where not (x = any(o.items))
         ),
         equipped_accessory = null
    from owned o
   where p.id = o.user_id
  returning p.id, p.total_coins_earned - p.total_coins_spent as balance_after,
            o.refund, o.items
)
insert into public.coin_transactions (user_id, kind, item_id, amount, balance_after)
select id, 'refund', array_to_string(items, ','), refund, balance_after
  from refunded
 where refund > 0;

-- ============================================================ equipped kit
-- One item per slot, e.g. {"floor": "kettlebell", "wear": "training_cap"}.
-- Not in the profiles UPDATE grant, so kit_bag() is the only way to set it.
alter table public.profiles
  add column if not exists equipped_kit jsonb not null default '{}'::jsonb;

-- ============================================================ kit_bag
-- The only write path for the Kit Bag: price and balance come from the
-- server, ownership is checked on equip, and every slot holds one item.
create or replace function public.kit_bag(
  p_action text,
  p_item_id text default null,
  p_slot text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile profiles%rowtype;
  v_item accessories%rowtype;
  v_balance integer;
  v_kit jsonb;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_action is null or p_action not in ('purchase', 'equip', 'unequip') then
    raise exception 'invalid action' using errcode = '22023';
  end if;

  select * into v_profile from profiles where id = v_user_id for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  v_kit := coalesce(v_profile.equipped_kit, '{}'::jsonb);
  v_balance := v_profile.total_coins_earned - v_profile.total_coins_spent;

  if p_action = 'unequip' then
    if p_slot is null or p_slot not in ('floor', 'wear', 'finish') then
      raise exception 'invalid slot' using errcode = '22023';
    end if;
    v_kit := v_kit - p_slot;
    update profiles set equipped_kit = v_kit where id = v_user_id;
    return jsonb_build_object(
      'ok', true,
      'coins', v_balance,
      'owned_accessories', to_jsonb(v_profile.owned_accessories),
      'equipped_kit', v_kit
    );
  end if;

  select * into v_item
    from accessories
   where id = p_item_id and is_active and category in ('floor', 'wear', 'finish');
  if not found then
    raise exception 'unknown item' using errcode = '22023';
  end if;

  if p_action = 'equip' then
    if not (p_item_id = any(v_profile.owned_accessories)) then
      raise exception 'item not owned' using errcode = 'P0001';
    end if;
  else
    if p_item_id = any(v_profile.owned_accessories) then
      raise exception 'already owned' using errcode = 'P0001';
    end if;
    if v_balance < v_item.cost then
      raise exception 'not enough coins' using errcode = 'P0001';
    end if;
    v_balance := v_balance - v_item.cost;
    update profiles
       set total_coins_spent = total_coins_spent + v_item.cost,
           owned_accessories = array_append(owned_accessories, p_item_id)
     where id = v_user_id;
    insert into coin_transactions (user_id, kind, item_id, amount, balance_after)
    values (v_user_id, 'purchase', p_item_id, -v_item.cost, v_balance);
  end if;

  -- Buying or equipping puts the item in its slot, replacing what was there.
  v_kit := jsonb_set(v_kit, array[v_item.category], to_jsonb(p_item_id));
  update profiles set equipped_kit = v_kit where id = v_user_id
  returning * into v_profile;

  return jsonb_build_object(
    'ok', true,
    'coins', v_balance,
    'owned_accessories', to_jsonb(v_profile.owned_accessories),
    'equipped_kit', v_kit
  );
end;
$$;

revoke execute on function public.kit_bag(text, text, text) from public, anon;
grant execute on function public.kit_bag(text, text, text) to authenticated;

-- The old single-slot shop function would let a cached client buy a new
-- item without putting it in a slot. Every old item is now retired, so it
-- has nothing left to sell.
drop function if exists public.purchase_accessory(text, text);

-- ============================================================ leaderboard
-- Same as before, but each entry carries equipped_kit instead of the retired
-- single accessory, so other players' gear shows on the podium.
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
             p.equipped_kit,
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
             p.equipped_kit,
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
