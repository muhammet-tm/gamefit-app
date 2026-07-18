-- Private bucket for meal photos (premium "snap a meal" feature).
-- Files live under <user_id>/<filename>; each user touches only their folder.
-- Display uses short-lived signed URLs; the coach-g Edge Function reads via
-- service role.

insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

create policy "upload own meal photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "read own meal photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "delete own meal photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
