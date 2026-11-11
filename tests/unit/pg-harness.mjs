// A real Postgres, in this process, shaped like the GameFit Supabase project.
//
// The retention figures are computed in SQL. A JavaScript copy of that
// arithmetic would only prove the copy is right, so these tests run the
// migration files themselves. PGlite is Postgres compiled to WebAssembly: no
// Docker, no server, nothing to install beyond `npm ci`.
//
// As a side effect, every run proves that all migrations in
// supabase/migrations still apply, in order, to an empty database.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../supabase/migrations',
);

// What a Supabase project already has before the first migration runs: the
// three API roles, the default privileges that hand every new table and
// function to those roles (which is exactly why each migration has to revoke),
// the auth schema, and the two storage tables the migrations touch.
const SUPABASE_SHIM = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on sequences to anon, authenticated, service_role;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;

  create schema storage;
  create table storage.buckets (
    id text primary key,
    name text,
    public boolean,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text,
    name text
  );
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[]
  language sql immutable as $$
    select (string_to_array(name, '/'))[1:cardinality(string_to_array(name, '/')) - 1]
  $$;
`;

/** Boot a database and apply every migration, oldest first. */
export async function createDatabase() {
  const db = await PGlite.create();
  await db.exec(SUPABASE_SHIM);

  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
    } catch (err) {
      throw new Error(`migration ${file} failed to apply: ${err.message}`);
    }
  }
  return db;
}

/** Run one statement and return its rows. */
export async function rows(db, sql, params = []) {
  return (await db.query(sql, params)).rows;
}

/**
 * Run `fn` as one of the API roles, the way PostgREST would: switch role, set
 * the JWT subject that auth.uid() reads, and always switch back.
 */
export async function asRole(db, role, userId, fn) {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? '']);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}
