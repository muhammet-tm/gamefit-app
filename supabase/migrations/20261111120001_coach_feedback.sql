-- Coach feedback: the difficulty rating a user gives one of Coach G's plans or
-- answers (too easy / just right / too hard).
--
-- The Coach screen has always shown these three buttons, but the rating lived
-- in React state and was thrown away when the screen closed. Storing it is
-- what lets the coach-g Edge Function read a user's recent ratings, together
-- with their recent workouts, and adapt the next plan or answer. The rule that
-- turns ratings into an instruction is in
-- supabase/functions/_shared/adaptation.ts.
--
-- Unlike workouts or ai_request_logs, this table takes a direct client
-- insert: a rating carries no XP, coins or entitlement, so there is nothing
-- to cheat. It is still held to the minimum:
--
--   * a user reads and inserts only their own rows (RLS);
--   * a user supplies only request_type and rating. id, user_id and
--     created_at come from column defaults, so a rating cannot be dated into
--     the future to outrank newer ones, nor filed under another user;
--   * there is no client UPDATE or DELETE. Ratings are an append-only signal.
--     Rows leave with the account: profiles cascades from auth.users, and this
--     table cascades from profiles, which is what delete-account relies on.

create table public.coach_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  request_type text not null check (request_type in ('plan', 'chat', 'nutrition')),
  rating text not null check (rating in ('too_easy', 'just_right', 'too_hard')),
  created_at timestamptz not null default now()
);

comment on table public.coach_feedback is
  'Difficulty ratings (too_easy, just_right, too_hard) a user gives Coach G plans and answers. Read server-side by coach-g to adapt later coaching. Append-only for clients.';

-- coach-g reads "this user's newest few ratings"; this index is that query.
create index coach_feedback_user_created_idx
  on public.coach_feedback (user_id, created_at desc);

alter table public.coach_feedback enable row level security;

create policy "read own coach feedback"
  on public.coach_feedback for select
  to authenticated
  using (user_id = auth.uid());

create policy "insert own coach feedback"
  on public.coach_feedback for insert
  to authenticated
  with check (user_id = auth.uid());

-- No UPDATE or DELETE policy, and no grant for either: see the header.

-- Grants are spelled out in full rather than left to whatever a new table
-- receives by default. The earlier migrations revoke from a permissive
-- default; Supabase has been moving new tables to "not exposed unless
-- granted", and this file has to be correct under both. Revoking first and
-- then granting gives the same end state either way.
revoke all on public.coach_feedback from anon, authenticated;
grant select on public.coach_feedback to authenticated;
grant insert (request_type, rating) on public.coach_feedback to authenticated;
-- coach-g reads with the service-role key (which bypasses RLS, so the function
-- filters by the authenticated user id itself).
grant all on public.coach_feedback to service_role;
