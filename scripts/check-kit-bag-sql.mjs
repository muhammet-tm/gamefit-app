// Runs every GameFit migration in an embedded Postgres (PGlite) with small
// stand-ins for Supabase's auth and storage schemas, then exercises the Kit
// Bag migration: refunds of retired items, and kit_bag() purchase, equip,
// unequip and its refusals. Exits non-zero on the first failed expectation.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIG = fileURLToPath(new URL('../supabase/migrations', import.meta.url));
const db = new PGlite();
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) failures++; };

await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb, created_at timestamptz default now());
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select 'authenticated'::text $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
`);

// The two migrations before the Kit Bag, plus everything earlier.
const files = readdirSync(MIG).filter(f => f.endsWith('.sql')).sort();
const kit = files.find(f => f.includes('kit_bag'));
for (const f of files.filter(f => f !== kit)) {
  try { await db.exec(readFileSync(join(MIG, f), 'utf8')); console.log('applied', f); }
  catch (e) { console.log('ERROR in', f, '->', e.message); process.exit(1); }
}

// Two players before the change: A owns two old items (wings equipped),
// B owns nothing. A spent 380 of 1000 coins: 300 wings + 80 halo.
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
await db.exec(`
  insert into auth.users (id, email) values ('${A}', 'a@test.invalid'), ('${B}', 'b@test.invalid');
  update profiles set total_coins_earned = 1000, total_coins_spent = 380,
         owned_accessories = array['wings','halo'], equipped_accessory = 'wings',
         onboarding_complete = true, total_xp = 900 where id = '${A}';
  update profiles set total_coins_earned = 100, total_coins_spent = 0,
         onboarding_complete = true, total_xp = 50 where id = '${B}';
`);

try { await db.exec(readFileSync(join(MIG, kit), 'utf8')); console.log('applied', kit); }
catch (e) { console.log('ERROR in', kit, '->', e.message); process.exit(1); }

const one = async (sql, params) => (await db.query(sql, params)).rows[0];
const pa = await one(`select total_coins_earned - total_coins_spent as coins, owned_accessories, equipped_accessory, equipped_kit from profiles where id = $1`, [A]);
ok(pa.coins === 1000, `A refunded to 1000 coins (got ${pa.coins})`);
ok(pa.owned_accessories.length === 0, 'A no longer owns retired items');
ok(pa.equipped_accessory === null, 'A has nothing in the old slot');
const ledger = await one(`select kind, item_id, amount, balance_after from coin_transactions where user_id = $1`, [A]);
ok(ledger && ledger.kind === 'refund' && ledger.amount === 380 && ledger.balance_after === 1000 && ledger.item_id === 'halo,wings', `A has one refund row (${JSON.stringify(ledger)})`);
const pb = await one(`select count(*)::int as n from coin_transactions where user_id = $1`, [B]);
ok(pb.n === 0, 'B, who owned nothing, gets no refund row');
const active = await one(`select count(*) filter (where is_active)::int as on, count(*) filter (where not is_active)::int as off from accessories`);
ok(active.on === 12 && active.off === 10, `catalog: 12 active kit items, 10 retired (${active.on}/${active.off})`);

const as = async (uid, sql, params) => {
  await db.exec(`select set_config('test.uid', '${uid}', false)`);
  try { return { res: (await db.query(sql, params)).rows[0] }; } catch (e) { return { err: e.message }; }
};
const kitBag = (uid, action, item, slot) => as(uid, `select kit_bag($1, $2, $3) as r`, [action, item ?? null, slot ?? null]);

let r = await kitBag(A, 'purchase', 'kettlebell');
ok(r.res && r.res.r.coins === 850 && r.res.r.equipped_kit.floor === 'kettlebell', `A buys the kettlebell, 850 left, floor equipped (${JSON.stringify(r.res?.r ?? r.err)})`);
r = await kitBag(A, 'purchase', 'kettlebell');
ok(r.err && /already owned/.test(r.err), `buying it twice is refused (${r.err})`);
r = await kitBag(A, 'purchase', 'finisher_medal');
ok(r.res && r.res.r.equipped_kit.wear === 'finisher_medal' && r.res.r.equipped_kit.floor === 'kettlebell', 'a wear item fills its own slot and keeps the floor item');
r = await kitBag(A, 'purchase', 'water_bottle');
ok(r.res && r.res.r.equipped_kit.floor === 'water_bottle', 'a second floor item replaces the first in the slot');
r = await kitBag(A, 'equip', 'kettlebell');
ok(r.res && r.res.r.equipped_kit.floor === 'kettlebell' && r.res.r.coins === 540, `re-equipping an owned item costs nothing (${r.res?.r.coins})`);
r = await kitBag(A, 'unequip', null, 'wear');
ok(r.res && !('wear' in r.res.r.equipped_kit) && r.res.r.equipped_kit.floor === 'kettlebell', 'unequip clears only that slot');
r = await kitBag(B, 'equip', 'kettlebell');
ok(r.err && /not owned/.test(r.err), `B cannot equip what B does not own (${r.err})`);
r = await kitBag(B, 'purchase', 'finisher_medal');
ok(r.err && /not enough coins/.test(r.err), `B cannot afford 250 with 100 (${r.err})`);
r = await kitBag(B, 'purchase', 'wings');
ok(r.err && /unknown item/.test(r.err), `retired items cannot be bought (${r.err})`);
r = await kitBag(B, 'unequip', null, 'aura');
ok(r.err && /invalid slot/.test(r.err), `unknown slots are refused (${r.err})`);
r = await kitBag(B, 'gift', 'kettlebell');
ok(r.err && /invalid action/.test(r.err), `unknown actions are refused (${r.err})`);
r = await as('', `select kit_bag('purchase', 'kettlebell') as r`);
ok(r.err && /not authenticated/.test(r.err), `signed-out calls are refused (${r.err})`);
const old = await one(`select count(*)::int as n from pg_proc where proname = 'purchase_accessory'`);
ok(old.n === 0, 'the old purchase_accessory() is gone');
const spent = await one(`select sum(-amount)::int as s from coin_transactions where user_id = $1 and kind = 'purchase'`, [A]);
const coinsA = await one(`select total_coins_earned - total_coins_spent as c from profiles where id = $1`, [A]);
ok(spent.s === 460 && coinsA.c === 540, `ledger and balance agree (spent ${spent.s}, left ${coinsA.c})`);
r = await as(A, `select get_leaderboard('alltime', 10) as r`);
const entry = r.res?.r.entries.find(e => e.user_id === A);
ok(entry && entry.equipped_kit && entry.equipped_kit.floor === 'kettlebell' && !('equipped_accessory' in entry), 'leaderboard entries carry equipped_kit');
const grant = await one(`select has_column_privilege('authenticated', 'public.profiles', 'equipped_kit', 'UPDATE') as can`);
ok(grant.can === false, 'players cannot write equipped_kit directly');

// Running the migration a second time must not refund twice.
try { await db.exec(readFileSync(join(MIG, kit), 'utf8')); } catch (e) { console.log('rerun error:', e.message); }
const again = await one(`select count(*)::int as n from coin_transactions where user_id = $1 and kind = 'refund'`, [A]);
ok(again.n === 1, `a second run does not refund again (${again.n} refund rows)`);

console.log(failures ? `\n${failures} FAILED` : '\nall Kit Bag checks passed');
process.exit(failures ? 1 : 0);
