insert into storage.buckets (id, name, public) values
  ('public-site-assets','public-site-assets', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('private-documents','private-documents', false) on conflict (id) do nothing;

drop policy if exists "public read assets" on storage.objects;
create policy "public read assets" on storage.objects for select to anon
  using (bucket_id = 'public-site-assets');

drop policy if exists "admin write assets" on storage.objects;
create policy "admin write assets" on storage.objects for all to authenticated
  using (bucket_id in ('public-site-assets','private-documents') and private.is_admin())
  with check (bucket_id in ('public-site-assets','private-documents') and private.is_admin());
