-- Weekly workout target chosen during onboarding (drives the "This Week"
-- progress display). User-editable like other profile preferences.
alter table public.profiles
  add column if not exists weekly_goal integer not null default 3
  check (weekly_goal between 1 and 7);

grant update (weekly_goal) on public.profiles to authenticated;
