-- Security hardening: bounded uploads, and an AI credit check that cannot be
-- raced.
--
-- Both of these are "the check exists but is in the wrong place" bugs rather
-- than missing checks.

-- ============================================================ file uploads
--
-- The meal-photos bucket had no size or type limit. RLS scoped *where* a user
-- could write (their own folder), but nothing bounded *what* — a single client
-- could upload a 2 GB file, or an SVG, which is an XSS vector the moment it is
-- served back and rendered.
--
-- coach-g does check `bytes.length > 5MB`, but only after downloading the file
-- it is trying to protect itself from, which is too late to help.
--
-- 5 MB matches the limit coach-g already enforces. The MIME list is what the
-- Claude vision API actually accepts, so anything outside it could never have
-- been analysed anyway.
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array[
         'image/jpeg',
         'image/png',
         'image/webp',
         'image/gif'
       ]
 where id = 'meal-photos';

-- ============================================================ AI credit cap
--
-- The free tier allows 10 coaching requests a month. coach-g enforced it by
-- counting existing rows and then, much later, inserting one. Those are two
-- statements with a network round trip to Anthropic in between, so twenty
-- requests fired at once all read a count of zero, all pass the check, and all
-- bill. The cap was advisory, not enforced.
--
-- This makes reserving a credit a single atomic call. A transaction-scoped
-- advisory lock keyed on the user serialises concurrent requests from that one
-- user; different users never contend with each other. The lock releases when
-- the transaction ends, including on error.
--
-- Called by the Edge Function with the service-role key, which is why the user
-- id is a parameter: auth.uid() is null under service role. The function is
-- callable by nothing else (see the grants at the bottom), so a client cannot
-- pass someone else's id.
create or replace function public.consume_ai_credit(
  p_user_id      uuid,
  p_request_type text,
  p_month_key    text,
  p_limit        integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_used integer;
begin
  if p_user_id is null then
    raise exception 'user id required' using errcode = '22023';
  end if;

  -- Serialise this user's concurrent requests for the rest of the transaction.
  perform pg_advisory_xact_lock(hashtext('ai_credit:' || p_user_id::text));

  select count(*) into v_used
    from ai_request_logs
   where user_id = p_user_id
     and month_key = p_month_key;

  if v_used >= p_limit then
    return false;
  end if;

  insert into ai_request_logs (user_id, request_type, month_key, logged_date)
  values (p_user_id, p_request_type, p_month_key, (now() at time zone 'Asia/Dubai')::date);

  return true;
end;
$$;

-- Server-only. Clients must never be able to grant themselves credits or spend
-- someone else's.
revoke all on function public.consume_ai_credit(uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.consume_ai_credit(uuid, text, text, integer)
  to service_role;

-- Makes the count above an index scan rather than a sequential one, which
-- matters now that it runs while holding a lock.
create index if not exists ai_request_logs_user_month_idx
  on public.ai_request_logs (user_id, month_key);
